#!/usr/bin/env python3
"""Convert a pinned regional Geofabrik PBF into a reproducible golf-only OSM XML snapshot."""
import argparse
import hashlib
import json
import tempfile
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


def snapshot(source, output, bounds=None, *, expected_sha=None):
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
    with tempfile.NamedTemporaryFile(dir=output.parent, prefix=output.name + ".", delete=False) as handle:
        temp = Path(handle.name)
    try:
        ET.ElementTree(root).write(temp, encoding="utf-8", xml_declaration=True)
        if expected_sha and file_sha(temp) != expected_sha:
            raise ValueError("derived snapshot checksum differs from the manifest pin")
        temp.replace(output)
    finally:
        temp.unlink(missing_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    pin = parser.add_mutually_exclusive_group(required=True)
    pin.add_argument("--sha256", help="legacy input PBF pin")
    pin.add_argument("--manifest", type=Path, help="verify both input and derived output pins")
    parser.add_argument("--bbox", type=float, nargs=4, metavar=("WEST", "SOUTH", "EAST", "NORTH"))
    args = parser.parse_args()
    source_pin, output_pin = args.sha256, None
    if args.manifest:
        manifest = json.loads(args.manifest.read_text())
        source_pin, output_pin = manifest.get("pbfSha256"), manifest.get("snapshotSha256")
        if not isinstance(output_pin, str) or not re.fullmatch(r"[a-f0-9]{64}", output_pin):
            parser.error("invalid snapshot pin in manifest")
    if not isinstance(source_pin, str) or not re.fullmatch(r"[a-f0-9]{64}", source_pin) or file_sha(args.source) != source_pin:
        parser.error("regional PBF checksum differs from the pinned source")
    if args.bbox and not (-180 <= args.bbox[0] < args.bbox[2] <= 180 and -90 <= args.bbox[1] < args.bbox[3] <= 90):
        parser.error("invalid snapshot bounding box")
    try:
        snapshot(args.source, args.output, args.bbox, expected_sha=output_pin)
    except ValueError as error:
        parser.error(str(error))


if __name__ == "__main__":
    main()
