# Carolinas Course Factory

Stacked on the Founders source review. The regional catalogs use the same runtime geometry gate as Bayonet and the existing Yardage Book, AI Caddy handoff and House Ghost drawing. The release branch is outside this change.

| Course | Official tee rows | Strict route / tee / green / fairway | Reference tee |
|---|---:|---|---|
| Gates Four Golf & Country Club, Fayetteville NC | 5 | 18 / 18 / 18 / 18 | Black, 6,895 yards, par 72 |
| Crooked Oaks at Seabrook Island Club, Seabrook Island SC | 6 | 18 / 18 / 18 / 18 | Hawk, 6,706 yards, par 72 |
| Tanglewood Park Championship Course, Clemmons NC | 6 | 18 / 18 / 18 / 18 | Gold, 7,101 yards, par 70 |
| Hidden Cypress Golf Club, Bluffton SC | 6 | 18 / 18 / 18 / 17 | Gold, 6,549 yards, par 72 |
| Longleaf Golf & Family Club, Southern Pines NC | 7 | 18 / 18 / 18 / 18 | Tee 6, 6,153 yards, par 72 |
| Sanford Municipal Golf Course, Sanford NC | 4 | 18 / 18 / 18 / 18 | Men’s, 6,304 yards, par 71 |
| Pudding Ridge Golf Club, Mocksville NC | 4 | 18 / 18 / 18 / 18 | Black, 6,713 yards, par 71 |
| Oak Island Golf Club, Caswell Beach NC | 5 | 18 / 18 / 18 / 17 | Blue, 6,717 yards, par 72 |

Each region's manifest pins the original scorecard sources, Geofabrik PBF and derived golf-only snapshot. Each coverage report pins the promoted bundle. No synthetic tee, fairway, hazard or live pin yardage was added.

Crooked Oaks shares a PDF with Ocean Winds. The importer matches the Crooked Oaks page heading before reading any rows. The linked hole card's Hawk row sums to 6,706. The club's course description gives 6,780 without matching hole values. Use the scorecard figures and preserve that distinction. Eagle and Pelican are totals-only rows without their own hole values in the printed card, so the catalog does not expose them.

Tanglewood uses the [county’s Championship card](https://golf.tanglewoodpark.org/courses/), a separate venue from Reynolds and the Par 3 course. Red and Family use the published par 74 row. The sample browser check uses Red No. 17, par 5 at 292 yards. Hidden Cypress uses the [club’s scorecard](https://www.golfinsuncity.com/hidden-cypress/). Its Gold No. 12 is par 3 at 165 yards, with a verified route, tee and green and no accepted fairway polygon. The printed Red row totals 6,953, which differs from the course summary’s 6,946. The reviewed hole row and printed total agree.

Pudding Ridge’s [club-issued scorecard](https://www.puddingridge.com/wp-content/uploads/2017/08/scorecard.pdf) prints the back nine first and leaves the front-nine yardage subtotals blank. Four tee rows reconcile with the printed back-nine and round totals. White’s individual holes sum to 5,474 yards while the card prints 5,374, so the White row is withheld. The club’s course overview cites 6,813 yards. The catalog follows the checked Black hole grid and its printed total of 6,713.

Oak Island’s [official card](https://oakislandgolf.com/course-scorecard/) pins both the hole grid and the companion cover. Red uses the printed ladies par and stroke index, including par 5 on No. 9 and par 4 on No. 14. Par-3 No. 3 has a verified route, tee and green. Its fairway remains unrendered.

## Seven Lakes scorecard and geometry review

[Seven Lakes Golf Club in West End](https://www.golf7lakes.com/scorecard) has eight verified tee sets, including both combo rows. The men's and ladies' stroke indexes are preserved according to the club's groups. The importer accepts numbered hole names only when enabled for the pinned scorecard and still requires the exact 1–18 sequence.

The published OSM boundary yields 18 routes, 18 tees, 18 greens and 17 matched fairways. Par-3 No. 7 lacks a unique fairway. On No. 16, [OSM way 1113464356](https://www.openstreetmap.org/way/1113464356) measures about 119 yards. The club card lists Black and Blue at 188 and White at 174. These rows fail the route-length check for that hole. A shorter tee can fit the coarse length test but does not establish which pad starts the mapped route. The runtime offers the verified scorecard and withholds the entire drawing bundle until the tee start is independently confirmed.

## Discovery

The statewide extracts yielded 151 NC and 113 SC named boundaries with at least 17 uniquely numbered, contained routes. Among these, 37 NC and 12 SC met the geometry count screen. The counts include some existing courses. `discovery.json` lists the exact OSM boundaries that made this first screen. Every queued candidate still needs independent course identity and official card review, source import, route-to-yardage checks and browser acceptance.

The Founders and NC pass kept the South Carolina batch as-is. See the [Founders and NC handoff](../../../docs/COURSE_FACTORY_FOUNDERS_NC_20261108.md) for remaining NC source checks.

## Reproduction

Use Python 3.12, Shapely 2.1.2, osmium 4.2.0, Node 22 and Poppler `pdftotext`. Fetch the pinned state PBF from `source` in the region manifest. The scorecard cache command below verifies the primary and companion card bytes and stores them as the course ID and course ID plus part suffix, respectively.

```sh
region=north-carolina # or south-carolina
python3 scripts/course-factory-cache.py "qa/course-factory/$region/manifest.json" "$card_cache"
python3 scripts/course-factory-snapshot.py "$pbf" "$snapshot" --sha256 "$pbf_sha"
python3 scripts/course-factory-review.py "$snapshot" --rank > "$scratch/$region-ranked.json"
node scripts/course-factory-batch.mjs "qa/course-factory/$region/manifest.json" "$snapshot" "$card_cache" "$scratch/new-$region"
node --test tests/course-factory-carolinas.test.mjs
python3 tests/course-factory-pipeline.test.py
```

Compare the generated catalog, coverage, review and map bytes with the checked-in versions before promoting new outputs. A changed source hash requires re-review. For browser acceptance, run the existing Friday workflow or its local Chromium equivalent. The checks step through all 18 drawings on each course, verify matching House Ghost shapes and a shot tracer, then verify that Ask My Caddy receives the selected hole and yardage. Live AI responses and physical iPhone field use are separate checks.

[OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), via [Geofabrik](https://download.geofabrik.de/north-america/us.html).
