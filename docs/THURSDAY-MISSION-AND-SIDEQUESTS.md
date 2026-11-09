# Dagger Country Club — Thursday Mission & Side-Quest Register
Updated 2026-11-09. This document is a planning checkpoint, not proof of readiness or authorization to deploy.

## Immutable release constraints
- Preserve frozen R160 Dagger Country Club name, seal, branding, color system, existing root shortcut and PWA entry point.
- Preserve Firebase separation: production `dagger-caddie-money-room`, staging `dagger-country-club-staging`. Never modify Firestore rules, production data or backend without separate approval.
- Preserve sign-in, saved rounds, score entry, Money Room QR on the host phone, two-phone one-tap join, wagers, Ledger, games, AI Caddy, Ghost, invitations and recovery.
- Production is `main` GitHub Pages root; do not blindly merge staging `/playtest/` to root. Require root-compatible bundle, original icons, storage persistence, iPhone and two-phone acceptance, CI, and rollback.
- Verified staging baseline: PR #59, SHA `61f9e9de0a3a7950ce28f223541cdd12f897b5d8`; do not claim newer release until exact hosted SHA/assets verified.

## P0: Thursday Nov 12 on-course readiness
Three courses: **King's Grant**, **Bayonet at Puppy Creek**, **Hyland**.
- Bayonet: benchmark for B/B+ yardage book, Ghost and scorecard parity; regression-check on exact candidate.
- King's Grant: existing 18-hole playable candidate, but two tee references approximate; obtain and validate source geometry before claiming complete.
- Hyland: previously 17/18 routes (hole 10 missing) and 15 fairways; complete sourced geometry and all official scorecard/tee parity, or clearly degrade to scorecard-only. Never fake map geometry.
- On-device: host iPhone opens root shortcut; guest scans QR displayed on host phone; join, live score/wager sync, saved data persistence, course switching/reset, hole par/tees, Ghost, Yardage Book and Ticket Window. Log failures.
- Review production PR #63 and staging integration PR #71 independently. Require exact integration SHA Course Factory, Caddy/course safety and Friday Ghost QA browser checks before staging merge; verify push-triggered staging-preview, hosted SHA and assets. Production only after physical acceptance and root rollback plan.
- Do not let unfinished course visuals block safe scoring/Money Room availability; explicitly mark incomplete yardage-book coverage.

## P1: Course Factory and connected gameplay
- Complete Founders' 12 with Bayonet-grade official scorecard and source-backed hole geometry; prioritize King's Grant, Quail Ridge, Hyland and NC courses. Native nine-hole routing. Ryder and other QA-only courses never promoted as playable without evidence.
- Real course/tee/hole data and live weather as shared infrastructure for AI Caddy, shot dispersion, shot/bet tracking and shot-by-shot House Ghost.
- Shared Yardage Book pencil aesthetic and cinematic Ghost shots overlaid on the same hole drawing. Useful caddy strategy notes, not filler. Automatic hole par; easy back/reset/change course.
- Four simple Grounds buttons: Yardage Book, Ticket Window, Money Room, Scorecard. Clubhouse as first tab. Compact weather; no unnecessary top clutter.
- Money Room and Games/Ledger: QR on host phone, one-tap join, Bingo Bango Bongo, Nassau, House Ghost, settled/paid state, all-time net, 19th Hole entry, no duplicate score entry.
- Matchbook, Ghost of You, caddy receipts and persistent round memories. Minimize taps; one score input feeds everything.

## P2: Approved side quests (capture, do not prematurely ship)
### All Heart Moments — PR #73 engine prototype
- **The Dare:** contextual Ticket Window proposal on a friendly par 4 with active Money Room. Never automatically create a wager; opt-in only.
- **The Legend:** compare against a professional's **source-verified exact-hole** tournament score (e.g. Pinehurst historical event); do not invent Rory's hole score. Attach official provenance.
- **The Grudge:** challenge prior self/House Ghost or rival from eligible stored round history.
- Cooldowns, dismissal, optional prompts, max three per round, no score-entry interruptions. On acceptance, use existing scoring to resolve and write a memorable Matchbook entry.
- PR #73 is helper/tests only; UI, historical sources and integration remain unverified.

### Golf Trip Mode — Cup De Diesel Nips flagship
- Trip Architect, live tournament, Bounty Board, Club Treasury with pre-trip commitment/collection, championship purse, side-bet net settlement, shared expenses, paid confirmation, audit trail and post-trip legacy recap.
- Fun, lean, one-input/many-uses; not a financial-management maze. Build after Course Factory core is reliable.

### Other personality and personal tools
- Easy Money audio swing-tempo trainer is a separate lightweight project, not a reason to delay golf app release.
- Starter's Desk search/recent/favorites PR #72 is draft helper/tests; needs UI wiring and verification.

## Development rules
- Keep independent, reviewable branches/PRs and reproducible CI. Never assert tests green without checking exact head.
- Verify provenance, hole geometry, tee/scorecard parity, QA-only gates, Ghost browser checks, and Firebase environment on each integration SHA.
- When a side quest appears: add it here with dependency and priority; preserve all previous entries.
- Ship a reliable, enjoyable live app before expanding scope.
