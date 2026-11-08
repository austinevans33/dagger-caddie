# Carolinas Course Factory batches 1 and 2

Stacked on the Founders source review. The regional catalogs use the same runtime geometry gate as Bayonet and the existing Yardage Book, AI Caddy handoff and House Ghost drawing. The release branch is outside this change.

| Course | Official tee rows | Strict route / tee / green / fairway | Reference tee |
|---|---:|---|---|
| Gates Four Golf & Country Club, Fayetteville NC | 5 | 18 / 18 / 18 / 18 | Black, 6,895 yards, par 72 |
| Crooked Oaks at Seabrook Island Club, Seabrook Island SC | 6 | 18 / 18 / 18 / 18 | Hawk, 6,706 yards, par 72 |
| Tanglewood Park Championship Course, Clemmons NC | 6 | 18 / 18 / 18 / 18 | Gold, 7,101 yards, par 70 |
| Hidden Cypress Golf Club, Bluffton SC | 6 | 18 / 18 / 18 / 17 | Gold, 6,549 yards, par 72 |

Each region's manifest pins the original scorecard PDF, Geofabrik PBF and derived golf-only snapshot. Each coverage report pins the promoted bundle. No synthetic tee, fairway, hazard or live pin yardage was added.

Crooked Oaks shares a PDF with Ocean Winds. The importer matches the Crooked Oaks page heading before reading any rows. The linked hole card's Hawk row sums to 6,706. The club's course description gives 6,780 without matching hole values. Use the scorecard figures and preserve that distinction. Eagle and Pelican are totals-only rows without their own hole values in the printed card, so the catalog does not expose them.

Tanglewood uses the [county’s Championship card](https://golf.tanglewoodpark.org/courses/), a separate venue from Reynolds and the Par 3 course. Red and Family use the published par 74 row. The sample browser check uses Red No. 17, par 5 at 292 yards. Hidden Cypress uses the [club’s scorecard](https://www.golfinsuncity.com/hidden-cypress/). Its Gold No. 12 is par 3 at 165 yards, with a verified route, tee and green and no accepted fairway polygon. The printed Red row totals 6,953, which differs from the course summary’s 6,946. The reviewed hole row and printed total agree.

## Discovery

The statewide extracts yielded 151 NC and 113 SC named boundaries with at least 17 uniquely numbered, contained routes. Among these, 37 NC and 12 SC met the geometry count screen. The counts include some existing courses. `discovery.json` lists the exact OSM boundaries that made this first screen. Every queued candidate still needs independent course identity and official card review, source import, route-to-yardage checks and browser acceptance.

Next source checks include [Longleaf](https://www.longleafgfc.com/longleaf-scorecard/) in NC and Dolphin Head and Olde Beaufort in SC. Heathland has complete geometry counts, but the indexed Legends PDF returned HTTP 404 when fetched. Locate a current club card before promotion.

## Reproduction

Use Python 3.12, Shapely 2.1.2, osmium 4.2.0, Node 22 and Poppler `pdftotext`. Fetch the state PBF from `source` and the club PDF from `scorecard.url` in the region manifest. Keep original bytes in scratch. Name each cached PDF exactly its course ID, with no extension.

```sh
region=north-carolina # or south-carolina
python3 scripts/course-factory-snapshot.py "$pbf" "$snapshot" --sha256 "$pbf_sha"
python3 scripts/course-factory-review.py "$snapshot" --rank > "$scratch/$region-ranked.json"
node scripts/course-factory-batch.mjs "qa/course-factory/$region/manifest.json" "$snapshot" "$card_cache" "$scratch/new-$region"
node --test tests/course-factory-carolinas.test.mjs
python3 tests/course-factory-pipeline.test.py
```

Compare the generated catalog, coverage, review and map bytes with the checked-in versions before promoting new outputs. A changed source hash requires re-review. For browser acceptance, run the existing Friday workflow or its local Chromium equivalent. The checks step through all 18 drawings on each course, verify matching House Ghost shapes and a shot tracer, then verify that Ask My Caddy receives the selected hole and yardage. Live AI responses and physical iPhone field use are separate checks.

[OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), via [Geofabrik](https://download.geofabrik.de/north-america/us.html).
