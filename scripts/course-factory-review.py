#!/usr/bin/env python3
"""Discover course boundaries and propose conservative hole associations from pinned OSM XML."""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET

from shapely.affinity import affine_transform
from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import substring
from shapely.strtree import STRtree

KINDS = {"tee", "green", "fairway", "bunker", "water_hazard", "lateral_water_hazard"}
WATER = {"water_hazard", "lateral_water_hazard"}


class GolfSnapshot:
    def __init__(self, source):
        raw = source.read_bytes()
        self.sha = hashlib.sha256(raw).hexdigest()
        root = ET.fromstring(raw)
        if root.tag != "osm" or root.get("version") != "0.6" or root.get("license") != "https://opendatacommons.org/licenses/odbl/1-0/":
            raise ValueError("expected a licensed regional golf snapshot")
        nodes = {e.get("id"): (float(e.get("lon")), float(e.get("lat"))) for e in root.findall("node")}
        ways = {e.get("id"): e for e in root.findall("way")}
        self.elements = {e.tag[0] + e.get("id"): e for e in root}
        self.objects = {}
        for element in (*ways.values(), *root.findall("relation")):
            tags = {tag.get("k"): tag.get("v") for tag in element.findall("tag")}
            layer = "boundary" if tags.get("leisure") == "golf_course" else tags.get("golf")
            if layer not in KINDS | {"boundary", "hole"}:
                continue
            ref = element.tag[0] + element.get("id")
            try:
                shape = self.geometry(element, layer, ways, nodes)
            except (KeyError, ValueError):
                continue
            if shape is not None and shape.is_valid and not shape.is_empty:
                self.objects[ref] = (layer, tags, shape)
        self.refs = sorted(ref for ref, (kind, _, _) in self.objects.items() if kind != "boundary")
        self.index = STRtree([self.objects[ref][2] for ref in self.refs])

    @staticmethod
    def geometry(element, layer, ways, nodes):
        def coordinates(way):
            return [nodes[nd.get("ref")] for nd in way.findall("nd")]

        def closed(way):
            points = coordinates(way)
            if len(points) < 4 or points[0] != points[-1]:
                raise ValueError("open polygon ring")
            return points

        if element.tag == "way":
            return LineString(coordinates(element)) if layer == "hole" else Polygon(closed(element))
        members = element.findall("member")
        if any(m.get("type") != "way" or m.get("role") not in {"outer", "inner"} for m in members):
            return None
        outer = [closed(ways[m.get("ref")]) for m in members if m.get("role") == "outer"]
        inner = [closed(ways[m.get("ref")]) for m in members if m.get("role") == "inner"]
        if len(outer) == 1:
            return Polygon(outer[0], inner)
        if layer == "boundary" and outer and not inner:
            return MultiPolygon([Polygon(points) for points in outer])
        return None

    def discover(self, query=""):
        for ref, (layer, tags, shape) in sorted(self.objects.items()):
            name = tags.get("name", "")
            if layer != "boundary" or not name or query.casefold() not in name.casefold():
                continue
            route_refs = Counter(
                other_tags.get("ref")
                for i in self.index.query(shape)
                for kind, other_tags, other_shape in [self.objects[self.refs[i]]]
                if kind == "hole" and shape.covers(other_shape)
            )
            yield {"boundary": ref, "name": name, "tags": tags, "center": list(shape.centroid.coords[0]),
                   "unique_numbered_routes": sum(route_refs[str(i)] == 1 for i in range(1, 19))}

    def review(self, course, source_url):
        ref = course["boundary"]
        kind, tags, area = self.objects[ref]
        if kind != "boundary" or tags.get("name") != course["osmName"]:
            raise ValueError("boundary name does not match reviewed venue")
        center = area.centroid
        sx, sy = 111195 * math.cos(math.radians(center.y)), 111195

        def meters(shape):
            return affine_transform(shape, [sx, 0, 0, sy, -center.x * sx, -center.y * sy])

        boundary = meters(area)
        route_boundary = boundary.buffer(3)
        routes = defaultdict(list)
        layers = defaultdict(dict)
        for i in self.index.query(area.buffer(0.0001)):
            obj_ref = self.refs[i]
            layer, obj_tags, raw = self.objects[obj_ref]
            shape = meters(raw)
            if layer == "hole":
                number = obj_tags.get("ref")
                if number and number in {str(n) for n in range(1, 19)} and route_boundary.covers(shape):
                    routes[int(number)].append((obj_ref, shape, obj_tags.get("par")))
            elif boundary.covers(shape.representative_point()):
                layers["water" if layer in WATER else layer][obj_ref] = shape
        lines = {n: row[0] for n, row in routes.items() if len(row) == 1}
        holes = [{} for _ in range(18)]
        diagnostics = []
        assignments = defaultdict(list)
        for n, entry in enumerate(holes, 1):
            if n not in lines:
                diagnostics.append({"hole": n, "issue": "duplicate-route" if n in routes else "missing-route"})
                continue
            ref_id, route, mapped_par = lines[n]
            if not ref_id.startswith("w") or route.length <= 0:
                diagnostics.append({"hole": n, "issue": "invalid-route"})
                continue
            entry["route"] = ref_id[1:]
            if mapped_par is not None:
                entry["mappedPar"] = mapped_par
            for layer, endpoint in (("tee", route.coords[0]), ("green", route.coords[-1])):
                point = Point(endpoint)
                options = sorted(ref for ref, shape in layers[layer].items() if shape.covers(point))
                if len(options) == 1:
                    assignments[(layer, options[0])].append(n)
                else:
                    diagnostics.append({"hole": n, "issue": f"{layer}-{'ambiguous' if options else 'missing'}",
                                        "candidates": options})
        for (layer, feature), numbers in sorted(assignments.items()):
            if len(numbers) == 1:
                holes[numbers[0] - 1][layer] = [feature]
            else:
                diagnostics.extend({"hole": n, "issue": f"{layer}-shared-endpoint", "candidates": [feature]} for n in numbers)

        middles = {n: substring(route, 0.12, 0.9, normalized=True) for n, (_, route, _) in lines.items() if route.length > 0}
        for feature, shape in sorted(layers["fairway"].items()):
            owners = [n for n, middle in middles.items() if middle.intersection(shape).length >= 10]
            if len(owners) == 1:
                holes[owners[0] - 1].setdefault("fairway", []).append(feature)
        for layer in ("bunker", "water"):
            for feature, shape in sorted(layers[layer].items()):
                ranked = sorted((line.distance(shape), n) for n, (_, line, _) in lines.items())
                if ranked and ranked[0][0] <= 25 and (len(ranked) == 1 or ranked[1][0] - ranked[0][0] >= 10):
                    holes[ranked[0][1] - 1].setdefault(layer, []).append(feature)

        for n, hole in enumerate(holes, 1):
            if "route" in hole and not hole.get("fairway"):
                diagnostics.append({"hole": n, "issue": "no-unambiguous-fairway"})
        review = {"course_ref": course["mapRef"], "boundary_type": "way" if ref.startswith("w") else "relation",
                  "boundary": ref[1:], "identity": {k: v for k, v in tags.items()
                  if k in {"name", "leisure", "addr:city", "addr:state", "addr:housenumber", "addr:street"}},
                  "source": source_url, "sha256": self.sha, "holes": holes}
        return review, diagnostics

    def write_subset(self, review, path):
        refs = {review["boundary_type"][0] + review["boundary"]}
        for hole in review["holes"]:
            if "route" in hole:
                refs.add("w" + hole["route"])
            for layer in ("tee", "green", "fairway", "bunker", "water"):
                refs.update(hole.get(layer, []))
        for ref in sorted(refs):
            if ref.startswith("r"):
                refs.update("w" + member.get("ref") for member in self.elements[ref].findall("member"))
        for ref in sorted(refs):
            if ref.startswith("w"):
                refs.update("n" + node.get("ref") for node in self.elements[ref].findall("nd"))
        root = ET.Element("osm", version="0.6", license="https://opendatacommons.org/licenses/odbl/1-0/")
        root.extend(self.elements[ref] for ref in sorted(refs, key=lambda ref: (ref[0], int(ref[1:]))))
        ET.ElementTree(root).write(path, encoding="utf-8", xml_declaration=True)
        review["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("snapshot", type=Path)
    parser.add_argument("--query", default="")
    parser.add_argument("--rank", action="store_true", help="Rank named boundaries by route and polygon coverage")
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--subsets", type=Path)
    args = parser.parse_args()
    data = GolfSnapshot(args.snapshot)
    if not args.manifest:
        rows = list(data.discover(args.query))
        if args.rank:
            rows = [row for row in rows if row["unique_numbered_routes"] >= 17]
            for row in rows:
                review, _ = data.review({**row, "osmName": row["name"], "mapRef": ""}, "")
                row["counts"] = {layer: sum(bool(hole.get(layer)) for hole in review["holes"])
                                 for layer in ("route", "tee", "green", "fairway")}
            rows.sort(key=lambda row: (min(row["counts"].values()), sum(row["counts"].values())),
                      reverse=True)
        print(json.dumps(rows, indent=2))
        return
    manifest = json.loads(args.manifest.read_text())
    if data.sha != manifest["snapshotSha256"]:
        parser.error("golf snapshot differs from the pinned source")
    output = {}
    for course in manifest["courses"]:
        if course["boundary"] is None:
            output[course["id"]] = {"issues": [{"issue": "boundary-unverified",
                                               "detail": course["geometryBlocker"]}]}
            continue
        try:
            review, issues = data.review(course, manifest["source"])
            if args.subsets and all("route" in hole for hole in review["holes"]):
                data.write_subset(review, args.subsets / (course["id"] + ".osm"))
            output[course["id"]] = {"review": review, "issues": issues}
        except (KeyError, ValueError) as error:
            output[course["id"]] = {"issues": [{"issue": "boundary-unverified", "detail": str(error)}]}
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
