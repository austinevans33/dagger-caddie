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
