# Florida Course Factory pilot

Implementation is stacked on PR #45 at `5f051d761825ee740708554a1cbffb423e615ec6`, with the development handoff in PR #46. The release branch is outside this change. The pilot uses an exact dated source and never alters a mapped line or creates tee positions, polygons or hazards.

## Coverage

The initial 18 were screened using exact boundary matches, route and polygon counts, then the availability of a usable official card. Additional club groups were included to exercise split-venue failures. Only strict passes publish art. A partial means there is a verified card and some real spatial coverage in the review; the app exposes its scorecard only. Blocked candidates are excluded from this generated catalog.

| Course | Routes / tees / greens / fairway holes | Status and next evidence |
| --- | --- | --- |
| Orange Blossom Hills, The Villages | 18 / 18 / 18 / 18 | **Strict pass** on official Gold (6,198 yards). Five official tee rows verified. |
| Baseline Golf Course, Ocala | 18 / 18 / 18 / 18 | **Strict pass** on official standard Blue (3,489 yards, par 61). The extra Lucky 13 and ambiguous Red alternatives are outside this 18-hole book. |
| DeBary Country Club | 18 / 18 / 18 / 18 | Partial. Verified Blue card. Route distances disagree on Nos. 2, 3, 16 and 17, and nine mapped par tags conflict. Reconcile actual routing before enabling art. |
| Waldorf Astoria Golf Club | 18 / 18 / 18 / 16 | Partial. Official Black, Blue and White cards. Fairways missing or ambiguous on Nos. 7 and 16. Mapped pars conflict on Nos. 17 and 18. |
| Disney’s Magnolia | 9 / 9 / 9 / 8 | Partial. Official Classic, Green and White cards. Need full, current routing and boundary after the course changes. |
| Disney’s Lake Buena Vista | 0 / 0 / 0 / 0 | Scorecard only. Official Blue and White. Need an independently matched course boundary. |
| Orange County National — Panther Lake | 16 / 16 / 16 / 12 | Partial. Official Champ. Exact named routes isolate the courses, but No. 12 crosses the parent boundary and No. 17 is unnamed. Four retained holes lack matched fairways. |
| Orange County National — Crooked Cat | 18 / 18 / 18 / 14 | Partial. Official Champ. Exact named routes and endpoint shapes match, but Nos. 6, 8, 13 and 15 lack qualifying fairways. |
| TPC Sawgrass — Players Stadium | 0 / 0 / 0 / 0 | Scorecard only. Four tees from the official PDF. Need exact Stadium map identity, separate from Dye’s Valley. |
| Disney’s Palm | 18 / 18 / 18 / 17 | **Strict pass** on Blue (6,840 yards, par 72). Current card yardages, and independently corroborated par 4 on No. 17. No qualifying fairway on par-3 No. 16. |
| Palatka Golf Club | 18 / 18 / 18 / 18 | **Strict pass** on Blue (5,862 yards, par 70). Both White variants are verified. The OSM par 5 on No. 18 matches the club's separate women's card. Red is withheld due to inconsistent printed totals. |
| Mount Dora Golf Club | 18 / 18 / 18 / 18 | **Strict pass** on Blue (5,719 yards, par 70). Four published tee rows. The Red and Gold card uses separately published par and stroke indexes. |
| The Plantation — Otter Creek | 18 / 18 / 18 / 18 | Blocked. USGA/FSGA rating records identify the course. Obtain the official per-hole card for the Otter Creek loop. |
| Highlands Reserve | 18 / 18 / 18 / 14 | Blocked. Official hole rows and additional fairway associations needed. |
| Cimarrone | 18 / 18 / 18 / 15 | Blocked. Official card is image-only. Needs a checked transcription and additional fairway coverage. |
| Black Bear | 18 / 18 / 18 / 14 | Blocked. The official page has tee totals without a verified set of hole rows. Additional fairway coverage is needed. |
| Falcon’s Fire | 18 / 18 / 18 / 15 | Blocked. Official PDF is image-only. Needs a checked transcription and additional fairway coverage. |
| Streamsong Black | 18 / 0 / 18 / 15 | Blocked. Official PDF has no usable text layer; the OCR attempt was inconclusive. The pinned data also lacks matched tee polygons. |

Totals are **5 strict passes, 5 reviewed partials, 2 scorecard-only and 6 blocked**. The app candidate contains five strict books and seven additional verified card-only entries. The books are for browser and physical-device review before any deployment.

