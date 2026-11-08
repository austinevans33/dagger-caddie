"""Validate aerial putting-surface traces and export review-only GeoJSON."""
import argparse
import json
from pathlib import Path

from shapely.geometry import Point, Polygon
from shapely.geometry.polygon import orient


def review(manifest, anchors, traces):
    """Check complete, distinct outlines against the pinned crop and hole anchors."""
    if traces["status"] != "review-only" or traces["featureType"] != "green":
        raise ValueError("Expected review-only green traces")
    left, top, right, bottom = manifest["crop"]
    polygons = traces["polygons"]
    holes = [row["hole"] for row in anchors]
    if not holes or [row["hole"] for row in polygons] != holes or holes != list(range(1, len(holes) + 1)):
        raise ValueError("Green traces and anchors must cover the same consecutive holes")
    polygons_by_hole = {}
    for anchor, trace in zip(anchors, polygons, strict=True):
        hole, ring = trace["hole"], trace["ring"]
        if len(ring) < 4 or ring[0] != ring[-1]:
            raise ValueError(f"Hole {hole}: green ring is open or incomplete")
        if not all(0 <= x < right - left and 0 <= y < bottom - top for x, y in ring):
            raise ValueError(f"Hole {hole}: green ring falls outside the pinned crop")
        polygon = Polygon(ring)
        if not polygon.is_valid or not polygon.contains(Point(anchor["pixel"])):
            raise ValueError(f"Hole {hole}: invalid green or missing its review anchor")
        if any(polygon.intersects(other) for other in polygons_by_hole.values()):
            raise ValueError(f"Hole {hole}: green overlaps another hole")
        polygons_by_hole[hole] = orient(polygon, sign=-1)
    return polygons_by_hole


def export(manifest, polygons):
    from rasterio import Affine
    from rasterio.warp import transform

    pixel_to_map = Affine(*manifest["affine"])
    features = []
    for hole, polygon in polygons.items():
        coords = [pixel_to_map * (x + 0.5, y + 0.5) for x, y in polygon.exterior.coords]
        east, north = zip(*coords)
        lon, lat = transform(manifest["epsg"], 4326, east, north)
        features.append({
            "type": "Feature",
            "properties": {
                "hole": hole,
                "feature": "green",
                "status": "review-only",
                "source": manifest["id"],
            },
            "geometry": {"type": "Polygon", "coordinates": [
                [[round(x, 7), round(y, 7)] for x, y in zip(lon, lat)]
            ]},
        })
    return {"type": "FeatureCollection", "features": features}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="Folder with the crop, anchor and trace manifests")
    parser.add_argument("output", type=Path, help="Output GeoJSON for GIS review")
    args = parser.parse_args()
    traces = json.loads((args.folder / "green-footprints.json").read_text())
    anchors = json.loads((args.folder / "green-review.json").read_text())["greens"]
    manifest = json.loads((args.folder / traces["cropManifest"]).read_text())
    polygons = review(manifest, anchors, traces)
    args.output.write_text(json.dumps(export(manifest, polygons), indent=2) + "\n")
    print(f"{len(polygons)} green outlines checked and exported for review")


if __name__ == "__main__":
    main()
