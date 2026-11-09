# Founders source review

The runtime changes in this increment add Pelican Pointe's official scorecards and restore Hyland's official Black and Blue tees. No new course art is promoted. The review artifacts are for QA and keep the strict 18-hole importer and runtime gate intact.

## Scorecard provenance

| Source | Original asset SHA-256 | Scope |
|---|---|---|
| [Pelican Pointe club layout](https://www.pelicanpointeclub.com/-course-layout) · [Meadows SWF](https://cdn.cybergolf.com/images/668/meadows_sc.swf) | `e81dc3865d1a684ee889d48ba2877a7037eb5a8cff54fa75b9cb33e649c66cc1` | Physical holes 1–9 |
| [Preserve SWF](https://cdn.cybergolf.com/images/668/preserve_sc.swf) | `12c10baf2c8f0e29724665bd425ee77bdbeaf5128fce7daa60bc31b35e890fc5` | Physical holes 10–18 |
| [Hatchett Creek SWF](https://cdn.cybergolf.com/images/668/hatchett_sc.swf) | `9ed19c1b145c9777e18ec568aef8c5dad3f5434c8bb2849213dd44e07c9a6cb5` | Physical holes 19–27 |
| [Hyland scorecard image](https://www.hylandgolfclub.com/wp-content/uploads/sites/9613/2025/05/Hyland-Scorecard-2-imageonline.co-merged.png) | `10a7e2c76fc6a3948f907cf1058662b4ad4b8d2b2d178d6ec6ded0a8651cda3d` | Five sets, all 18 holes |
| [Sassamon Trace scorecard image](https://sassamontrace.com/wp-content/uploads/2021/01/scorecard-1.jpg) | `1a0b6cd8da0a4c828ffca279c0ea48a92dbcc6a5f2a2105411c6bac51ab8f074` | Four tees, nine physical holes |

The Pelican cards were read from the embedded JPEG (SWF DefineBitsJPEG2 tag 21, character 5) without executing Flash. Every tee row agrees with its printed nine-hole subtotal. The [FSGA venue page](https://www.fsga.org/Club/Detail/20426cb1-7488-42db-9818-9268bcfcb311) independently confirms the pairing order. The club files provide five complete rows. The other rated tees and an official 18-hole stroke index for each pairing remain unverified. The older #38 Offcourse White rows differ from the club images on eight holes across Meadows and Preserve. The app uses the club rows. The original images and Flash files are not redistributed.

## Geometry review and remaining gates

- **Pelican Pointe** uses OSM relation [12587089](https://www.openstreetmap.org/relation/12587089). There are 27 numbered route ways with unique tee and green endpoint shapes in a separate endpoint check. The strict review retains 17 routes with 17 tees, greens and fairway holes. Physical Nos. 3, 9, 11, 12, 15, 16, 18, 22, 23 and 24 cross gaps in the multipolygon boundary beyond the existing 3 m tolerance. Resolve those crossings with independent reusable source evidence before approving or remapping any pairing.
- **Hyland** has 17 matched routes, tees and greens in the pinned statewide snapshot. The separate [No. 10 review](native-nine/README.md#hyland-no-10-southern-pines-nc) located the route, tee and green, but the published boundary excludes the tee. The outer-ring diagnostic has no unique fairway on Nos. 3, 6 or 10. Runtime remains scorecard-only.
- **Ryder** has an exact [OSM boundary](https://www.openstreetmap.org/way/429532934), with zero matched routes. [Army MWR](https://bragg.armymwr.com/programs/golf) publishes a routing diagram. The [Ryder imagery review](ryder/README.md) adds 18 green outlines from USDA NAIP with an independent state imagery cross-check. A current club card, tee assignments and verified fairway geometry still block publication.
- **Tobacco Road** remains QA-only. The existing reviewed extract has 18 routes, 16 tees, 18 greens and 14 fairway holes. This more conservative automated review finds 12 fairway holes and independently confirms the missing mapped tee matches for Nos. 1 and 10. The [club hole guide](https://tobaccoroadgolf.com/golf/) offers a cross-check, but its hole summaries mix yardages and are unsuitable as a complete tee card.
- **Pinehurst No. 3** remains scorecard-only. The standalone boundary is unresolved in the pinned snapshot. The prior numbered routes inside the resort boundary are recorded in `../pinehurst-no3-osm-review.json`; they are not a verified individual course bundle.
- **Sassamon Trace** has nine matched routes, tees and greens in the [venue boundary](https://www.openstreetmap.org/way/311190601). No uniquely assigned fairway on par-3 No. 3. The [native nine-hole implementation](native-nine/README.md) now bundles and exercises that topology through check-in, scoring, Yardage Book and House Ghost.
- **Quail Ridge** independently matches 18 routes, tees, greens and fairway holes. The bundled Black card remains the audited geometry reference. Legacy White, Gold and Red still need current per-hole confirmation. The [Sanford club site](https://thegolfcourseatquailridge.com/course-details/) identifies the renovated course. The [USGA listing](https://ncrdb.usga.org/courseTeeInfo?CourseID=271) corroborates the Black total of 6,783 yards. Do not import similarly named courses in other states.
- The Bayonet, Chimneys, Pine Hills, Kiawah and King's Grant runtime assets are unchanged. King's Grant keeps the two disclosed reference tee points and its existing reference-ready status.

## Reproduce

Use Python 3.12 with `shapely==2.1.2` and `osmium==4.2.0`. For each manifest below, download the dated `source` PBF, verify `pbfSha256`, and use the manifest bounds exactly when present.

```sh
python3 scripts/course-factory-snapshot.py region.osm.pbf snapshot.osm --sha256 "$pbf_sha" # add --bbox WEST SOUTH EAST NORTH for cropped inputs
python3 scripts/course-factory-review.py snapshot.osm --manifest qa/course-factory/founders/pelican-manifest.json
python3 tests/course-factory-pipeline.test.py
node --test tests/friday-founders-two-course-books.test.mjs
```

Use `sassamon-manifest.json` and `north-carolina-manifest.json` for their separate source snapshots. The reviewer verifies `snapshotSha256` before parsing the manifest. [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), via [Geofabrik](https://download.geofabrik.de/north-america/us.html).
