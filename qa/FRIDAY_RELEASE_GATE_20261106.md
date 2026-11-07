# DAGGER COUNTRY CLUB — FRIDAY RELEASE FREEZE
November 2, 2026 · Candidate branch: `release/friday-staging-20261106`

## Owner decision
Dagger is a private golf app for friends, not a commercial launch. Freeze new features and visual revisions now. Prioritize a genuinely useful and fun full-round experience. No more optional previews, new games, feature brainstorms, or framework work until the candidate is usable.

## Current verified evidence
- **Friday Ghost QA: 65/65 passing**, workflow run **41512128247**.
- **Caddy and course safety: passing**, workflow run **41512128271**.
- The Friday branch includes host-screen QR, auto-join invitation and recovery code; exact Friday candidate **has not completed a physical two-phone test**.
- The current Yardage Book preview has 18-hole navigation, a Back to Play control, and a selected-hole picker; **verified provider course/tee distances are not integrated into the playable screen**. Never present inferred distances as real.
- BBB/Nassau settlement and Ghost calculations have automated coverage, but this is **not proof that every game is fully integrated end to end**.
- The 19th Hole is an optional **manual** chat receipt, not a live Ledger settlement or a reason to delay the release.
- House Ghost trails remain simulated schematics, not actual shot-by-shot GPS evidence.
- Public GitHub Pages `/playtest/` serves the deployed production branch, **not necessarily this release branch**. Do not tell the owner to test Friday code until it is hosted at a verified candidate URL.

## Scope lock: no more feature expansion
The release experience is: select course/tees → open Yardage Book and return to Play → score an 18-hole round → play BBB/Nassau/skins → see accurate Ledger → join Money Room by scanning host's QR → use existing AI Caddy, with honest fallback when course/weather data is unavailable. Optional recap is nonblocking.

## Finish gates, in order
1. **Integration:** verify the exact deployed candidate lets one player navigate an entire round without disappearing scores, conflicting course/tee selections, or accidentally settled wagers. Fix only genuine blockers.
2. **Games & Ledger:** verify BBB, Nassau and skins with tie/carry/correction cases across the actual UI, not only pure-unit tests.
3. **Yardage Book:** verify navigation and Back button in deployed UI; real yardages only where provider source has been verified. If course data isn't ready, keep it clearly unverified rather than inventing coverage.
4. **Money Room:** host phone shows QR; second phone joins without a signup; both devices score, refresh and recover, and unauthorized access fails. Owner will perform this when available.
5. **Final acceptance:** verify AI Caddy fallback, narrow iPhone layout, original frozen R160 seal/design, correct hosted origin, backup/rollback. Re-run checks against the *exact* deployment SHA.
6. **Ship decision:** ask owner to test one stable candidate and approve promotion only after the gates pass. Do not modify production Firebase rules/data or overwrite main before that.

## Stop rule
If a new idea is fun but does not fix a blocker, **defer it**. Do not increment the feature count. The aim is to finish changing Dagger so people can start using it.

## Release decision
**HOLD** until the integrated candidate and owner two-phone acceptance pass. Passing 65 tests is encouraging but is not the same as a completed live round.

## Latest automated acceptance — November 2
- Candidate commit `b0d25d30d9e9125841a17e1d699328301a51e7f0` passed Friday Ghost QA workflow `41552689475` including **2/2 Chromium browser checks**.
- The browser test entered via starter setup and Games, opened Yardage Book using the actual link, advanced a hole, returned to Play, and confirmed seeded local wager and BBB storage stayed identical.
- Caddy and course safety workflow `41552689483` also passed.
- This **does not** verify a complete 18-hole live Money Room, the two-phone join, real course yardages, or a hosted production-origin session. Those are still release gates.

