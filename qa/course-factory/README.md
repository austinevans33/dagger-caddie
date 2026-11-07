# Founders course factory, North Carolina and Winder

| Course | Route/tee/green/fairway holes | Bayonet parity | Scope |
| --- | --- | --- | --- |
| Sanford Quail Ridge | 18 / 18 / 18 / 18 | Pass | Shared Yardage Book and Ghost bundle. Black is the reference card. |
| Fayetteville King’s Grant | 18 / 17 / 18 / 18 | Blocked | Existing club scorecard remains available. Geometry is QA-only. |
| Sanford Tobacco Road | 18 / 16 / 18 / 14 | Blocked | Ripper comparison passes the distance sanity check. Geometry is QA-only. |
| The Chimneys, Winder | 18 / 18 / 18 / 17 | Pass | Bundled for Yardage Book and House Ghost. Gold is the reference card. |
| Pine Hills, Winder | 18 / 18 / 18 / 17 | Pass | Bundled for Yardage Book and House Ghost. Blue is the reference card. |
| Pinehurst No. 3 | 18 / 10 / 18 / 0 in the source preflight | Blocked | Numbered lines match the scorecard sequence. No separately identified No. 3 boundary in this extract. |

## Review and reproducibility

The original two OSM course relations match the club names, cities and street numbers. Each reviewed route stays within its course boundary. The route start and end fall within the assigned tee and green polygon when those polygons exist. Fairway matches follow the source playing lines. Bunkers and water with ambiguous proximity to multiple holes were withheld. Interior fairway cutouts preserve existing bunker/water geometry.

Use the exact source URLs and SHA-256 values in the `*-osm-review.json` manifests. The original XML is an input to the importer and can contain contributor metadata. The repository distributes only the reviewed machine-readable golf features. The map endpoint is a live data source. If the pinned bytes are no longer available, review a fresh extract and update the checksum and assignments before rebuilding.

```sh
python3 -m pip install shapely==2.1.2
python3 scripts/import-founder-osm.py qa/course-factory/quail-osm-review.json quail.osm /tmp/quail-art.json
cmp /tmp/quail-art.json playtest/course-art/quail-ridge-sanford-nc.json
node scripts/audit-founder-bundle.mjs "Quail Ridge" playtest/course-art/quail-ridge-sanford-nc.json
node scripts/audit-founder-bundle.mjs "Kings Grant" qa/course-factory/kings-grant-audit-only.json
python3 scripts/import-founder-osm.py qa/course-factory/tobacco-osm-review.json tobacco.osm /tmp/tobacco-art.json
cmp /tmp/tobacco-art.json qa/course-factory/tobacco-audit-only.json
node scripts/audit-founder-bundle.mjs "Tobacco Road" qa/course-factory/tobacco-audit-only.json ripper
```

### King’s Grant screenshot reconciliation

