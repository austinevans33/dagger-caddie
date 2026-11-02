# Friday November 6, 2026 — Release Gate (staging only)

## Evidence verified on November 2
- Friday Ghost QA workflow run 41461771867: successful; 17/17 Node tests passed.
- Caddy and course safety workflow run 41461772091: successful.
- House Ghost trail/round/ledger/playback are deterministic simulated schematics, not course GPS, recorded strokes or proof of a live game integration.
- Isolated preview: `playtest/ghost-preview.html`; optional Caddy entry is collapsed and does not write game data.
- Money Room QR and recovery are **separate development candidates**, not merged into this branch. See `development/money-room-recovery` QA evidence. Previous hosted real-staging browser checks passed, but do not prove the current Friday app is joined successfully.

## Mandatory blockers before calling Friday playable
1. Verify selected real course, tees, per-hole par and yardage against source; prevent fallback course estimates from appearing verified.
2. Start room on host phone, expose QR **on host screen** (not only a shared invite). Scan with second physical phone; join with one name/tap and no account setup; reject wrong invite.
3. Enter, correct and sync scores on two physical phones; confirm guest cannot edit host scores or access someone else's room.
4. Verify complete 18-hole round, skins carryovers, Nassau, BBB and Ledger calculations including ties and corrections.
5. Reload each phone; ensure host/guest room roles and data survive. Archive a throwaway room, confirm read-only behavior.
6. Confirm AI Caddy gives grounded answers and that weather/course fallback is disclosed; do not assert live GPS/map detail without data.
7. Verify separate Yardage Book opens, goes back to previous screen, changes holes, and safely resets/changes courses without losing a saved game.
8. Check narrow iPhone layout, approved original R160 branding and circular seal; no redesign.
9. Re-run GitHub CI against exact candidate commit and hosted release origin. Confirm proper deployment project and source bytes.
10. Backup and rollback plan; obtain explicit owner approval before any production promotion.

## Release decision
**HOLD** until required end-to-end checks pass. Green module tests do not imply production readiness.
Production, Firebase rules and existing round data must remain unchanged without explicit approval.
