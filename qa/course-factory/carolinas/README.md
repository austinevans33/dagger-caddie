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
| The Woods Golf Club, Whispering Pines NC | 4 | 18 / 18 / 18 / 18 | Oak, 6,070 yards, par 72 |
| Mill Creek Golf Club, Mebane NC | 5 physical tee rows, 9 selections | 18 / 18 / 18 / 17 | Black, 6,992 yards, par 72 |
| Hillandale Golf Course, Durham NC | 5 physical tee rows, 9 selections | 18 / 18 / 18 / 18 | Blue, 6,425 yards, par 71 |
| Greensboro National Golf Club, Summerfield NC | 4 | 18 / 18 / 18 / 17 | Blue, 6,806 yards, par 72 |
| The Club at 12 Oaks, Holly Springs NC | 7 physical tee rows, 2 combo rows | 18 / 18 / 18 / 17 | Gold, 7,093 yards, par 72 |
| Hope Valley Country Club, Durham NC | 5 physical tee rows, 9 selections | 18 / 18 / 18 / 17 | Ross, 6,720 yards, par 70 |

Each region's manifest pins the original scorecard sources, Geofabrik PBF and derived golf-only snapshot. Each coverage report pins the promoted bundle. No synthetic tee, fairway, hazard or live pin yardage was added.

Crooked Oaks shares a PDF with Ocean Winds. The importer matches the Crooked Oaks page heading before reading any rows. The linked hole card's Hawk row sums to 6,706. The club's course description gives 6,780 without matching hole values. Use the scorecard figures and preserve that distinction. Eagle and Pelican are totals-only rows without their own hole values in the printed card, so the catalog does not expose them.

