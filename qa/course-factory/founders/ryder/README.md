# Ryder aerial source review

The Ryder course in Fort Bragg, NC now has a reproducible, georeferenced review crop from USDA NAIP. The course remains scorecard-only in Dagger. No artwork or spatial claims were added to the runtime catalog.

| Evidence | Result |
| --- | --- |
| [Pinned NAIP item](https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip/items/nc_m_3507849_sw_17_060_20220531) | Acquired May 31, 2022 at 0.6 m/pixel. The crop is 1,516 × 2,120 pixels in NAD83 / UTM zone 17N, EPSG:26917. |
| [Pinned range manifest](naip.json) | The original header and 24 compressed source blocks are pinned by SHA-256. The decoded RGB pixels have their own checksum. |
| [Army MWR numbered routing diagram](https://bragg.armymwr.com/download_file/view/c9727a5e-b56b-4c2e-a8d7-c6dd35a1dbc4/29653) | Cross-checked hole order and position against the independently georeferenced NAIP aerial. The pond pair, clubhouse area, surrounding roads, paths and visible bunkers helped distinguish adjoining holes. |
| [Green association review](green-review.json) | All 18 approximate green centers are recorded in the pinned crop's zero-based pixel coordinates. Each candidate was checked at native resolution on the visible putting surface. These points are historical QA anchors. They are unsuitable for live pin distances or verified polygon coverage. |
| Remaining checks | Assign tee pads and named tee sets, trace supported fairway and green boundaries, check present-day conditions and compare tee-to-green routes with the scorecard. Ryder has no published numbered OSM routes in the pinned extract. No parity promotion is possible from these anchors alone. |

The pixel-to-map formula for a reviewed pixel column `c` and row `r` is `E = 682950.6 + 0.6 × (c + 0.5)`, `N = 3891387.0 − 0.6 × (r + 0.5)`. The half-pixel term refers to the pixel center. The file includes no traced artwork from the Army diagram. The NAIP source credits the USDA Farm Service Agency. [USGS describes its NAIP archive as public-domain imagery](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer).

## Reproduction

Use Python 3.12 with Rasterio and Pillow. Keep the downloaded blocks and image outside the repo. The first run fetches only the source blocks needed for this crop. Omit `--download` to rebuild offline from the same cache. Both paths verify original byte ranges, the map transform and decoded RGB. Output includes a PNG, world file and projection file.

```sh
python3 -m pip install rasterio pillow
mkdir -p /tmp/dcc-ryder
python3 scripts/course-factory-imagery.py \
  qa/course-factory/founders/ryder/naip.json \
  /tmp/dcc-ryder/cache /tmp/dcc-ryder/ryder.png --download
```

The full imagery is source evidence for review. Future candidate geometry still goes through the existing Bayonet-parity gate before app use.

## Putting-surface traces

[Green footprints](green-footprints.json) contains manually traced, approximate outlines from the pinned 2022 NAIP crop for all 18 holes. An independent [NC OneMap latest orthophoto](https://services.nconemap.gov/secure/rest/services/Imagery/Orthoimagery_Latest/ImageServer) export corroborated the position of all 18 greens. The catalog item at the course center identifies a February 3, 2024 acquisition. The service can change over time. The comparison was used to check location, while all review vertices come from the pinned NAIP crop. Its leaf-off state and shadows limit precise boundary comparison on some holes.

The comparison crop request used bounding box `682950.6,3890115,683860.2,3891387`, `bboxSR=26917`, `imageSR=26917`, `size=1516,2120`, `format=png`, and `f=image` on the service's `exportImage` endpoint. Returned PNG SHA-256 was `ea22593a292e70eee3dfd00aac2578a8300209ebc83c46a33e1a5a57e5cc19d3`. The archived state imagery is reference-only and is outside the app and this repository.

The validator checks that every closed outline contains its own previously identified anchor, stays inside the crop and is valid and disjoint. The export is WGS 84 GeoJSON for GIS review. Use the same Python environment as the crop, plus Shapely 2.1.2.

```sh
python3 scripts/course-factory-green-review.py qa/course-factory/founders/ryder /tmp/ryder-greens.geojson
```

## Tee assignment blocker

[Golfify](https://www.golfify.io/courses/ryder-golf-course) lists Blue 6,415 and Gold 5,415 yards. [TheGrint](https://thegrint.com/golf-courses/us/north-carolina/fort-bragg/ryder) instead lists Blue 5,420 and Red 6,402 yards. On No. 5 alone, those two Blue rows read 195 and 144 yards. The Army MWR diagram numbers the holes but does not associate colors and yardages with individual tee pads. The aerial checks show multiple plausible starts around some adjacent holes. A current club card and hole-by-hole tee references are needed to certify a named tee set. No published rows were changed.

Fairway geometry remains unapproved. The visible corridor and the published routing illustration can guide field review. The vegetation and mowing transitions visible in the available aerials are insufficient to finish the outlines to Bayonet quality in this pass.
