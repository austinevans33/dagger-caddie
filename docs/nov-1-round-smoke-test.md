# Dagger Country Club — November 1, 2026 round preflight

**Target:** Country Club of Whispering Pines — Pines Course. **Playtest only.** Do not confuse a GitHub commit with a published Pages build or a deployed Firebase function.

## Green / ready for field testing
- Premium paper scorecard and Starter's Desk course/tee selection are implemented.
- Previously user-verified: QR Money Room joining and live scoring, with Skins calculations working during a round.
- Caddy frontend course/conditions report, typed course facts, and neutral saved-carry reference are committed.
- Backend Caddy course/weather changes are in source only; staging deployment and end-to-end AI test are not confirmed.

## 10-minute iPhone preflight
1. Open https://austinevans33.github.io/dagger-caddie/playtest/ in Safari and reload once. Check the scorecard and Starter's Desk are visible.
2. Select **Whispering Pines — Pines Course**, then your actual tee. If search or tee facts are missing, do **not** assume Dagger has complete provider coverage; you can still use scoring.
3. Enter a test score on hole 1, switch to hole 2, and check the scorecard persists. Confirm all three shot-specific yardage fields clear on the hole change. Tap **Copy Round Card**, paste into iPhone Notes, and verify the course, tee and score are accurate. **Do not delete a real round to run this test.**
4. Open the Caddy Course Report. It must say how many verified holes it has; wind must be labeled **modeled** and **FROM**, or explicitly unavailable.
5. Enter a real remaining yardage. Confirm club reference comes from saved carries and that tee distance is not treated as pin distance.
6. With both phones present: scan host QR, confirm the guest joins without permission errors, score one hole on host, verify guest sync, then test Undo Last Hole and Finish Match on a **test room**. Check the settlement card and Club Record. Do not mix test-room data with live wagers.
7. Only if the staging `caddieChat` function is confirmed deployed: ask an AI Caddy a question about a selected hole. Confirm response uses the selected tee/par and doesn't invent hazards or a live pin.

## If anything fails
- **Scorecard / provider missing:** Keep a paper backup and use manual scoring. Do not switch courses repeatedly in a live round without confirming archival behavior.
- **Money Room join/sync fails:** Stop entering wagers in the app and use a paper/notes backup; don't repeatedly recreate the room mid-match.
- **AI unavailable:** Use the manual Caddy and scorecard. Don't rely on course/weather AI recommendations until the backend is verified.
- **Wrong course/tee or modeled wind appears:** Refresh the Caddy report; if still wrong, treat the data as unavailable.

## No-go for production release
- GitHub Pages publication and iPhone Safari check not independently verified by this build process.
- Firebase staging function not deployed/tested.
- Finish/Undo/Club Record not yet verified on two real phones.
- Course catalog coverage and accurate tee-specific data not established for every listed course.
- Real GPS dispersion and shot-by-shot House Ghost not implemented.

Keep R160 frozen. Never alter Money Room rules or production Firebase configuration as part of a Caddy deploy.
