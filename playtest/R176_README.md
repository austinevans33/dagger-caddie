# R176 — Staging-only unwanted banner correction (HOLD)

- Removed the runtime insertion of the legacy `dccMemberIndicator` immediately below the masthead in `golfer-account.js`. All existing Firebase auth/account flow and account drawer logic remain unchanged.
- Exact approved R163/R175 `index.html` preserved byte-for-byte. Every other R175 file preserved byte-for-byte; no visual changes to The Grounds or seals.
- `node --check golfer-account.js` passes. This is a static check, not an interactive test.
- Ledger record elements `clubRecordsSection`, `hallStats`, and `actionRecords` exist in approved HTML, but the reports of their disappearance are not yet explained or fixed. No Ledger markup was modified.
- Firebase staging auth/admin-restricted-operation is NOT repaired.
- NOT CLEARED FOR PRODUCTION. The app must be viewed and functionally tested before release.