## Staging Hosting handoff — November 2
- Exact Friday candidate is available as the `dagger-friday-candidate` GitHub Actions artifact after the full CI gate. Hosting has **not** been deployed.
- `qa/deploy-friday-preview.sh /absolute/path/to/unzipped/candidate` validates the artifact, verifies SHA files, requires a typed confirmation, then deploys **Hosting only** to expiring preview channel `friday-friends-20261106` in explicit Firebase project `dagger-country-club-staging`. It never deploys functions, rules, Firestore data, or production site files.
- Script requires an authenticated Firebase CLI session with permission to deploy Hosting to **the staging project**; these credentials are not available through connected GitHub file tools. Do not report hosted preview completion until the command prints a real URL and the page works.
- Firebase Authentication authorized domains must be checked for the preview channel hostname before two-phone join can be treated as functional. Confirm staging auth and permissions, and test host and guest with two separate devices.
- Production GitHub Pages URL and existing main branch remain untouched during preview work.

## Course-data integration milestone — November 3
- The Yardage Book now loads the **active Starter's Desk course and exact tee** via `playtest/yardage-live.js` → `getActiveCourseContext` → OpenGolfAPI hole adapter. The view shows selected-tee par and yards only for validated provider holes, with explicit 0–18/18 coverage and cached provider provenance. It never substitutes scorecard yardage for live pin GPS.
- Provider-backed Chromium acceptance supplies two tee-specific hole fixtures (412 and 165 yards), verifies that the missing third hole stays unverified, and confirms the saved wager persists through return to Play. **Mocked-provider acceptance is not a live field test.**
- Friday Ghost QA run `41764254116` passed all **9 browser tests** and underlying suite; Caddy/course safety run `41764254105` passed. Branch SHA `a6f9f24bc1a58690a8db7a8a126dfc8ca9bf9114`.
- Course search and detailed scorecard coverage are different: OpenGolfAPI claims ~32,700 searchable courses, with scorecards/yardages for only about half (provider data-quality dashboard as of Nov 2026). Do not claim every course has full hole detail, tee geometry, hazards, live pin location, or GPS distance.
- Next checks: independently open actual Whispering Pines Pines and Bayonet selections in staging, validate tee names and full hole cards against each course's official scorecard, then build the mapped course geometry and live conditions foundation for shot-aware Caddy and Ghost. Bayonet online sources currently disagree on tee totals; never silently merge conflicting records.
- Preserve previous Firebase candidate until a new staging preview passes browser checks and owner review. Never modify main/production or saved game data to backfill scorecards.

## November 6 notebook candidate
- Shared artwork resolves course and hole before drawing. Bayonet at Puppy Creek is keyed to its Raeford provider ID. The bundled ODbL source supplies distinct routes, tees and greens for 18 holes. The booklet cross-check informs an approximate reference annotation on 7. For the rest of the catalog, the adapter draws only the available hole-assigned polygons or route. Scorecard notes remain available for courses without a layout.
- New Bayonet check-ins offer the five coherent club tee rows. The live provider's tee totals conflict with the club card. Saved rounds retain the selected tee.
- Yardage Book and House Ghost draw the same portrait layout. Ghost shot positions are simulated, with tier-dependent carry and spread. Existing competitive scores and settlements remain owned by their original game flows.
- The book passes the exact hole, tee, and approximate trouble to the existing Caddy draft. The game plan and Caddy context can use saved club carries and explicitly recorded direction outcomes.
- Ticket Window is view-first. Local ticket net is based on resolved outcomes, with outstanding debts and paid status tracked separately. Archives remain available below the tickets.
- CI packages the exact Friday checkout, runs the existing Chromium gates, then attempts an expiring, commit-specific Firebase Hosting preview using repository workload identity. The original preview stays available during acceptance. If identity is unavailable, use the verified candidate artifact and the existing deploy script with an authenticated staging CLI.
- Full release acceptance still requires physical QR scanning, a live AI reply, and validation of gameplay data integration. Existing score prefill and read-only comparisons are not universal automatic game scoring.
