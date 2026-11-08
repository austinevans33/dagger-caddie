#!/usr/bin/env python3
"""Convert a pinned regional Geofabrik PBF into a reproducible golf-only OSM XML snapshot."""
import argparse
import hashlib
import re
from pathlib import Path
import xml.etree.ElementTree as ET

import osmium

LICENSE = "https://opendatacommons.org/licenses/odbl/1-0/"
GOLF = {"hole", "tee", "green", "fairway", "bunker", "water_hazard", "lateral_water_hazard"}
TAGS = {"golf", "leisure", "type", "name", "ref", "par", "website", "contact:website",
        "addr:city", "addr:state", "addr:postcode", "addr:housenumber", "addr:street"}


def relevant(tags):
    return tags.get("leisure") == "golf_course" or tags.get("golf") in GOLF


def file_sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def extract(source, bounds=None):
    relations = []
    required_ways = set()
    for relation in osmium.FileProcessor(source, osmium.osm.RELATION):
        if relevant(relation.tags):
            members = [(member.type, member.ref, member.role) for member in relation.members]
            required_ways.update(ref for kind, ref, _ in members if kind == "w")
            relations.append((relation.id, members, dict(relation.tags)))

    required_nodes = set()
    ways = []
    for obj in osmium.FileProcessor(source, osmium.osm.WAY):
        if not (obj.id in required_ways or relevant(obj.tags)):
            continue
        refs = [node.ref for node in obj.nodes]
        required_nodes.update(refs)
        ways.append((obj.id, refs, dict(obj.tags)))
    nodes = {}
    for node in osmium.FileProcessor(source, osmium.osm.NODE).with_filter(osmium.filter.IdFilter(required_nodes)):
        if node.location.valid() and (bounds is None or
                (bounds[0] <= node.lon <= bounds[2] and bounds[1] <= node.lat <= bounds[3])):
            nodes[node.id] = (node.lon, node.lat)
    if bounds is not None:
        ways = [way for way in ways if all(ref in nodes for ref in way[1])]
        way_ids = {ref for ref, _, _ in ways}
        relations = [row for row in relations if all(kind == "w" and ref in way_ids for kind, ref, _ in row[1])]
        retained = {ref for _, refs, _ in ways for ref in refs}
        nodes = {ref: value for ref, value in nodes.items() if ref in retained}
    return nodes, ways, relations


def snapshot(source, output, bounds=None):
    nodes, ways, relations = extract(source, bounds)
    root = ET.Element("osm", version="0.6", license=LICENSE)
    for ref, (lon, lat) in sorted(nodes.items()):
        ET.SubElement(root, "node", id=str(ref), lon=str(lon), lat=str(lat))
    for ref, children, tags in sorted(ways):
        element = ET.SubElement(root, "way", id=str(ref))
        for node in children:
            ET.SubElement(element, "nd", ref=str(node))
        for key in sorted(TAGS & tags.keys()):
            ET.SubElement(element, "tag", k=key, v=tags[key])
    kinds = {"w": "way", "r": "relation", "n": "node"}
    for ref, members, tags in sorted(relations):
        element = ET.SubElement(root, "relation", id=str(ref))
        for kind, child, role in members:
            ET.SubElement(element, "member", type=kinds[kind], ref=str(child), role=role)
        for key in sorted(TAGS & tags.keys()):
            ET.SubElement(element, "tag", k=key, v=tags[key])
    temp = output.with_suffix(output.suffix + ".tmp")
    ET.ElementTree(root).write(temp, encoding="utf-8", xml_declaration=True)
    temp.replace(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--sha256", required=True)
    parser.add_argument("--bbox", type=float, nargs=4, metavar=("WEST", "SOUTH", "EAST", "NORTH"))
    args = parser.parse_args()
    if not re.fullmatch(r"[a-f0-9]{64}", args.sha256) or file_sha(args.source) != args.sha256:
        parser.error("regional PBF checksum differs from the pinned source")
    if args.bbox and not (-180 <= args.bbox[0] < args.bbox[2] <= 180 and -90 <= args.bbox[1] < args.bbox[3] <= 90):
        parser.error("invalid snapshot bounding box")
    snapshot(args.source, args.output, args.bbox)


if __name__ == "__main__":
    main()
