# Founders and North Carolina Course Factory handoff

This draft is stacked on [PR #52](https://github.com/austinevans33/dagger-caddie/pull/52) at `1b70fc631d517b3bda349d3c36f7dba5d383ef76`. [PR #46](https://github.com/austinevans33/dagger-caddie/pull/46) remains the release handoff. The release branch was inspected at `75c8a13ce9a45f05384445c134d6c701838cf318`. The candidate is for review. No staging or production deploy was run.

## Qualified North Carolina additions

| Course | OpenStreetMap venue | Routes / tees / greens / fairways | Official card used for parity |
| --- | --- | --- | --- |
| Longleaf Golf & Family Club, Southern Pines | [Relation 6387132](https://www.openstreetmap.org/relation/6387132) | 18 / 18 / 18 / 18 | Tee 6, 6,153 yards, par 72 |
| Sanford Municipal Golf Course, Sanford | [Way 430087361](https://www.openstreetmap.org/way/430087361) | 18 / 18 / 18 / 18 | Men’s, 6,304 yards, par 71 |

The [North Carolina manifest](../qa/course-factory/north-carolina/manifest.json) records the dated Geofabrik source, ODbL license, original club-card URLs and SHA-256 values. The [coverage report](../qa/course-factory/north-carolina/coverage.json) and individual reviews record the exact output hashes and strict parity results. Gates Four and Tanglewood Championship remain strict passes. Geometry comes from [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).

- **Longleaf** publishes seven consistent hole-by-hole rows, Right Start and Tees 1–6. Tee 7 was withheld because its hole values add to 6,685 and its printed total says 6,682. The intermediate tees list aggregate values without hole-by-hole rows. [Official club card](https://longleafgfc.com/wp-content/uploads/sites/9351/2024/02/Longleaf-ScoreCard-2020-1.pdf).
- **Sanford Municipal** publishes separate front and back images. The manifest requires both files and verifies both digests before the transcribed rows are accepted. The four tee rows match the printed front, back and round totals. No handicap index was imported from the unlabeled split row. [City scorecard](https://www.sanfordnc.net/326/Scorecard).
- **Pipeline** accepts separately hashed companion pages for cards from multiple files. The cache fetches each source by its pinned identity, and the importer rejects a missing or altered page. Both source URLs and digests travel with the catalog entry. Image transcription is reviewed manually.

## Founders coverage

| Course | Result and remaining evidence |
| --- | --- |
| Hyland | Added the official women’s stroke index row. White No. 10 remains par 3 at 167 yards, with men’s index 16 and women’s index 18. Artwork stays gated. The No. 10 tee lies in an excluded parcel, and Nos. 3, 6 and 10 lack a uniquely assigned fairway in the outer-ring review. |
| Tobacco Road | The current club page confirms all pars. Its unlabeled 6,532-yard row differs from the named 6,557-yard Ripper row on Nos. 2 and 4. Existing named tee values remain separate. Artwork still needs independently verified tee starts for Nos. 1 and 10 and additional mapped fairways. |
| Ryder | The official Army MWR diagram corroborates the supplied layout. The pinned open-map venue still has no numbered hole routes. The USDA NAIP tile identified in the prior handoff remains a candidate, pending successful imagery alignment and trace review. |
| Pinehurst No. 3 | Official cards are available. The pinned data still lacks a verified separate course boundary and sufficient tee and fairway coverage. |
| Pelican Pointe | The three official pairings remain scorecard-ready. Ten of 27 routes cross gaps in the mapped boundary. |
| King’s Grant, Quail Ridge, Sassamon Trace | Passed targeted browser checks in the candidate. King’s Grant retains the disclosed reference tees on Nos. 9 and 13. Quail Ridge retains the Black-tee strict pass and legacy status for its White, Gold and Red cards. Sassamon retains its native nine-hole round and no drawn fairway at the par-3 third. |

See the [complete Founders matrix](../playtest/course-art/FOUNDERS_12_STATUS.md) and the [prior source notes](../qa/course-factory/founders/native-nine/README.md). The next Founders source review should establish Ryder’s tee-to-green routing using reusable georeferenced imagery and the MWR routing as a cross-check. Pinehurst No. 3 needs a distinct verified venue boundary before promotion. No user action is required to keep investigating those sources.

## Reproduce the verification

1. Follow the [Course Factory commands](../qa/course-factory/carolinas/README.md#reproduction) with `region=north-carolina`. Regeneration against the pinned golf-only snapshot and cached cards produced a byte-for-byte match with the candidate. The run reported four strict NC passes.
2. Run `node --test tests/*.test.mjs` and `python3 tests/course-factory-pipeline.test.py`. Local results were 258 Node passes and six Python passes.
3. Run the Friday candidate integrity script against the prepared candidate. It checked 198 local references with zero missing.
4. Run the Friday browser workflow for Longleaf, Sanford Municipal, King’s Grant, Quail Ridge and Sassamon Trace. All five passed locally in Chromium. Each new NC case used a 390 × 844 viewport, visited 18 distinct drawings, matched House Ghost artwork and a tracer against the Yardage Book, and checked the Ask My Caddy context. The browser used isolated local app data and disabled external course search for these cases. Live AI replies, hosted Firebase, physical iPhone and hosted staging acceptance were outside this pass.

The branch is course data, source tooling, regression tests and documentation only. Review GitHub checks on the draft PR. A hosted staging preview requires separate approval.
