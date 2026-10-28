# Saved games and Ledger startup

Branch: development/saved-games-verification, parent remote ec8ce2f.

A populated actual-browser test reproduced stale Nassau payouts after page reload: inline startup rendered saved rows before the deferred calculation adapter installed. Installation now invokes the existing renderFoursome function after replacing the calculation. No new UI elements, HTML changes, styling or storage migration.

The browser suite also exercises existing BBB controls: split awards, no point for a tie, active-score reload, undo, and archive reload. These are local-device persistence checks with a fake backend, not certification of cloud game sync or a new cross-game Ledger integration.

Unit suite: 37 tests passed. Frozen source hash checks passed. Browser evidence is saved separately. Existing staging previews and production are unchanged; this branch has no preview deployment mapping.

Rollback: return to parent ec8ce2f; no data is rewritten by this change.
