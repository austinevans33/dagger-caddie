# Dagger Country Club development handoff

Snapshot taken November 7, 2026, America/New_York. Repository: [austinevans33/dagger-caddie](https://github.com/austinevans33/dagger-caddie). This records the completed Course Factory batch and its immediate release dependencies.

## Start here

- **Release tip inspected:** `release/friday-staging-20261106` at `75c8a13ce9a45f05384445c134d6c701838cf318`. This includes the merged House Ghost automatic-par fix.
- **Latest tested course stack:** `feature/founders-kings-grant-kiawah-20261107` at `5f051d761825ee740708554a1cbffb423e615ec6`, Git tree `d4e31d20ec43529f4a0b0580765792d710a5b9e6`. Use this branch to inspect the complete batch.
- **Availability:** The five newly bundled course books are present in the draft stack and browser-tested in GitHub Actions. They have not been released or deployed by this work. All three course PRs remain open drafts.
- **Protect:** Keep the approved branding, seal, navigation and visual identity. Preserve score writes and round IDs, House Ghost scoring and reveal behavior, Firebase project boundaries, Money Room membership and server-fresh QR checks, Ledger and wager settlement, AI backend and saved data. The course stack does not modify those systems or their schemas. Its runtime scope is the Founders catalog, course geometry, Yardage Book and shared sketch presentation.

## Branches, commits and pull requests

| PR | Head branch and exact SHA | Base and status |
| --- | --- | --- |
| [#41 Original Course Factory handoff](https://github.com/austinevans33/dagger-caddie/pull/41) | `handoff/work-bulk-course-factory-20261107` · `5726f9a999c30bd941aa3ba88972a852e29b2499` | `release/friday-staging-20261106`. Open draft, reference document. |
| [#42 Automatic House Ghost par](https://github.com/austinevans33/dagger-caddie/pull/42) | `feature/ghost-auto-hole-par-20261107` · `2b355f6ae783a6e11a5d949d6a08cf88ebf68f8f` | Merged into `release/friday-staging-20261106` as `75c8a13ce9a45f05384445c134d6c701838cf318`. |
| [#43 Quail Ridge](https://github.com/austinevans33/dagger-caddie/pull/43) | `feature/founders-kings-grant-quail-ridge-20261107` · `1a2059206d88d54c9dcad84fb56e15973947613b` | `release/friday-staging-20261106` at `75c8a13ce9a45f05384445c134d6c701838cf318`. Open draft. |
| [#44 Winder and NC audits](https://github.com/austinevans33/dagger-caddie/pull/44) | `feature/founders-source-reconciliation-20261107` · `0ffec6a7fd7572616776973e56ce37c1b3388053` | #43 branch at `1a2059206d88d54c9dcad84fb56e15973947613b`. Open draft. |
| [#45 King’s Grant and Kiawah](https://github.com/austinevans33/dagger-caddie/pull/45) | `feature/founders-kings-grant-kiawah-20261107` · `5f051d761825ee740708554a1cbffb423e615ec6` | #44 branch at `0ffec6a7fd7572616776973e56ce37c1b3388053`. Open draft. |
| [#38 Pelican Pointe loop work](https://github.com/austinevans33/dagger-caddie/pull/38) | `feature/founders-pelican-27-hole-routing-20261107` · `19e67912b7bf0faaf262e644411c4a3c069bb843` | Separate open draft targeting release. Outside the tested stack. |
| [#40 Provider geometry audit](https://github.com/austinevans33/dagger-caddie/pull/40) | `feature/founders-remote-art-audit-20261107` · `e654507bd20e851c7c977c9f6d77c62320a60329` | Separate open draft targeting release. Outside the tested stack. |

| PR | Implementation history |
| --- | --- |
| #42 | `e86e9c95ae9b505ab30184c456f2bd71b3583d2e` uses the selected hole’s verified par and retains manual choice when the card has no fact. `2b355f6ae783a6e11a5d949d6a08cf88ebf68f8f` covers the Bayonet No. 1/2 transition and manual fallback in the browser. |
| #43 | `0bf82a17bef7158fbce94ef3a0cbbcf7b6a8e36d` bundles Sanford Quail Ridge, adds its Black card, imports pinned OSM sources, archives the original King’s Grant blockers and retains polygon cutouts in the shared renderer. `1a2059206d88d54c9dcad84fb56e15973947613b` waits for Caddy document readiness in browser assertions. |
| #44 | `351327ec92a90182228f72090a4c3632fd6b8064` records King’s Grant photo reconciliation and Tobacco Road/Pinehurst preflight. `0ffec6a7fd7572616776973e56ce37c1b3388053` bundles The Chimneys and Pine Hills and adds their browser checks. |
| #45 | `b1fca5aa1a4c674eea2e5f5735f2ca27b265dce9` enables King’s Grant with two disclosed reference tees and records the initial Kiawah audit. `5f051d761825ee740708554a1cbffb423e615ec6` promotes Kiawah after the No. 16 tee match and strict geometry audit. The interim `qa/course-factory/kiawah-audit-only.json` was superseded by the runtime bundle. |

## Exact file inventory

The following lists are the net changed paths against each PR’s recorded base. To see changes within a commit, use `git show --name-status <sha>`. The documentation PR itself adds only `docs/DAGGER_DEVELOPMENT_HANDOFF_20261107.md`.

### PR #42

```text
M	playtest/index.html
M	tests/friday-browser.spec.mjs
```

### PR #43

```text
M	playtest/course-art/FOUNDERS_12_STATUS.md
M	playtest/course-art/README.md
A	playtest/course-art/quail-ridge-sanford-nc.json
M	playtest/course-pencil-geometry.js
M	playtest/founders-verified-scorecards.js
M	playtest/ghost-preview.html
M	playtest/hole-sketch.js
M	playtest/shared-hole-sketch.js
M	playtest/yardage-live.js
M	playtest/yardage-preview.html
A	qa/course-factory/README.md
A	qa/course-factory/kings-audit.json
A	qa/course-factory/kings-grant-audit-only.json
A	qa/course-factory/kings-osm-review.json
A	qa/course-factory/quail-audit.json
A	qa/course-factory/quail-osm-review.json
A	scripts/audit-founder-bundle.mjs
A	scripts/import-founder-osm.py
M	tests/friday-browser.spec.mjs
M	tests/friday-founder-checkin-and-art.test.mjs
M	tests/friday-founder-geometry-audit.test.mjs
M	tests/friday-founders-two-course-books.test.mjs
```

### PR #44

```text
M	playtest/course-art/FOUNDERS_12_STATUS.md
A	playtest/course-art/chimneys-winder-ga.json
A	playtest/course-art/pine-hills-winder-ga.json
M	playtest/founders-verified-scorecards.js
M	qa/course-factory/README.md
A	qa/course-factory/chimneys-audit.json
A	qa/course-factory/chimneys-osm-review.json
A	qa/course-factory/pinehills-audit.json
A	qa/course-factory/pinehills-osm-review.json
A	qa/course-factory/pinehurst-no3-osm-review.json
A	qa/course-factory/tobacco-audit-only.json
A	qa/course-factory/tobacco-audit.json
A	qa/course-factory/tobacco-osm-review.json
M	scripts/audit-founder-bundle.mjs
M	scripts/import-founder-osm.py
M	tests/friday-browser.spec.mjs
M	tests/friday-founder-geometry-audit.test.mjs
```

### PR #45

```text
M	playtest/course-art/FOUNDERS_12_STATUS.md
A	playtest/course-art/kiawah-ocean-course-sc.json
A	playtest/course-art/kings-grant-fayetteville-nc.json
M	playtest/founder-geometry-audit.js
M	playtest/founders-verified-scorecards.js
M	playtest/ghost-preview.html
M	playtest/hole-sketch.js
M	playtest/shared-hole-sketch.js
M	playtest/yardage-preview.html
M	qa/course-factory/README.md
A	qa/course-factory/kiawah-audit.json
A	qa/course-factory/kiawah-osm-review.json
A	qa/course-factory/kings-reference-audit.json
A	qa/course-factory/kings-reference-review.json
M	scripts/audit-founder-bundle.mjs
M	scripts/import-founder-osm.py
M	tests/friday-browser.spec.mjs
M	tests/friday-founder-checkin-and-art.test.mjs
M	tests/friday-founder-geometry-audit.test.mjs
```

## Course Factory coverage

Strict Bayonet parity requires exact venue identity, a complete verified comparison card, 18 real oriented routes and matched tee and green outlines, at least 17 mapped fairway holes, and a passing route-to-card distance sanity check. Yardage Book and Ghost share the same drawing. The route-length check is a mismatch detector. Selected-tee card yardage remains a separate fact. King’s Grant uses a course-specific reference-tee path while the strict result remains false.

| Founders course | Route / mapped tee outlines / green / fairway holes | Current disposition |
| --- | --- | --- |
| Bayonet at Puppy Creek, NC | 18 / 18 / 18 / 17 | Existing strict benchmark. Prior owner iPhone field test and current browser regression coverage. |
| Ryder, NC | Unqualified geometry | Three published tee cards. Need hole-specific geometry and an independently sourced stroke index. |
| King’s Grant, Fayetteville NC | 18 / 16 + 2 reference points / 18 / 18 | Playable candidate through the approved reference-tee path. Strict result false. Nos. 9 and 13 say **TEE (APPROX.)** and have no manufactured tee polygon. No. 13 uses the short reference route and a pond-beyond-green note. Blue card values remain 288 and 132 yards. |
| The Chimneys, Winder GA | 18 / 18 / 18 / 17 | Strict pass against Gold. No. 11 par 3 has route, tee and green without a verified fairway. |
| Pelican Pointe | Provider fallback in this stack | #38 explores the three nine-hole loops. Confirm each loop identity and routing pair before enabling any full book. |
| Hyland, NC | Unqualified geometry | White, Gold and Red published cards. Black and Blue source totals conflict with hole sums. |
| Tobacco Road, Sanford NC | 18 / 16 / 18 / 14 | QA only. Nos. 1 and 10 need tee associations. Fairway coverage is below the minimum. No. 14 pond and the shared Nos. 15/16 fairway are preserved in the audit. |
| Pine Hills, Winder GA | 18 / 18 / 18 / 17 | Strict pass against Blue. No. 16 par 3 has no verified fairway. Red No. 18 retains par 5 and 360 yards in the browser test. |
| Sassamon Trace | Provider fallback in this stack | Source and verify the actual nine-hole routing. Requires a nine-hole-specific quality check. |
| Quail Ridge, Sanford NC | 18 / 18 / 18 / 18 | Strict pass against Black, 6,783 yards with USGA total cross-check. No. 14 uses card par 5 and 496 yards over a stale OSM par tag. White, Gold and Red remain source-listed legacy rows. Current per-hole club/GHIN confirmation and verified Blue hole values are outstanding. |
| Pinehurst No. 3 | 18 candidate routes / 10 tees / 18 greens / 0 validated fairways | Official four-tee card, scorecard only. Parent resort contains multiple courses. Need isolated No. 3 identity and missing mapped features. |
| Kiawah Ocean Course, SC | 18 / 18 / 18 / 17 | Strict pass against official Black. Club No. 16 diagram confirms the existing tee polygon. Only the route start is aligned, about 25 m. The illustrated line is 575 yards and the Black card says 577. No. 17 mapped pond remains visible and no unverified fairway is drawn. |

**Total:** Five newly bundled course books in #43–#45. Four pass strict parity. King’s Grant is separately reference-ready. Including the existing Bayonet benchmark, the stack has six full routed books, five strict and one reference-ready. This is a coverage count for the tested stack, not for a hosted build.

### Sources and reproducibility

- [Current Founders matrix](https://github.com/austinevans33/dagger-caddie/blob/5f051d761825ee740708554a1cbffb423e615ec6/playtest/course-art/FOUNDERS_12_STATUS.md) and [source review instructions](https://github.com/austinevans33/dagger-caddie/blob/5f051d761825ee740708554a1cbffb423e615ec6/qa/course-factory/README.md).
- The pinned OSM XML URLs, SHA-256 hashes, element IDs and associations are under `qa/course-factory/`. Distributed geometry preserves ODbL attribution. Raw XML can contain contributor metadata and stays outside the repository. A live API extract can change, so require a fresh review before replacing pinned bytes. Owner screenshots and third-party imagery are reference evidence kept out of runtime assets.
- `scripts/import-founder-osm.py` uses Shapely 2.1.2 as offline maintainer tooling. It checks source bytes, boundary identity and containment, numbered routes, allowed feature types and geometric associations. `scripts/audit-founder-bundle.mjs` prints machine-readable hole checks. Use the recorded reference tee for each audit.
- Rebuilds of the reviewed King’s Grant and Kiawah bundles matched committed bytes. The earlier King’s Grant OSM-only audit remains available for comparison. Other pinned bundles were also reproduced during development. The importer rejected a missing No. 16 source reference and a distant substitute tee.

## Verification, failures and limits

| Candidate | Actual results | Evidence |
| --- | --- | --- |
| #43 | 242 Node tests, 195 asset references and 41 Chromium tests passed. Covered distinct Sanford hole drawings and shared Ghost on No. 14. | [Friday Ghost QA](https://github.com/austinevans33/dagger-caddie/actions/runs/42411589064) |
| #44 | 245 Node tests, 195 asset references and 43 Chromium tests passed. Opened all 36 Winder drawings at iPhone width. Checked notes, the selected card and identical Ghost SVG geometry on the sampled holes. | [Friday Ghost QA](https://github.com/austinevans33/dagger-caddie/actions/runs/42414137022) · [Caddy and course safety](https://github.com/austinevans33/dagger-caddie/actions/runs/42414137120) |
| #45 | 247 Node tests, 195 asset references and 44 Chromium tests passed. Mobile checks opened all 36 King’s Grant and Kiawah drawings. Ghost matched and animated on King’s Grant Nos. 9/13 and Kiawah No. 16. King’s Grant displayed the two approximate tee labels and official Blue values. | [Friday Ghost QA](https://github.com/austinevans33/dagger-caddie/actions/runs/42416193999) · [Caddy and course safety](https://github.com/austinevans33/dagger-caddie/actions/runs/42416194005) · [Candidate ZIP](https://github.com/austinevans33/dagger-caddie/actions/runs/42416193999/artifacts/13591786869) · [Browser screenshots](https://github.com/austinevans33/dagger-caddie/actions/runs/42416193999/artifacts/13591532342) |

- CI builds the PR merge checkout. For #45 the PR head is `5f051d761825ee740708554a1cbffb423e615ec6` and the reported synthetic merge is `2f58554584848cb9042368f0dc8779f8e13d72e5`. Check the actual candidate stamps before using an artifact. `FRIDAY_BRANCH_SHA.txt` identifies the branch head. `FRIDAY_CHECKED_OUT_SHA.txt` and `FRIDAY_BROWSER_VERIFIED_SHA.txt` identify the bytes used in QA. Artifacts have finite retention.
- Early #43 local browser runs saw intermittent Caddy arrival assertions before composer initialization. The test now waits for document readiness and the final CI run passed. An early #44 local invocation also returned `ERR_CONNECTION_REFUSED` when the candidate server was unavailable to the browser process. Running the server and browser together produced a passing full rerun.
- The original King’s Grant OSM bundle fails for No. 9’s missing tee and No. 13’s long route against the current card. The reference-ready bundle resolves playable rendering through explicitly allowed approximate points. It does not claim surveyed tees. Tobacco Road and Pinehurst coverage failures remain expected and visible in the review.
- The packaged browser suite covers course check-in and fallback, Caddy handoff, Ghost score reveal and round navigation, and regression paths for scoring, Ledger, Ticket Window, and Money Room QR. The PR suite does not establish physical iPhone Safari behavior, live authenticated two-phone writes, live AI service response, or on-course mapping accuracy for the new books. Those remain staging/field checks.
- The separate R177 frozen-file checksum check passed on the preserved baseline checkout. The implementation diffs contain no logo, seal, stylesheet, Firebase settings, rules, settlement engine or saved-data migration changes.

### Re-run on the exact branch

```sh
git fetch origin release/friday-staging-20261106 feature/founders-kings-grant-kiawah-20261107
git worktree add --detach ../dagger-course-review 5f051d761825ee740708554a1cbffb423e615ec6
cd ../dagger-course-review
git rev-parse HEAD HEAD^{tree}
node --test tests/*.test.mjs
python3 tests/friday-bundle-integrity.py
node scripts/audit-founder-bundle.mjs "Kings Grant" playtest/course-art/kings-grant-fayetteville-nc.json blue
node scripts/audit-founder-bundle.mjs "Ocean Course" playtest/course-art/kiawah-ocean-course-sc.json black
```

For the browser run, use Node 22 and the package/serve steps in [Friday Ghost QA](https://github.com/austinevans33/dagger-caddie/blob/5f051d761825ee740708554a1cbffb423e615ec6/.github/workflows/friday-ghost-qa.yml). Run Playwright against the packaged candidate, not an unrelated hosting URL. The normal command is `npx playwright test tests/friday-browser.spec.mjs tests/friday-game-score-preview.spec.mjs --project=chromium --workers=2 --reporter=line --trace=retain-on-failure`.

## Deployment and owner checks

1. Review the actual stack in dependency order #43 → #44 → #45. If integrating sequentially, confirm the new base and ancestry at each step, retarget stacked PRs as needed and rerun checks against the actual target tree. Alternatively prepare one reviewed release integration PR from the full stack. Preserve the known release head and its prior verified hosting artifact as rollback references.
2. The existing workflow publishes only on an eligible push to `release/friday-staging-20261106` after browser smoke and exact SHA checks. The PR deploy jobs were skipped. The target is an isolated `friday-<short-sha>` Firebase Hosting channel in `dagger-country-club-staging`. It uses existing workload identity configuration. The workflow compares the hosted browser-verified SHA and `hole-sketch.js` bytes to the candidate. Get the exact preview URL from that run’s summary. Earlier preview URLs are older builds.
3. On an actual iPhone in Safari, open the exact staging link. Check King’s Grant Blue Nos. 9/13 for the tee labels, hole identity, card values and short No. 13 line. Switch between the Yardage Book and Ghost, confirm identical maps, return to the same hole and reload. Repeat on Quail Ridge Black No. 14, The Chimneys Gold No. 11, Pine Hills Red No. 18 and Kiawah Black Nos. 16/17. Check scorecard totals, existing saved-round recovery, Caddy context and readability.
4. Use two physical phones and a disposable staging room. Create a host-screen QR, scan with the guest’s normal camera, check join, scores, reconnect, guest permissions and archive protection. Run a small BBB game, archive once, reload, and verify settlement and Club Record are counted once. Use staging test identities and test data. Retain screenshots or exact error text.
5. If staging regresses, leave the suspect preview isolated. Use the previous verified preview and diagnose the exact candidate difference. Revert through normal reviewed Git changes if needed and rerun the staging workflow. Preserve Firestore records and avoid force resets or database operations. Production promotion remains a separate decision.

## Recommended next development steps

1. Land the reviewed course stack and verify the exact staged build before claiming new course books are available to players. Prioritize the physical iPhone and two-phone checks above.
2. Close Tobacco Road’s two tee associations and remaining fairway coverage with a club diagram or independently matched, licensed mapping evidence. Keep its scorecard fallback until the existing gate passes. Resolve Pinehurst No. 3 identity within the resort and obtain the missing shapes. Cross-check Quail Ridge’s remaining tee cards.
3. Process Ryder, Hyland, Pelican Pointe and Sassamon Trace in small verified batches. Give real nine-hole courses and 27-hole loop combinations their own identity and routing assertions. Keep source manifests, audited bundles, caddy context and shared Ghost browser coverage with each batch.
4. Keep real course and weather data, secure Money Room and Games-to-Ledger, AI context, and real-shot history on the established roadmap. Preserve Trip Architect, Cup De Diesel Nips, Bounty Board and Club Treasury in the deferred Golf Trip hopper. Its eventual planning, live tournament and settlement should build on the shared score and Ledger records, including the prize purse, trip-wide net, expenses, payment confirmation and audit trail. Keep the user flow short and reuse existing inputs.
