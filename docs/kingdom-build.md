# Operation Kingdom Build

## Mission 1 — Release qualification

- Baseline production is `8a07777e19c26529d1adccbc0296961977e7b3a4`.
- PR #108 at `2ef99740821112a33187c419e859e3d4b435ed8c` failed the immutable checkout comparison in Actions run 45732898854 on the founders catalog. Its rehearsal passed.
- PR #109 at `3264fd143bfcd83b75a18d1631c4254a52d5f231` failed the immutable checkout comparison in run 45733214472 on Ghost playback. Run 45733214322 also rejected Ghost changes that fell outside the old narrow HTML/script guard. A follow-on staging test attempted to load Playwright before setup had run.
- The integration branch starts at #109 and applies only the reviewed #108 diff against the common production base. It pins the exact runtime from `227f400e0c358c6abda06f70fa5efa17b6e712dd` using an explicit file list. Both workflows compare complete bytes and continue to protect the existing Firebase project and public bundle. The rehearsal permits the exact starting-hole picker and the original Ghost section while comparing other root HTML against the baseline.
- Before production, confirm green checks on the exact head and tree, verify the on-device rehearsal including saved-round recovery, and obtain explicit owner approval. Production publication remains outside this branch.

## Continuation

| Mission | Branch evidence | Next acceptance task |
| --- | --- | --- |
| 1. Release candidate | Integration branch and immutable pin | Collect Chromium, WebKit, baseline and two-session staging room evidence for this exact head. |
| 2. Any-hole gameplay | Original Ghost picker and playback, rotated Ghost/solo/Nassau library contracts | Wire the contracts into live solo and wager entry, pass a pinned starting order to shared rooms, verify partial archives, reconnect and no settlement for unplayed holes. |
| 2B. All Heart | Preserve #73, #81 and #102 | Port the approved adapter and receipt logic with room/round-scoped state. Verify natural frequency and forced cases before release. |
| 3. Course Factory | #108 acquisition and inventory helpers | Run previously researched NC candidates through real source and geometry audits. Count each readiness stage separately. |
| 4. Course intelligence | Existing shared course/conditions modules | Continue after the acquisition pipeline passes a real batch. |
| 5. Golf Trip Mode | Existing Cup De Diesel Nips design and history | Resume after shared round and course contracts are stable. |

### Mission 2 gameplay stack

- This stack adds the actual Starter’s Desk starting-hole picker. Solo page navigation and score advancement follow the same play order, including native nine-hole courses.
- An unlocked Ghost starts at the active paper hole by default. It can still be set explicitly. A running match retains its original start and partial history stores it.
- Local wagers retain packed, ordered score rows for backward compatibility. The physical hole is derived from the saved start, including when copying a verified round score. Nassau archives reject unresolved segments.
- Remote shared rooms still use the legacy ordering. An older reachable web client can join a new room and recalculate Skins or Nassau with the old order. Before opting rooms into rotated financial settlement, prove version compatibility and old-client fail-closed behavior in staging. The Firebase rules and projects are untouched by this stack.

### Shared Money Room stack

The scorekeeper picks any physical starting hole. Hole scores retain physical keys, while the server-confirmed immutable order determines traversal, Skins carryovers, Nassau legs, undo and history. New rotated rooms use versioned `r2-` document IDs with the same random token lengths. Old clients reject the ID before joining or recovering. Original rooms remain readable and retain their order and payouts. The Firestore rules already protect immutable room metadata on updates. Rules, authentication, membership, writes, QR generation and both projects remain on their existing paths.

The staging acceptance creates a legacy room and a versioned Hole 18 room, with two sessions each. It checks wraparound, host-only controls, undo, corrections, reconnect, final balances and exactly one archive per device. Record remote results once these gates complete.

### Shared-room external gate

The real staging workflow 46103515559, job 140851045400, passed the legacy Hole 1 match. Staging rejected the Hole 18 room create with PERMISSION_DENIED. The same create, join, two physical score writes, immutable order check and archive lock all passed in a loopback Firestore emulator using the repository rules and demo project `demo-dcc-kingdom`. The emulator also rejected guest writes, access without membership, wrong invite codes and writes after archive. This establishes a difference between the repository rules and the live staging behavior without identifying the exact deployed rule.

Reproduction uses `tests/kingdom-shared-order.rules.mjs`, Firebase CLI 14.26.0, Firebase SDK 11.10.0, and @firebase/rules-unit-testing 4. Run under `firebase emulators:exec --only firestore --project demo-dcc-kingdom` with the test SDK dependencies available. The script deliberately requires a loopback emulator. Obtain the current staging rules and reconcile the versioned contract while preserving existing membership and update protection before running another remote attempt. No live rules changed.
