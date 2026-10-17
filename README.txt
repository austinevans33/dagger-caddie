DAGGER CADDIE 4.0 — KEITH / PUCKER FACTOR
==========================================

IMPORTANT: The landing-page file MUST be named index.html, not index-FIXED.html or index (1).html.

WHAT IS INCLUDED
- index.html: Full app. Play / My Bag / Clubhouse tabs, Pucker Factor, Keith's personality settings, manual club distances, CSV imports, shot feedback, quick wedges, GPS to manually saved green centers, data backup/restore.
- profile.json: Starter club stats from the original 60-shot range session.
- manifest.json and icon.svg: Home Screen metadata and icon.

PHONE UPDATE — SAFEST METHOD
1. Open Dagger Caddie in Safari. Tap 'MY BAG' and use 'Back up data' before updating if you have entered your own distances.
2. Download this ZIP in Files and tap the ZIP to unzip it.
3. In the extracted folder, find index.html.
4. Open https://github.com/austinevans33/dagger-caddie in Safari.
5. Ensure there is exactly one index.html in the root of the repository. If the current file is named index-FIXED.html, remove/rename the incorrect file first.
6. Upload the new index.html; GitHub's browser UI may not allow direct upload-overwrite. Use the pencil editor to replace contents, or delete the old index.html and commit, then upload the new index.html and commit. Avoid deleting the whole repository.
7. OPTIONAL: Upload manifest.json and icon.svg if you want the updated Home Screen styling. profile.json need not change for existing users.
8. Wait for GitHub Pages to publish. Open https://austinevans33.github.io/dagger-caddie/ in Safari. Refresh. If the old Home Screen app is cached, close and reopen it.
9. Verify the three tabs and the PUCKER FACTOR meter, then test a stock 168-yard fairway shot and a high-risk recovery.

CAVEATS
- Pucker Factor is a heuristic situation severity indicator, NOT a scientific probability of scoring a double bogey.
- Club selection is still a simple, provisional distance and dispersion heuristic, not a comprehensive strokes-gained model.
- GPS works only for saved, verified green-center coordinates on HTTPS with location permission. It doesn't automatically identify the course, hole, lie, or pin and doesn't know front/back distances.
- First-time setup provides a blank bag for new golfers. Starter data is example range data, not universally suitable.
- Uploaded range CSV requires Club Type, Carry Distance, Carry Deviation Distance. Use original launch monitor export format. Imported shot counts are cumulative. A basic duplicate-file check prevents accidental repeat uploads of exactly the same file.
- Shot feedback is stored locally and does NOT automatically update carry distances.
- Data lives in local browser storage; keep backups. Public GitHub Pages hosts only the app files, not a shared player database.
