#!/usr/bin/env python3
"""Rebuild the reviewed Rock reference layout from pinned OSM and aerial review."""
import argparse
import copy
import gzip
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "qa-scorecard/shining-rock/source.json.gz"
REVIEW = ROOT / "qa-scorecard/shining-rock/review.json"
OUTPUT = ROOT / "app/61f9e9de0a/course-art/shining-rock-northbridge-ma.json"


def matching_ring(candidate, raw):
    if len(candidate) != len(raw):
        return False
    def close(a, b):
        return max(abs(a[0]-b[0]), abs(a[1]-b[1])) <= 0.0000007
    # Closed rings may start at another vertex or run in the reverse direction.
    left, right = candidate[:-1], raw[:-1]
    for sequence in (right, list(reversed(right))):
        for offset, point in enumerate(sequence):
            if close(left[0], point) and all(close(p, sequence[(i+offset) % len(sequence)]) for i, p in enumerate(left)):
                return True
    return False


def build():
    review = json.loads(REVIEW.read_text())
    raw = SOURCE.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == review["source_sha256"], "Source pin differs"
    source = json.loads(gzip.decompress(raw))
    nodes = {n["id"]: n for n in source["osm"]["nodes"]}
    ways = {w["id"]: w for w in source["osm"]["ways"]}
    relations = {r["id"]: r for r in source["osm"]["relations"]}
    assert [h["number"] for h in review["holes"]] == list(range(1, 19))
    assert all(h["status"] == "reviewed-reference-layout" and all(h["checks"].values()) for h in review["holes"])

    def coordinates(way):
        return [[nodes[n]["lon"], nodes[n]["lat"]] for n in way["nodes"]]

    result = []
    for original in source["candidate"]["features"]:
        props = original["properties"]
        layer = props["layer"]
        if layer not in {"hole", "tee", "green", "fairway", "bunker", "water"} or props["osm_id"] in review["excluded"]:
            continue
        kind, identifier = props["osm_id"].split("/")
        element = (ways if kind == "way" else relations)[int(identifier)]
        assert element["version"] == props["osm_version"], props["osm_id"]
        tags = element.get("tags", {})
        if layer == "water":
            assert tags.get("golf") == "water_hazard" or tags.get("natural") == "water" or tags.get("waterway"), props["osm_id"]
        else:
            assert tags.get("golf") == layer, props["osm_id"]
        assert props["holes"] and all(1 <= n <= 18 for n in props["holes"])
        if layer == "hole":
            assert tags.get("ref") == str(props["holes"][0])
            assert tags.get("golf:links") == "Rock"
        feature = copy.deepcopy(original)
        if kind == "way":
            points = coordinates(element)
            if layer == "hole":
                candidate = original["geometry"]["coordinates"]
                assert len(candidate) == len(points)
                assert all(max(abs(a[0]-b[0]), abs(a[1]-b[1])) <= 0.0000007 for a, b in zip(candidate, points))
                feature["geometry"] = {"type": "LineString", "coordinates": points}
            else:
                assert points[0] == points[-1]
                assert matching_ring(original["geometry"]["coordinates"][0], points), props["osm_id"]
                feature["geometry"] = {"type": "Polygon", "coordinates": [points]}
        else:
            outer = [m for m in element["members"] if m["type"] == "way" and m["role"] == "outer"]
            assert len(outer) == 1, props["osm_id"]
            ring = coordinates(ways[outer[0]["ref"]])
            assert matching_ring(original["geometry"]["coordinates"][0], ring), props["osm_id"]
            interiors = [coordinates(ways[m["ref"]]) for m in element["members"] if m["type"] == "way" and m["role"] == "inner"]
            assert all(r[0] == r[-1] for r in [ring, *interiors])
            feature["geometry"] = {"type": "Polygon", "coordinates": [ring, *interiors]}
        feature["properties"].update(verified=True, verification="OSM source and MassGIS 2025 aerial review")
        result.append(feature)
    metadata = {
        "course_ref": review["course_ref"], "reviewed": review["reviewed"],
        "osm": {"licence": "ODbL-1.0", "attribution": "© OpenStreetMap contributors", "share_alike": True},
        "imagery": {"source": review["imagery"]["source"], "year": 2025, "credit": "MassGIS"},
        "reviewed_holes": list(range(1, 19)), "reference_layout": True,
        "selected_tee_positions_verified": False, "limitations": review["limitations"],
        "review_sha256": hashlib.sha256(REVIEW.read_bytes()).hexdigest()
    }
    return (json.dumps({"type": "FeatureCollection", "metadata": metadata, "features": result}, separators=(",", ":")) + "\n").encode()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = build()
    if args.check:
        assert OUTPUT.read_bytes() == content, "Reviewed book differs from pinned sources"
    else:
        OUTPUT.write_bytes(content)
    print("Validated 18 reviewed reference layouts against typed OSM sources and the pinned aerial review.")
