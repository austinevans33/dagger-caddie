DAGGER CADDIE 4.9 — MONEY ROOM + CLUB RECORDS

Inside this ZIP:
- index.html: builds on 4.8, includes all prior caddies, betting, games, lockers
- money-room.js: live Firebase-backed multi-phone scorecard, one designated scorekeeper
- firebase-config.js: intentionally EMPTY until you configure Firebase
- firestore.rules: scorekeeper-only permissions and invitation access
- SETUP_FIREBASE.md: setup instructions
- Four caddie portraits

NEW:
- Live Money Room (Skins, two-player Match, two-player Nassau, 4-player Vegas), once configured
- Shared scorecard: one scoring entry feeds the selected game
- Rivalry leaderboard, Hall of Shame, shareable text Disciplinary Report from locally archived records
- Longer natural-language Caddie Consultation with one targeted follow-up

IMPORTANT:
Before Firebase is configured, live syncing DOES NOT WORK. Local betting & games do.
The new consultation is rule-based, not a cloud AI model.
Keep your old files in the repository until the new assets work. Back up your bag/data first.
To deploy, upload ALL files except firestore.rules and SETUP_FIREBASE.md if preferred;
those two can stay on your phone. Place index.html, money-room.js, firebase-config.js,
and all portraits at the GitHub repository ROOT.
