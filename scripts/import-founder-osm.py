#!/usr/bin/env python3
"""Build a reviewed course bundle from a pinned OSM API 0.6 XML extract.

Requires Shapely 2.1.2 (offline maintainer tooling only). Polygon and route
assignments are reviewed OSM element IDs. The importer validates them and
preserves their coordinates, interior rings, and attribution.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import substring

LAYERS = {"water_hazard": "water", "lateral_water_hazard": "water"}
ODBL = "https://opendatacommons.org/licenses/odbl/1-0/"


def tags(element):
    return {tag.attrib["k"]: tag.attrib["v"] for tag in element.findall("tag")}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def build_bundle(review, osm):
    digest = hashlib.sha256(osm).hexdigest()
    require(digest == review["sha256"], "OSM source checksum differs from the reviewed extract")
    root = ET.fromstring(osm)
    require(root.tag == "osm" and root.get("version") == "0.6" and
            root.get("license", "").replace("http:", "https:") == ODBL, "Unexpected OSM source or license")
    nodes = {n.get("id"): (float(n.get("lon")), float(n.get("lat"))) for n in root.findall("node")}
    ways = {w.get("id"): w for w in root.findall("way")}
    relations = {r.get("id"): r for r in root.findall("relation")}
    boundary_type = review.get("boundary_type", "relation")
    require(boundary_type in {"way", "relation"}, "Unsupported OSM course boundary type")
    course = (ways if boundary_type == "way" else relations)[review["boundary"]]
    require(all(tags(course).get(k) == v for k, v in review["identity"].items()),
            "Course boundary identity differs from the review")

    def coordinates(way):
        return [nodes[nd.attrib["ref"]] for nd in way.findall("nd")]

    def rings(element):
        if element.tag == "way":
            return [coordinates(element)]
        members = element.findall("member")
        outers = [m for m in members if m.get("role") == "outer"]
        require(len(outers) == 1 and all(m.get("type") == "way" and m.get("role") in {"outer", "inner"}
                                        for m in members), "Review requires one resolved outer ring per relation")
        return [coordinates(ways[m.attrib["ref"]]) for m in outers + [m for m in members if m.get("role") == "inner"]]

    outers = course.findall("member[@role='outer']")
    if len(outers) > 1:
        require(all(m.get("type") == "way" and m.get("role") == "outer" for m in course.findall("member")),
                "Multi-part boundary requires separate closed outer ways")
        boundary_parts = [[coordinates(ways[m.attrib["ref"]])] for m in outers]
    else:
        boundary_parts = [rings(course)]
    center = Polygon(boundary_parts[0][0]).centroid
    scale = 111195 * math.cos(math.radians(center.y))

    def local(points):
        return [((x - center.x) * scale, (y - center.y) * 111195) for x, y in points]

    def polygon(all_rings):
        require(all(len(r) >= 4 and r[0] == r[-1] for r in all_rings), "Unclosed polygon ring")
        outer, *inner = map(local, all_rings)
        shape = Polygon(outer, inner)
        require(shape.is_valid and shape.area > 0, "Invalid polygon in reviewed source")
        return shape

    polygons = [polygon(part) for part in boundary_parts]
    boundary = polygons[0] if len(polygons) == 1 else MultiPolygon(polygons)
    require(boundary.is_valid, "Overlapping or invalid course boundary parts")
    require(len(review["holes"]) == 18, "Expected all 18 hole entries in course review")
    output = []
    used = {}

    def add_feature(kind, ref, hole, geometry_type, coords):
        previous = used.get(ref)
        if previous is not None:
            properties = previous["properties"]
            require(kind == properties["layer"] == "fairway" and hole not in properties["holes"],
                    f"Duplicate assigned OSM element {ref}")
            properties["holes"].append(hole)
            return
        feature = {"type": "Feature", "properties": {"layer": kind, "holes": [hole], "osm": ref},
                   "geometry": {"type": geometry_type, "coordinates": coords}}
        used[ref] = feature
        output.append(feature)

    for number, hole in enumerate(review["holes"], 1):
        route_id = hole["route"]
        way = ways[route_id]
        coords = coordinates(way)
        require(tags(way).get("golf") == "hole" and tags(way).get("ref") == str(number),
                f"Route {route_id} does not identify hole {number}")
        reference = hole.get("reference_tee")
        tee_alignment = hole.get("tee_alignment")
        if tee_alignment is not None:
            require(reference is None and len(hole.get("tee", [])) == 1 and tee_alignment.get("source"),
                    f"Hole {number} tee alignment requires one mapped tee and independent evidence")
            ref = hole["tee"][0]
            require(ref.startswith("w"), f"Hole {number} tee alignment requires a mapped tee way")
            tee_rings = rings(ways[ref[1:]])
            tee_shape = polygon(tee_rings)
            start = Polygon(tee_rings[0], tee_rings[1:]).representative_point().coords[0]
            require(tee_shape.distance(Point(local(coords)[0])) <= 25 and
                    Point(local(coords)[0]).distance(Point(local([start])[0])) <= 30,
                    f"Hole {number} tee alignment moves the route start too far")
            coords = [start, *coords[1:]]
        if reference is not None:
            require(not hole.get("tee") and reference.get("source") and reference.get("method"),
                    f"Hole {number} reference tee requires provenance and no conflicting tee outline")
            if "start" in reference:
                start = reference["start"]
                require(isinstance(start, list) and len(start) == 2 and all(math.isfinite(v) for v in start),
                        f"Hole {number} reference tee coordinate is invalid")
                require(tags(way).get("par") == "3",
                        f"Hole {number} shortened reference line is only supported for mapped par threes")
                coords = [start, coords[-1]]
        route = LineString(local(coords))
        require(route.is_valid and route.length > 0 and boundary.buffer(3).covers(route),
                f"Hole {number} route lies outside the matched course")
        add_feature("hole", "w" + route_id, number, "LineString", coords)
        if reference is not None:
            output[-1]["properties"]["reference_tee"] = reference
        if tee_alignment is not None:
            output[-1]["properties"]["tee_alignment"] = tee_alignment
        middle = substring(route, 0.12, 0.9, normalized=True)
        for kind in ("tee", "green", "fairway", "bunker", "water"):
            for ref in hole.get(kind, []):
                require(ref[0] in {"w", "r"}, f"Invalid OSM feature reference {ref}")
                element = (ways if ref[0] == "w" else relations)[ref[1:]]
                element_tags = tags(element)
                element_kind = element_tags.get("golf")
                confirmed_pond = (kind == "water" and element_kind is None and
                                  element_tags.get("natural") == "water" and
                                  bool(review.get("water_evidence", {}).get(ref)))
                require(LAYERS.get(element_kind, element_kind) == kind or confirmed_pond,
                        f"Incorrect golf tag for {ref}")
                all_rings = rings(element)
                shape = polygon(all_rings)
                require(boundary.covers(shape.representative_point()), f"Feature {ref} belongs outside the course")
                if kind in {"tee", "green"}:
                    anchor = Point(route.coords[0 if kind == "tee" else -1])
                    require(shape.covers(anchor), f"Route for hole {number} does not touch {ref}")
                elif kind == "fairway":
                    require(middle.intersection(shape).length >= 10 or
                            (middle.distance(shape) <= 18 and route.intersection(shape).length >= 4),
                            f"Fairway {ref} does not meet the reviewed hole {number} route")
                else:
                    require(route.distance(shape) <= 30, f"Hazard {ref} too far from hole {number} route")
                add_feature(kind, ref, number, "Polygon", all_rings)
    boundary_key = "osm_way" if boundary_type == "way" else "osm_relation"
    return {"type": "FeatureCollection", "metadata": {
        "course_ref": review["course_ref"], boundary_key: review["boundary"], "source": review["source"],
        "source_sha256": digest, "copyright": "© OpenStreetMap contributors",
        "attribution": "https://www.openstreetmap.org/copyright", "license": ODBL,
    }, "features": output}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("review", type=Path)
    parser.add_argument("osm", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    bundle = build_bundle(json.loads(args.review.read_text()), args.osm.read_bytes())
    # Keep the repository diff readable without expanding each point to four lines.
    head = json.dumps({k: v for k, v in bundle.items() if k != "features"}, ensure_ascii=False)
    features = ",\n".join("  " + json.dumps(f, separators=(",", ":")) for f in bundle["features"])
    args.output.write_text(head[:-1] + ',\n"features":[\n' + features + '\n]}\n', encoding="utf-8")


if __name__ == "__main__":
    main()
