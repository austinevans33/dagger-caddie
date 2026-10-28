# Ledger Nassau settlement

Isolated branch: development/ledger-nassau-settlement, based on recovery candidate f8e1e55.

The original Ledger wagerMath awarded front-nine and overall stakes after one completed hole. A JavaScript adapter now settles each of front nine, back nine, and overall only when every score in that segment is valid and recorded. Tied segments do not pay. Skins and head-to-head delegate to the original function unchanged.

No HTML, CSS, controls, layout or static assets changed. Existing previews and production remain unchanged. This branch is not configured for preview deployment.

Validation: 36 unit tests pass, including eight settlement cases, plus frozen source hash checks. Browser verification is recorded separately in qa/evidence/ledger-local-browser.json.

Rollback: return to parent f8e1e55; the recovery preview remains available unchanged. This milestone does not certify Games-to-Ledger integration or permanent account sign-in.
