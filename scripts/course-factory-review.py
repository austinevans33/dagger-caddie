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
from shapely.ops import substring, unary_union
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
        if layer == "boundary" and outer:
            shells = [Polygon(points) for points in outer]
            holes_by_shell = defaultdict(list)
            for ring in inner:
                cutout = Polygon(ring)
                if not cutout.is_valid:
                    return None
                owners = [i for i, shell in enumerate(shells) if shell.contains_properly(cutout)]
                if len(owners) != 1:
                    return None
                cutouts = holes_by_shell[owners[0]]
                if any(cutout.relate_pattern(other, "T********") for other in cutouts):
                    return None
                cutouts.append(cutout)
            # Adjacent excluded parcels can share edges. Union only their
            # interiors' exclusions and retain every original outer boundary.
            return MultiPolygon([shell.difference(unary_union(holes_by_shell[i])) if holes_by_shell[i] else shell
                                 for i, shell in enumerate(shells)])
        return None

    def discover(self, query="", hole_count=18):
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
                   "unique_numbered_routes": sum(route_refs[str(i)] == 1 for i in range(1, hole_count + 1))}

    def review(self, course, source_url):
        ref = course["boundary"]
        kind, tags, area = self.objects[ref]
        if kind != "boundary" or tags.get("name") != course["osmName"]:
            raise ValueError("boundary name does not match reviewed venue")
        hole_count = course.get("holeCount", 18)
        if hole_count not in (9, 18, 27):
            raise ValueError("physical hole count must be 9, 18 or 27")
        source_order = course.get("sourceHoleOrder", list(range(1, hole_count + 1)))
        if (not isinstance(source_order, list) or any(type(n) is not int for n in source_order)
                or sorted(source_order) != list(range(1, hole_count + 1))):
            raise ValueError("reviewed source hole order must be a complete permutation")
        source_to_card = {str(source): number for number, source in enumerate(source_order, 1)}
        route_name = course.get("routeName")
        if route_name is not None and (not isinstance(route_name, str) or not route_name.strip()):
            raise ValueError("shared venue route name must be explicit")
        center = area.centroid
        sx, sy = 111195 * math.cos(math.radians(center.y)), 111195

        def meters(shape):
            return affine_transform(shape, [sx, 0, 0, sy, -center.x * sx, -center.y * sy])

        boundary = meters(area)
        route_boundary = boundary.buffer(3)
        routes = defaultdict(list)
        outside_routes = defaultdict(list)
        other_routes = []
        layers = defaultdict(dict)
        for i in self.index.query(area.buffer(0.0001)):
            obj_ref = self.refs[i]
            layer, obj_tags, raw = self.objects[obj_ref]
            shape = meters(raw)
            if layer == "hole":
                number = source_to_card.get(obj_tags.get("ref"))
                if route_name is not None and obj_tags.get("name") != route_name:
                    if route_boundary.intersects(shape) and shape.length > 0:
                        other_routes.append(shape)
                    continue
                if number is None:
                    continue
                if route_boundary.covers(shape):
                    routes[number].append((obj_ref, shape, obj_tags.get("par")))
                elif all(route_boundary.covers(Point(p)) for p in (shape.coords[0], shape.coords[-1])):
                    outside_routes[number].append(obj_ref)
            elif boundary.covers(shape.representative_point()):
                layers["water" if layer in WATER else layer][obj_ref] = shape
        lines = {n: row[0] for n, row in routes.items() if len(row) == 1}
        holes = [{} for _ in range(hole_count)]
        diagnostics = []
        assignments = defaultdict(list)
        for n, entry in enumerate(holes, 1):
            if n not in lines:
                if n in routes:
                    diagnostics.append({"hole": n, "issue": "duplicate-route"})
                elif n in outside_routes:
                    diagnostics.append({"hole": n, "issue": "route-crosses-boundary",
                                        "candidates": sorted(outside_routes[n])})
                else:
                    diagnostics.append({"hole": n, "issue": "missing-route"})
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
            endpoint = 0 if layer == "tee" else -1
            overlaps_other = any(layers[layer][feature].covers(Point(line.coords[endpoint])) for line in other_routes)
            if len(numbers) == 1 and not overlaps_other:
                holes[numbers[0] - 1][layer] = [feature]
            else:
                diagnostics.extend({"hole": n, "issue": f"{layer}-shared-endpoint", "candidates": [feature]} for n in numbers)

        middles = {n: substring(route, 0.12, 0.9, normalized=True) for n, (_, route, _) in lines.items() if route.length > 0}
        other_middles = [substring(route, 0.12, 0.9, normalized=True) for route in other_routes]
        for feature, shape in sorted(layers["fairway"].items()):
            owners = [n for n, middle in middles.items() if middle.intersection(shape).length >= 10]
            if len(owners) == 1 and not any(line.intersection(shape).length >= 10 for line in other_middles):
                holes[owners[0] - 1].setdefault("fairway", []).append(feature)
        for layer in ("bunker", "water"):
            for feature, shape in sorted(layers[layer].items()):
                ranked = sorted((line.distance(shape), n) for n, (_, line, _) in lines.items())
                if (ranked and ranked[0][0] <= 25
                        and (len(ranked) == 1 or ranked[1][0] - ranked[0][0] >= 10)
                        and all(line.distance(shape) - ranked[0][0] >= 10 for line in other_routes)):
                    holes[ranked[0][1] - 1].setdefault(layer, []).append(feature)

        for n, hole in enumerate(holes, 1):
            if "route" in hole and not hole.get("fairway"):
                diagnostics.append({"hole": n, "issue": "no-unambiguous-fairway"})
        review = {"course_ref": course["mapRef"], "boundary_type": "way" if ref.startswith("w") else "relation",
                  "boundary": ref[1:], "identity": {k: v for k, v in tags.items()
                  if k in {"name", "leisure", "addr:city", "addr:state", "addr:housenumber", "addr:street"}},
                  "source": source_url, "sha256": self.sha, "holes": holes}
        if route_name is not None:
            review["routeName"] = route_name
        if "sourceHoleOrder" in course:
            review["sourceHoleOrder"] = source_order
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
    parser.add_argument("--hole-count", type=int, choices=(9, 18, 27), default=18,
                        help="Physical hole count for discovery only")
    parser.add_argument("--rank", action="store_true", help="Rank named boundaries by route and polygon coverage")
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--subsets", type=Path)
    args = parser.parse_args()
    data = GolfSnapshot(args.snapshot)
    if not args.manifest:
        rows = list(data.discover(args.query, args.hole_count))
        if args.rank:
            rows = [row for row in rows if row["unique_numbered_routes"] >= args.hole_count - 1]
            for row in rows:
                review, _ = data.review({**row, "osmName": row["name"], "mapRef": "",
                                         "holeCount": args.hole_count}, "")
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
            if args.subsets and len(review["holes"]) == 18 and all("route" in hole for hole in review["holes"]):
                data.write_subset(review, args.subsets / (course["id"] + ".osm"))
            output[course["id"]] = {"review": review, "issues": issues}
        except (KeyError, ValueError) as error:
            output[course["id"]] = {"issues": [{"issue": "boundary-unverified", "detail": str(error)}]}
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
