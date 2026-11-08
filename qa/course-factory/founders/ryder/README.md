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
