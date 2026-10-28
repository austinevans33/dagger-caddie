# Bingo Bango Bongo money

User explicitly approved stake per point field, dollar balances alongside points, and archived results in the Ledger. Each awarded point transfers the selected stake from every other player to its winner; unawarded ties transfer nothing.

Implemented as a separate module loaded by the existing staging money-room module. Original HTML, styles, navigation, seals and assets remain byte-identical. Only the specifically approved BBB setup field and balance text are injected. New rounds default to $0. Existing rounds without a stake remain points-only and are not retroactively converted.

Stake is snapshotted at game start, persists with the round, and uses whole-cent arithmetic. Archive entries preserve the original three awards and derived per-player point counts. Unique IDs prevent duplicate Ledger entries; startup retries unfinished archive synchronization. Existing Ledger totals, search, CSV and details consume these entries. Backup validation checks awards against derived points. BBB remains local-device play; this does not add shared-phone BBB to Firebase Money Room.

Validation: 42 unit tests; actual local Chromium checks and approved reference-region comparisons recorded in qa/evidence/bbb-money-local-browser.json. Hosted/physical-phone testing has not yet been performed for this branch.

Branch development/bbb-money, based on saved-games milestone 74f25e0. No preview mapping, live deployment or Firebase data changes. Existing preview URLs unchanged. Rollback to parent; preserve backups before reverting because earlier builds do not understand the new bingo wager format.