The Palm correction applies only to the exact printed par 5 on hole 17 in the pinned current PDF. The [earlier Disney-printed card](https://www.mygolfvacation.com/courseImages/Disne_Palm.pdf) identifies that hole as par 4. [Disney Parks](https://disneyparksblog.com/wdw/golf-at-disney-world-mini-golfing-and-more/) independently states four par fives on the current 6,840-yard course. The pinned OSM way agrees, and the corrected row matches the current card’s printed back-nine 36 and round 72. Current tee yardages are unchanged. Palatka and Mount Dora use visually reviewed rows from the clubs’ published cards.

Both Orange County National pages returned new bytes. Before repinning, the exact Champ par and yardage rows were checked against the previous generated catalog and agreed. The shared venue uses exact OSM route names. Endpoint shapes used by other routes are excluded, as are fairways or hazards with competing route matches. Neither course bypasses the strict gate.

## Reproduce from the pinned inputs

Requirements are Python 3.12, Shapely 2.1.2, osmium 4.2.0, Node 22+ and Poppler `pdftotext`. Keep the downloads and generated scratch outputs outside Git. From the repository root, create a private cache directory and set `DCC_COURSE_CACHE` to its path.

```sh
python3 -m pip install shapely==2.1.2 osmium==4.2.0
MANIFEST=qa/course-factory/florida/manifest.json
mkdir -p "$DCC_COURSE_CACHE"
# Download the dated regional PBF once, then reuse its bytes in later runs.
curl --fail --location 'https://download.geofabrik.de/north-america/us/florida-261106.osm.pbf' \
  -o "$DCC_COURSE_CACHE/florida-261106.osm.pbf"
python3 scripts/course-factory-snapshot.py "$DCC_COURSE_CACHE/florida-261106.osm.pbf" \
  "$DCC_COURSE_CACHE/florida-pilot.osm" \
  --sha256 96bbbf94612bef9b717985dd961b14b9e2104d53ca03c64b81f6aa9585c33aa2 \
  --bbox -82.14 27.53 -81.28 30.26
python3 scripts/course-factory-review.py "$DCC_COURSE_CACHE/florida-pilot.osm" --rank
python3 scripts/course-factory-cache.py "$MANIFEST" "$DCC_COURSE_CACHE/cards"
node scripts/course-factory-batch.mjs "$MANIFEST" "$DCC_COURSE_CACHE/florida-pilot.osm" \
  "$DCC_COURSE_CACHE/cards" "$DCC_COURSE_CACHE/rebuild"
diff -r "$DCC_COURSE_CACHE/rebuild/reviews" qa/course-factory/florida/reviews
cmp "$DCC_COURSE_CACHE/rebuild/coverage.json" qa/course-factory/florida/coverage.json
cmp "$DCC_COURSE_CACHE/rebuild/florida-course-factory.js" playtest/florida-course-factory.js
for bundle in "$DCC_COURSE_CACHE/rebuild/course-art/"*.json; do
  cmp "$bundle" "playtest/course-art/${bundle##*/}"
done
python3 tests/course-factory-pipeline.test.py
node --test tests/*.test.mjs
```

The snapshot CLI checks the PBF digest before reading. It filters to golf-related objects, then retains only needed nodes and geometry tags. Initial full-node location-index attempts exceeded local memory. The final three-pass extraction retains referenced nodes only, and the pilot bounds reduced the golf snapshot from approximately 268 MB statewide to 55 MB. Discovery reads the shard once, ranks candidate courses by coverage, and the batch creates a small independent OSM subset per complete route set before invoking the existing importer. The PBF pin, regional snapshot pin and per-course subset pin are distinct. A changed club page or extract requires source review before repinning.

The official-card cache fetches only pinned HTTPS URLs, with a size cap and a timeout, and verifies the bytes before reuse. The offline batch validates known row layouts, whole hole sequences, par and yardage ranges, and printed subtotals. Image-only cards require an explicit reviewed transcript and source pin. Current layouts include HTML split rows, single-row and two-nine PDFs, a verified unlabeled back-nine PDF layout, and reviewed images. The manifest defines exact venue identity and reviewed sources. It does not infer that a similar name or nearby tee is a match. The offline builder writes to a fresh scratch directory, checks mapped par conflicts, and calls the same strict gate used by the app. Copy only reviewed outputs into the repository.

## Data and release safeguards

- Geometry is derived from [Geofabrik’s Florida OSM extract](https://download.geofabrik.de/north-america/us/florida.html), **© OpenStreetMap contributors** under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Keep attribution visible in the shared renderers and the derived geometry available under the same license. See [OSMF attribution guidance](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines).
- The cards are separate provenance records. Commit numerical facts and source URLs with reviewed hashes. Keep club PDF and image artwork in the private cache and avoid bulk scraping or rehosting it. No tile scraping, public editing API or Overpass is used to build this pilot.
- Source SHA verification and locked runtime gating remain independent of course search. Spatial ambiguity is reported per hole. Geometry that fails strict parity stays out of the runtime package. The script keeps the existing Bayonet thresholds and does not use King’s Grant’s separate reference-tee path for Florida.
- The PR-only Course Factory workflow uses a tiny synthetic PBF and card fixture, plus the checked-in outputs and audits. It does not download the large extract or fetch club documents. Friday Ghost QA covers the packaged browser workflows. No merge or deployment is part of this handoff.

## Continue the batch

Otter Creek still has all four geometry counts but needs an official full card. DeBary requires current routing evidence for nine par conflicts and four distance flags. Waldorf's designer and club document a renovation, so the older mapped No. 17/18 pars and missing fairways need current licensed geometry. Resolve Magnolia’s duplicated front-nine routes and renovated Nos. 14–17 separately. For larger batches, reuse source-hashed regional snapshots and keep venue approval, image transcription and anomalous routing as review steps.
