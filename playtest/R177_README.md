# R177 — Ledger record visibility repair (STAGING QA HOLD)

## Root cause found
The approved `index.html` has a `clubRecordsSection` and four financial summary cells (`Wins`, `Losses`, `Archived`, `Member Net`). The R77 hierarchy initializer moves the original records section into `dccR77RecordsDrawer` and removes its `data-tab` attribute. Earlier tab selection can leave `hidden-panel`, `inert`, and `aria-hidden` on that moved section. The new wrapper owns Ledger tab state, so those stale flags can make the records invisible even on The Ledger tab.

## Targeted change
After relocation, clear only those three stale visibility/accessibility flags on the existing `clubRecordsSection`. **No new UI elements, no CSS edits, no changes to cards, buttons, brands, or seal layout.** The archived statistics and their original calculation logic are untouched. R176's unwanted membership banner removal is retained.

## Test status
* Inline JavaScript parsed via Node syntax checks; `golfer-account.js` syntax passed.
* All other files except `index.html` and this README are bit-identical to R176.
* No authenticated browser test or Ledger screenshot comparison has occurred. Visibility is a source-level repair hypothesis until verified on staging.
* Staging Firebase `auth/admin-restricted-operation` remains unresolved and requires independent Firebase Authentication configuration diagnosis.

**DO NOT DEPLOY TO PRODUCTION.** Staging test only after a fresh isolated preview deployment. Do not assume missing member data exists on staging.