Tanglewood uses the [county’s Championship card](https://golf.tanglewoodpark.org/courses/), a separate venue from Reynolds and the Par 3 course. Red and Family use the published par 74 row. The sample browser check uses Red No. 17, par 5 at 292 yards. Hidden Cypress uses the [club’s scorecard](https://www.golfinsuncity.com/hidden-cypress/). Its Gold No. 12 is par 3 at 165 yards, with a verified route, tee and green and no accepted fairway polygon. The printed Red row totals 6,953, which differs from the course summary’s 6,946. The reviewed hole row and printed total agree.

Pudding Ridge’s [club-issued scorecard](https://www.puddingridge.com/wp-content/uploads/2017/08/scorecard.pdf) prints the back nine first and leaves the front-nine yardage subtotals blank. Four tee rows reconcile with the printed back-nine and round totals. White’s individual holes sum to 5,474 yards while the card prints 5,374, so the White row is withheld. The club’s course overview cites 6,813 yards. The catalog follows the checked Black hole grid and its printed total of 6,713.

Oak Island’s [official card](https://oakislandgolf.com/course-scorecard/) pins both the hole grid and the companion cover. Red uses the printed ladies par and stroke index, including par 5 on No. 9 and par 4 on No. 14. Par-3 No. 3 has a verified route, tee and green. Its fairway remains unrendered.

## November 8 North Carolina additions

- **The Woods.** The pinned OSM extract numbers the current back nine as 1–9 and the current front nine as 10–18. Orienting page 1 of the [club’s printed card](https://www.thewoodsgolfclub.com/wp-content/uploads/sites/8567/2025/10/The-Woods-Golf-Club-18H-PROOF-12-Final.pdf) north-up shows the split directly. Club No. 2 crosses the pond at OSM No. 11, and club No. 15 is the short southwest hole at OSM No. 6. The full one-to-one swap removes all 14 mapped par conflicts and all six route-yardage failures. The manifest records the source number for each card hole. Both generation steps validate the complete order and preserve the original source features. The [club web card](https://www.thewoodsgolfclub.com/scorecard/) agrees with the pinned print card on all four tee rows, pars and indexes. The club’s overview gives 6,324 yards without a corresponding hole grid, so the catalog follows the printed 6,070-yard Oak row.
- **Mill Creek.** The [Mebane club’s card](https://www.golfmillcreek.com/golf/score-card/) supplies five explicit hole rows and separate men’s and ladies’ indexes. The cover confirms the 1700 St Andrews Drive identity and printed tee labels. The catalog includes women’s selections for the four tees with a published women’s rating and keeps their index. Mixed tee totals are outside the import. No. 17 is par 3 and has a mapped tee, route and green. The source does not yield a unique fairway polygon for that hole.
- **Hillandale.** The [operator’s card image](https://hillandalegolf.com/wp-content/uploads/2019/09/hillandale_golf_course_scorecard_1200a.webp) supplies five complete yardage rows, one handicap index row and both par rows. The women’s selections retain No. 8 as par 5 and a round par of 72. The public overview’s 6,339-yard summary conflicts with the numbered card. The catalog follows the printed Blue row, which reconciles to 6,425 yards.

## Greensboro National and Carolina Colours

[Greensboro National’s club card](https://greensboronational.com/course-details/) pins the cover and hole grid. The map venue is labeled “Greesnboro National Golf Course” in the pinned OSM extract. Its location and numbered layout match the Summerfield club. The catalog uses the club’s spelling. The par-3 16th has a verified route, tee and green with no uniquely matched fairway.

[Carolina Colours’ club card](https://carolinacoloursgolfclub.com/golf-scorecard/) supplies eight physical tee rows and both stroke-index rows. Its Black row totals 6,886 yards. The mapped No. 7 is tagged par 5 where the club card has par 4. Seven routes fail the Black distance check, on Nos. 2, 4, 5, 6, 10, 12 and 16. The card is available while the full book is gated.

## 12 Oaks and Hope Valley

- [The Club at 12 Oaks](https://www.theclubat12oaks.com/scorecard-and-course-map) supplies seven full tee rows and printed arrows for the Nicklaus and Green Oaks combinations. Both combinations reconcile with the published front-nine, back-nine and round totals. Yellow No. 7 is 187 yards and par 4, making that card par 71. The club card supplies the Gold 7,093-yard reference, and the pinned OSM geometry includes all 18 routes, tees and greens. No. 11 is a par 3 with no uniquely assigned fairway.
- [Hope Valley's club card](https://www.hvcc.org/files/Hope%20Valley%20Country%20Club%20Course%20Scorecard.pdf) has five complete physical tee rows and separately printed men's and women's pars and stroke indexes. The women's selections use par 5 at Nos. 4 and 16, for par 72. Souchak, Nelson and Rawlings have printed totals without complete hole rows and are outside the import. No. 14 is a par 3 with no uniquely assigned fairway.

## Seven Lakes scorecard and geometry review

[Seven Lakes Golf Club in West End](https://www.golf7lakes.com/scorecard) has eight verified tee sets, including both combo rows. The men's and ladies' stroke indexes are preserved according to the club's groups. The importer accepts numbered hole names only when enabled for the pinned scorecard and still requires the exact 1–18 sequence.

The November 9 repin matched every prior hole yardage, par and stroke index across the eight published selections. The published OSM boundary yields 18 routes, 18 tees, 18 greens and 17 matched fairways. Par-3 No. 7 lacks a unique fairway. On No. 16, [OSM way 1113464356](https://www.openstreetmap.org/way/1113464356) measures about 119 yards. The club card lists Black and Blue at 188 and White at 174. These rows fail the route-length check for that hole. A shorter tee can fit the coarse length test but does not establish which pad starts the mapped route. The runtime offers the verified scorecard and withholds the entire drawing bundle until the tee start is independently confirmed.

## Neuse Country Club

The [current club card](https://neusegolf.com/wp-content/uploads/2025/04/Scorecard_2025.jpg) supersedes the older PDF. All six rows reconcile, including Silver / Forward at 4,743 yards and Forward at 3,931 yards. Forward uses par 4 at No. 8 and par 71 overall. Its printed stroke-index row repeats several numbers, so the Forward tee has verified par and yardage only.

The source boundary matches the club’s Clayton street address. It yields 17 matched routes, tees, greens and fairways. Both endpoints of the candidate No. 8 route are within the boundary tolerance, but the line crosses outside it. The drawing remains gated while the verified scorecard is playable. [OSM boundary](https://www.openstreetmap.org/relation/6432537) · [No. 8 candidate](https://www.openstreetmap.org/way/756794598)

## Pine Island Country Club

The [club scorecard](https://pineislandcc.com/wp-content/uploads/2024/08/Scorecard-82424.pdf) reconciles all seven tee rows, including Blue/White, White/Gold and Gold/Green. Gold/Green and Green retain the separately printed lower stroke-index row. The pinned Charlotte boundary matches 18 routes, tees and greens. Mapped pars conflict with the card on Nos. 2, 3, 4 and 7, and the Blue route distances fail on Nos. 2, 3 and 4. The verified card is playable while the drawings remain gated pending a source that establishes the current hole numbering.

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
