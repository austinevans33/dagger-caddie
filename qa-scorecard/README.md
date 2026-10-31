# Premium playtest scorecard — October 30, 2026

Baseline: `984766e35f241ac14fdf3275ef45d97569d2efcd`.
Backup: `backup/pre-premium-scorecard-20261030`.
Development: `development/premium-scorecard-20261030`.

The baseline already contained a front/back-nine paper grid. This continuation
finishes the scoped scorecard implementation rather than replacing the app.

## Application changes

* `playtest/solo-scorecard-ui.js`: cream/forest/gold ruled grid, serif numbers,
  square score cells, restrained paper edge, readable mobile navigation, all
  valid scores 1–15, selected-nine rendering and totals. Styles are confined to
  `#dcc-solo-scorecard`. Existing outer seals and navigation are untouched.
* `playtest/solo-scorecard.js`: front/back-nine range tracking, bounded progress,
  correct selected-nine summaries; the original key and 18 stored scores remain.
  Select a hole on the desired nine, then choose 9 holes. Switching to 18 never
  truncates scores. Legacy cards without the new optional field remain readable.
* `playtest/opengolf-holes.js`: accept the live provider's `number` field as well
  as legacy `hole_number`; reject conflicting aliases. No synthesized yardages.
* `playtest/ai-chat.js`: notify the existing scorecard after fresh course facts
  arrive on reload. AI endpoint, personalities, authorization and prompts unchanged.
* `playtest/index.html`, `active-course-context.js`, `round-environment.js`,
  `starters-desk-ui.js`: refresh relevant module URLs for Safari. The index's
  only change is the AI entry-module version; Starter styling is unchanged.

No root application, branding image, shared stylesheet, Firebase configuration,
rules, backend, Money Room, game, wager or settlement source was modified.

## Executed validation

* 51 Node checks PASS: 9 scorecard/provider/archive tests and 42 existing QR,
  room-session/recovery, BBB and Ledger tests restored against current playtest
  modules. See `results-summary/combined-unit-results.txt`.
* 17 Chromium browser checks PASS at 320/375/390/430 × 844, touch/mobile mode.
  See `results-summary/browser-results.json`. These exercise actual UI clicks,
  correction, reload, OUT/IN/TOTAL, front/back nine, nine-hole completion/recap,
  partial archival confirmation, course switching and Starter heading colors.
* Syntax and `git diff --check` PASS. Diff reviewed for scope.
* The real provider's Pines response was retrieved read-only and captured in
  `fixtures/`. Its 18 holes total par 72, White 6,397 yd and Blue 7,049 yd;
  these match the corresponding provider tee totals. Current schema is `number`.
  Provenance is in `fixtures/PROVENANCE.json`.

Browser checks use a clearly named synthetic QA course and intercepted
course/weather responses. Actual unchanged Firebase 11.10 SDK modules load,
but all backend operations are blocked. Expected blocked anonymous-signup
requests are not successful auth tests. No Firebase data is created by this
runner. A cached official SDK download directory can avoid network variability.

These results do not certify physical iPhone/Safari behavior, fresh two-phone
Firebase joining, working hosted AI, or independent survey accuracy of provider
yardage. Missing/unmatched hole facts remain dashes; partial par/yardage sets
never produce complete totals. Yardages are scorecard facts, never live pin GPS.

## Reproduce

Use Node 22+ and Python is not required. From `qa-scorecard/`:

```bash
npm ci
npm test
npx playwright install chromium
npm run browser
```

The runner starts its own local server. It writes evidence to
`/tmp/dagger-scorecard-evidence` by default. Optional variables:
`SCORECARD_EVIDENCE`, `SCORECARD_CHROMIUM`, `SCORECARD_SDK_DIR`,
`CODEX_PRIMARY_RUNTIME_NODE_MODULES`. Set `SCORECARD_BASE` only for an explicitly
authorized playtest URL; course responses still use fixtures and backend calls
remain blocked. Never use this runner to claim real Firebase synchronization.

## Publication and rollback

Only `/playtest/` application files are eligible for this release. Publishing
through the existing main-branch Pages build republishes the repository, so
verify every non-playtest application blob remains identical before advancing
main. No AI deployment workflow is needed or authorized by this mission.

If rollback is necessary, restore only the eight changed `playtest/` files from
the backup commit on a new branch, inspect the diff and publish a normal forward
commit through the same Pages route. Do not force-reset main, clear browser
storage, deploy Firebase, or restore over unrelated newer work. Archive data and
saved scores use their existing keys and do not need migration or deletion.
