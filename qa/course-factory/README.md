# Founders course factory, first North Carolina batch

| Course | Route/tee/green/fairway holes | Bayonet parity | Scope |
| --- | --- | --- | --- |
| Sanford Quail Ridge | 18 / 18 / 18 / 18 | Pass | Shared Yardage Book and Ghost bundle. Black is the reference card. |
| Fayetteville King’s Grant | 18 / 17 / 18 / 18 | Blocked | Existing club scorecard remains available. Geometry is QA-only. |

## Review and reproducibility

The two OSM course relations match the club names, cities and street numbers. Each reviewed route stays within its course boundary. The route start and end fall within the assigned tee and green polygon when those polygons exist. Fairway matches follow the source playing lines. Bunkers and water with ambiguous proximity to multiple holes were withheld. Interior fairway cutouts preserve existing bunker/water geometry.

Use the exact source URLs and SHA-256 values in the `*-osm-review.json` manifests. The original XML is an input to the importer and can contain contributor metadata. The repository distributes only the reviewed machine-readable golf features. The map endpoint is a live data source. If the pinned bytes are no longer available, review a fresh extract and update the checksum and assignments before rebuilding.

```sh
python3 -m pip install shapely==2.1.2
python3 scripts/import-founder-osm.py qa/course-factory/quail-osm-review.json quail.osm /tmp/quail-art.json
cmp /tmp/quail-art.json playtest/course-art/quail-ridge-sanford-nc.json
node scripts/audit-founder-bundle.mjs "Quail Ridge" playtest/course-art/quail-ridge-sanford-nc.json
node scripts/audit-founder-bundle.mjs "Kings Grant" qa/course-factory/kings-grant-audit-only.json
```

The King’s Grant audit deliberately exits 1. No. 9's nearest mapped tee outline is about 141 metres from the route start. No. 13's genuine OSM line measures approximately 242 yards against the club's published Black 140 yards. A current routing diagram or source-backed tee/green locations are needed for those holes. The script preserves the discrepant line for review.

Quail Ridge No. 14 is a published par 5 on the Sanford Black card, at 496 yards. The OSM route measures approximately 505 yards and its green and tee match the numbered line. Its OSM par 4 tag is stale relative to the card. The listed Black card sums to 6,783 yards and agrees with the current USGA rating database. White, Gold and Red retain their prior individual-hole listings and saved tee IDs. Their current per-hole yardages still need a club or GHIN card. Blue needs a verified hole-by-hole source.

All derived OSM geometry in this batch is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The [King’s Grant boundary](https://www.openstreetmap.org/relation/6446970) and [Quail Ridge boundary](https://www.openstreetmap.org/relation/6400453) identify the underlying sources. The QA-only GeoJSON retains the same license and provenance.
