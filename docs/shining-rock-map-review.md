# Shining Rock reference-layout review · November 18, 2026

All 18 Rock holes were reviewed individually against MassGIS spring 2025 orthoimagery at ArcGIS zoom 18. This is an approximate course layout with mapped tee pads, not a survey, selected tee-color location, live pin position or current penalty-area ruling. The selected-tee scorecards remain unchanged.

## Sources and reproducibility

- Candidate export, retrieved November 18, https://zommagolf.com/courses/ma/shining-rock-golf-club/geo.json
- Typed OSM way/relation/node source snapshots from https://api.openstreetmap.org/api/0.6/ are pinned in qa-scorecard/shining-rock/source.json.gz. Every retained feature's type, version, tags and coordinates are checked against the snapshot. The exporter uses original OSM coordinates and restores polygon interior rings.
- MassGIS source and public-use terms, https://www.mass.gov/info-details/massgis-data-2025-aerial-imagery
- Imagery service, https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/Massachusetts_Aerial_Imagery_2025/MapServer
- The review manifest records all 210 imagery tile URLs and hashes, per-hole observations and exclusions. The review contact sheet shows the raw aerial beside the retained geometry. MassGIS imagery is used for verification, outside the production bundle.
- Run python3 scripts/build-shining-rock-book.py --check to reproduce the public artifact from pinned sources. No network is needed. Runtime still uses the existing Founder geometry audit and shared Yardage Book/Ghost renderer.

## Hole 18

OSM way/887701693 is explicitly named Rock 18 - Home, ref 18, par 4, links Rock. Its start is inside the visible back pad way/887700311. That source route is approximately 496 yards. The club's current Gold scorecard is 389 yards. Five mapped pads are visible, and their colors cannot be established from aerial imagery.

The map therefore retains the source-backed reference route and labels it as such. It does not relabel the back pad as Gold or change the scorecard. The route-to-card ratio is within the existing Bayonet-calibrated broad structural gate. That gate is used only after independent visual and OSM identity review.

## Exclusions and limits

Five unrelated practice features are excluded. Two parking-side practice fairways were associated with Hole 1. A turf island and two driving-range pads were associated with Hole 9. Course boundaries and cart paths are also excluded from hole art.

OSM explicitly tags the three retained water/wetland outlines as golf water hazards. Seasonal wetland/depression areas are dry in the 2025 aerial. Their outlines describe mapped features, and do not establish current water levels or legal penalty boundaries.

A missing or invalid bundled Shining Rock map returns the existing scorecard-only fallback. It cannot silently substitute live, unreviewed provider geometry. Original Ghost scoring, opponents, saved rounds and financial logic are unchanged by these map changes.