The two owner-supplied GPS screenshots were checked against the [club card](https://kingsgrantgolfcc.com/course-details/) and [NC OneMap orthoimagery](https://services.nconemap.gov/secure/rest/services/Imagery/Orthoimagery_Latest/ImageServer). The screenshots contain third-party imagery and stay outside the repository.

| Hole | Screenshot | Map corroboration | Remaining block |
| --- | --- | --- | --- |
| 9 | Blue header 291 yd, par 4. Visible marker-to-green direction follows the corridor between the houses and the adjacent fairway. | The road bend and green match OSM green `w717654779`. The mapped line `w717654786` runs through the same corridor. The official Blue card says 288 yd. | The tee area is partly under tree shadow in both views. No verified tee polygon at the start. Nearest OSM tee outline is approximately 141 m away. |
| 13 | Blue header 240 yd, par 3. The marker reads 101/115/129 yd to front/middle/back. | The pond, pool, parking and court independently identify green `w1116549392`. The marker is much closer to it than the OSM route start. The official card says 132 yd Blue and 140 yd Black. | OSM line `w1116549394` is approximately 242 yd and starts at the longer mapped tees. The marker establishes the short approach area, but does not identify a verified current Blue tee outline. |

Use a current tee outline or field-confirmed tee location with an independently sourced footprint before replacing those route/tee assignments. Keep the club card as the yardage source. The King’s Grant audit exits 1 with the original OSM geometry.

### Tobacco Road and Pinehurst No. 3

The [Tobacco Road way](https://www.openstreetmap.org/way/430227508) matches the club at 442 Tobacco Road. The QA bundle preserves 18 lines and greens, 16 tee outlines, 13 distinct fairway polygons, 84 bunker outlines, and the No. 14 pond. Fairway relation `19746375` intersects the playing lines of both Nos. 15 and 16. The importer validates the association on both holes and retains one shared feature with both hole numbers. The [club's hole guide](https://tobaccoroadgolf.com/golf/) confirms the No. 14 water feature.

Nos. 1 and 10 still lack polygons intersecting the route start. Their nearest outlines are about 80 m and 14 m away. The state orthophoto shows multiple distinct turf shapes near the two starts. It does not establish a reliable match to the pinned outlines. Nos. 3, 6, 14 and 17 lack a fairway that passes the importer checks. The course is short of the 17-hole fairway requirement, so its audit exits 1 and the app uses the scorecard fallback. The comparison uses the existing Ripper row. The club's headline 6,532-yard card mixes values from published tee rows, so it was not used to replace the Ripper row.

The [Pinehurst parent resort](https://www.openstreetmap.org/relation/13969631) includes multiple courses. The preflight manifest records 18 unambiguously numbered candidate lines, whose sequence and lengths agree with the [No. 3 White card](https://www.pinehurst.com/golf/courses/no-3/). Eight starts and all fairway assignments remain unverified in this extract. The parent resort identity is insufficient for the production importer. The manifest is discovery evidence only.

Quail Ridge No. 14 is a published par 5 on the Sanford Black card, at 496 yards. The OSM route measures approximately 505 yards and its green and tee match the numbered line. Its OSM par 4 tag is stale relative to the card. The listed Black card sums to 6,783 yards and agrees with the current USGA rating database. White, Gold and Red retain their prior individual-hole listings and saved tee IDs. Their current per-hole yardages still need a club or GHIN card. Blue needs a verified hole-by-hole source.

All derived OSM geometry in this batch is © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). The [King’s Grant boundary](https://www.openstreetmap.org/relation/6446970) and [Quail Ridge boundary](https://www.openstreetmap.org/relation/6400453) identify the underlying sources. The QA-only GeoJSON retains the same license and provenance.

### Winder, Georgia

[The Chimneys OSM relation](https://www.openstreetmap.org/relation/143005) matches the municipal facility at 338 Monroe Highway. [Pine Hills OSM way](https://www.openstreetmap.org/way/34772934) matches the club at 661 Hog Mountain Road. The reviewed extracts both contain boundary data for the neighboring club. Assignments are scoped to the matched boundary and checked against the exact numbered routes.

The Chimneys bundle has 20 fairway polygons covering 17 holes and 30 assigned bunkers. The Pine Hills bundle has 18 fairway polygons covering 17 holes, one assigned bunker and six water polygons. Other source hazards were withheld where assignment was ambiguous or their proximity fell outside review limits. The two maps retain the original tee/green outlines, playing lines and fairway cutouts. The Chimneys No. 11 and Pine Hills No. 16 are par 3s with an independently mapped tee, line and green, and no validated fairway. The selected tee controls scorecard par and yardage. The drawing depicts the mapped playing corridor, which can differ from the selected tee's shot line.

```sh
python3 scripts/import-founder-osm.py qa/course-factory/chimneys-osm-review.json chimneys.osm /tmp/chimneys.json
cmp /tmp/chimneys.json playtest/course-art/chimneys-winder-ga.json
node scripts/audit-founder-bundle.mjs "The Chimneys" playtest/course-art/chimneys-winder-ga.json gold
python3 scripts/import-founder-osm.py qa/course-factory/pinehills-osm-review.json pinehills.osm /tmp/pinehills.json
cmp /tmp/pinehills.json playtest/course-art/pine-hills-winder-ga.json
node scripts/audit-founder-bundle.mjs "Pine Hills" playtest/course-art/pine-hills-winder-ga.json blue
```
