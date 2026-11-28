# Operation Kingdom Build

## Mission 1 — Release qualification

- Baseline production is `8a07777e19c26529d1adccbc0296961977e7b3a4`.
- PR #108 at `2ef99740821112a33187c419e859e3d4b435ed8c` failed the immutable checkout comparison in Actions run 45732898854 on the founders catalog. Its rehearsal passed.
- PR #109 at `3264fd143bfcd83b75a18d1631c4254a52d5f231` failed the immutable checkout comparison in run 45733214472 on Ghost playback. Run 45733214322 also rejected Ghost changes that fell outside the old narrow HTML/script guard. A follow-on staging test attempted to load Playwright before setup had run.
- The integration branch starts at #109 and applies only the reviewed #108 diff against the common production base. It pins the exact runtime from `227f400e0c358c6abda06f70fa5efa17b6e712dd` using an explicit file list. Both workflows compare complete bytes and continue to protect the existing Firebase project and public bundle. The rehearsal permits the exact starting-hole picker and the original Ghost section while comparing other root HTML against the baseline.
- Before production, confirm green checks on the exact head and tree, verify the on-device rehearsal including saved-round recovery, and obtain explicit owner approval. Production publication remains outside this branch.

## Continuation

| Mission | Branch evidence | Next acceptance task |
| --- | --- | --- |
| 1. Release candidate | Integration branch and immutable pin | Collect Chromium, WebKit, baseline and two-session staging room evidence for this exact head. |
| 2. Any-hole gameplay | Original Ghost picker and playback, rotated Ghost/solo/Nassau library contracts | Wire the contracts into live solo and wager entry, pass a pinned starting order to shared rooms, verify partial archives, reconnect and no settlement for unplayed holes. |
| 2B. All Heart | Preserve #73, #81 and #102 | Port the approved adapter and receipt logic with room/round-scoped state. Verify natural frequency and forced cases before release. |
| 3. Course Factory | #108 acquisition and inventory helpers | Run previously researched NC candidates through real source and geometry audits. Count each readiness stage separately. |
| 4. Course intelligence | Existing shared course/conditions modules | Continue after the acquisition pipeline passes a real batch. |
| 5. Golf Trip Mode | Existing Cup De Diesel Nips design and history | Resume after shared round and course contracts are stable. |

### North Carolina batch 01

Run `node scripts/kingdom-course-preflight.mjs the-woods-whispering-pines-nc mill-creek-mebane-nc hillandale-durham-nc neuse-clayton-nc`. The command runs the current production course catalog, pinned-art loader and Ghost simulator. An unavailable or incomplete drawing stays visible in the result without stopping other courses.

| Course | Club card checked | Full drawings | Partial drawings | Scorecard Ghost |
| --- | --- | ---: | ---: | --- |
| The Woods, Whispering Pines | Club PDF byte-identical to the prior pin, official HTML re-fetched | 18 | 0 | Yes |
| Mill Creek, Mebane | Both club card images byte-identical to the prior pins | 17 | 1 (Hole 17) | Yes |
| Hillandale, Durham | Club image byte-identical to the prior pin | 18 | 0 | Yes |
| Neuse, Clayton | Club image byte-identical to the prior pin | 0 | 0 | Yes |

The first three maps are exact original Course Factory review blobs from `5b98d3a`. Their SHA-256 digests are checked again by the batch regression. The Woods catalog pins the unaffected club PDF while retaining the refreshed HTML location. Neuse carries the clean scorecard-only record from `81f76d4`. Its lack of verified geometry does not block scoring or Ghost.

Full candidate preflight across the curated catalog found 38 courses and 38 scorecard/Ghost-ready courses, 23 with at least one full drawing, and 15 with all holes fully drawn. These are runtime preflight counts. End-to-end and release qualification are tracked separately in CI. OpenGolfAPI listings are outside these counts.

The next acquisition pass should reopen the prior Seven Lakes review and Pine Island proof before requesting new geometry. Mill Creek No. 17 can keep verified tee, green and routing while its fairway remains omitted.

### North Carolina batch 02

Recovered previously researched course files from `c32c77e` after re-fetching and matching the original club scorecard bytes. Greensboro National, 12 Oaks, Hope Valley and Country Hills join the scorecard and House Ghost catalogs. The original OSM drawings are retained byte-for-byte. Greensboro National 16, 12 Oaks 11 and Hope Valley 14 remain partial. Country Hills has all 18 complete drawing records.

With this batch the runtime preflight reports 42 discovered, 42 scorecard-ready, 27 with drawings, 42 Ghost-ready and 16 with complete drawing preflight. Full course-by-course gameplay verification and geometries for the other 26 are distinct from those counts.
