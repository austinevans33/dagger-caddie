# Native nine-hole and Founders reference review

## Sassamon Trace, Natick MA

The [club scorecard](https://sassamontrace.com/scorecard/) lists nine physical holes, par 32. The Blue, White, Yellow and Red cards total 2,383, 2,167, 2,011 and 1,744 yards. The published hole values and stroke indices are used as printed. No second loop is generated.

The [OpenStreetMap venue](https://www.openstreetmap.org/way/311190601) matches the club identity. The licensed extract has nine numbered playing lines with associated mapped tee and green polygons. Eight holes also have matched fairway polygons. No. 3 is a par 3, and neither the pinned extract nor the club routing diagram supports adding a fairway there. The native-nine gate requires nine mapped routes, tees and greens, with at most one absent fairway and only on a verified par 3. The existing 18-hole gate is unchanged.

The compressed reviewed subset retains original feature IDs, coordinates and attribution. It excludes edit-history metadata and unrelated records. Download checks and offline reproduction use the following pins.

| Artifact | SHA-256 |
|---|---|
| Club scorecard image | `1a0b6cd8da0a4c828ffca279c0ea48a92dbcc6a5f2a2105411c6bac51ab8f074` |
| Original bounded OSM API response | `a9145460202cd77b371fa001d8fcdfbae5c347d564e4d6806cd3030f4968d6e1` |
| Reviewed subset after decompression | `6a898def91bd8790070283c3de4c1345c96053aeece765b65107585376949499` |
| Playtest GeoJSON | `d19a908fc7ed5425b4a9d412cfe5a0dea9a6101d7705071daa29beb5eca2e2e7` |

```sh
qa=qa/course-factory/founders/native-nine
scratch=$(mktemp -d)
gzip -dc "$qa/sassamon-reviewed.osm.gz" > "$scratch/source.osm"
python3 scripts/import-founder-osm.py "$qa/sassamon-review.json" "$scratch/source.osm" "$scratch/map.json"
cmp "$scratch/map.json" playtest/course-art/sassamon-trace-natick-ma.json
node --test tests/friday-founders-two-course-books.test.mjs
```

Use Shapely 2.1.2 for the importer. [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).

## Hyland No. 10, Southern Pines NC

The supplied screenshot corroborates a short, mostly straight tee-to-green hole with bunkers near the green. The club card gives White 167 yards, par 3. The distances overlaid in the screenshot are independent readings and do not replace the club card.

The current bounded OSM response (`87052068807d23e39e6f758d7ff0899870aee9cd7b3112be0b65e4c9f833b1db`) contains the numbered [route 1092718144](https://www.openstreetmap.org/way/1092718144), [tee 1092718138](https://www.openstreetmap.org/way/1092718138) and [green 1089181461](https://www.openstreetmap.org/way/1089181461). The tee is approximately 16 m beyond an interior cutout of [the club relation](https://www.openstreetmap.org/relation/6385379). Both endpoints and the line are inside the relation's original outer ring. The independent screenshot and OSM agree on the hole identification and general shape. Neither changes the published boundary.

The outer-ring-only diagnostic assigns 18 routes, tees and greens and 15 fairways. Nos. 3, 6 and 10 lack uniquely matched fairways. The diagnostic and screenshot remain reference material. The runtime stays on its official scorecard while the production boundary exception and existing 17-fairway gate are unresolved. The screenshot was not copied or traced into application geometry.

## Ryder Golf Course, Fort Bragg NC

The supplied routing map identifies the 18 holes and visible relationships between adjacent holes, water and roads. [Army MWR's venue page](https://bragg.armymwr.com/programs/golf) publishes a [routing map](https://bragg.armymwr.com/download_file/view/c9727a5e-b56b-4c2e-a8d7-c6dd35a1dbc4/29653) for the same Ryder course. The official download SHA-256 is `d6cc76e98f8711adaeacf3a0b6e5b165dc7adc79aad162588e8f328e533ec057`. Neither image was bundled or traced into the app.

The current bounded OSM response (`1129101748a9a608fc10ef9f7776b2b82044d937611fb2ea47f2891bdf68a33b`) still returns [the Ryder boundary](https://www.openstreetmap.org/way/429532934) with zero matched numbered routes. The routing image is useful for checking hole order and orientation after obtaining a licensed georeferenced source. It does not itself establish reusable coordinates or rights to the aerial background. The existing scorecard stays available.
