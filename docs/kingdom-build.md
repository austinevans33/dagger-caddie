# Operation Kingdom Build

## Mission 1 — Release qualification

- Baseline production is `8a07777e19c26529d1adccbc0296961977e7b3a4`.
- PR #108 at `2ef99740821112a33187c419e859e3d4b435ed8c` failed the immutable checkout comparison in Actions run 45732898854 on the founders catalog. Its rehearsal passed.
- PR #109 at `3264fd143bfcd83b75a18d1631c4254a52d5f231` failed the immutable checkout comparison in run 45733214472 on Ghost playback. Run 45733214322 also rejected Ghost changes that fell outside the old narrow HTML/script guard. A follow-on staging test attempted to load Playwright before setup had run.
- The integration branch starts at #109 and applies only the reviewed #108 diff against the common production base. It pins the exact runtime from `227f400e0c358c6abda06f70fa5efa17b6e712dd` using an explicit file list. Both workflows compare complete bytes and continue to protect the existing Firebase project and public bundle. The rehearsal permits the exact starting-hole picker and the original Ghost section while comparing other root HTML against the baseline.
- Before production, confirm green checks on the exact head and tree, verify the on-device rehearsal including saved-round recovery, and obtain explicit owner approval. Production publication remains outside this branch.

## Continuation

| Mission | Candidate and evidence | Remaining acceptance |
| --- | --- | --- |
| 1. Release candidate | [#110](https://github.com/austinevans33/dagger-caddie/pull/110) at `a2a99315f4356d1ef7e137adb18574617bb40a02`. Gate 46102024402 and rehearsal 46102024458 passed. | Qualify the proposed exact final artifact on the installed shortcut using the approved origin-preserving setup, complete the applicable staging and signed-in release checks, and obtain explicit production authorization. |
| 2. Any hole, solo and local wagers | [#111](https://github.com/austinevans33/dagger-caddie/pull/111) at `1212a65904a511b62ad69302106916684f258410`. Gate 46103880671 passed 110 Node, 18 Chromium, 18 WebKit and one legacy staging room test. | [#114](https://github.com/austinevans33/dagger-caddie/pull/114) at `841e98088b418ed969c21cb84ca9e8d7ecf01f48` contains rotated shared order. Live staging rehearsal 46103515559 rejected versioned room creation. Obtain the deployed staging rules through an authorized read, compare with the rules proven in the emulator, and verify host/guest/recovery/settlement on staging. |
| 2B. All Heart | [#112](https://github.com/austinevans33/dagger-caddie/pull/112) at `f2e6f9d9511288c8dd88a97a5affab3c591ab244`. Gate 46104042977 passed 118 Node, 19 Chromium, 19 WebKit and the legacy staging room check. Rehearsal 46104043045 passed. | For shared Dare settlement, bind the existing wager flow to the verified room context. Add exact-hole professional moments only when identity and documented claims can be verified. |
| 3. Course Factory | [#113](https://github.com/austinevans33/dagger-caddie/pull/113) at `39c75f9232df676f875b7d98358a43eeb6826dd3` passed gate 46103164942 and rehearsal 46103164980. [#116](https://github.com/austinevans33/dagger-caddie/pull/116) at `a1d87e8e9a3d6526dabf30e5db3867f42467825c` has 113 local Node passes. | Complete the exact batch-02 and combination CI. Reopen the prior Seven Lakes and Pine Island geometry exceptions separately. |
| 4. Course intelligence | [#115](https://github.com/austinevans33/dagger-caddie/pull/115) at `0efc55a7dad99b8dfe6971dfdadaa8d9b205ad48` tests weather scoping and launch-monitor dispersion. The first full gate attempt passed the Caddy case in both engines and had one WebKit Shining Rock route-load failure. | Confirm whether that failure reproduces, then qualify the exact Caddy change alongside the gameplay stack. Continue the shared shot/wager and weather/Ghost work after the room rehearsal succeeds. |
| 5. Golf Trip Mode | Existing Cup De Diesel Nips design and history. | Resume after shared round and course contracts are stable. |

### Mission 2 gameplay stack

- This stack adds the actual Starter’s Desk starting-hole picker. Solo page navigation and score advancement follow the same play order, including native nine-hole courses.
- An unlocked Ghost starts at the active paper hole by default. It can still be set explicitly. A running match retains its original start and partial history stores it.
- Local wagers retain packed, ordered score rows for backward compatibility. The physical hole is derived from the saved start, including when copying a verified round score. Nassau archives reject unresolved segments.
- Remote shared rooms still use the legacy ordering. An older reachable web client can join a new room and recalculate Skins or Nassau with the old order. Before opting rooms into rotated financial settlement, prove version compatibility and old-client fail-closed behavior in staging. The Firebase rules and projects are untouched by this stack.

### All Heart scorecard stack

- The approved selector, scorecard card styling, receipt builder, Matchbook targets, and Royal Birkdale adaptations come from #73, #81 and #102.
- The original pilot was only on a staging branch, mounted under Games, and restricted to a narrow tee list. This stack hosts the same challenge presentation next to the official scoring controls, using local official scorecards independently of artwork.
- Offers and acceptance persist by round and physical hole. The production draw is fixed per round and hole. Unit tests force eligible types through an injected draw, and the isolated browser case uses a qualifying Verdae round fixture. There is no production force switch.
- The natural test observed 248 offers in 196 of 240 complete Shining Rock rounds. The cap is two offers and four intervening holes, in played order. No synthetic wager or payout is created.
- Exact-hole Legend rendering requires a verified fact at a published course; the delivered natural Legend source is the Birkdale adaptation. The shared-room Dare-to-Ticket Window still needs authenticated, synchronized room context before it can be enabled.

### North Carolina batch 01

Run `node scripts/kingdom-course-preflight.mjs the-woods-whispering-pines-nc mill-creek-mebane-nc hillandale-durham-nc neuse-clayton-nc`. The command runs the current production course catalog, pinned-art loader and Ghost simulator. An unavailable or incomplete drawing stays visible in the result without stopping other courses.

| Course | Club card checked | Full drawings | Partial drawings | Scorecard Ghost |
| --- | --- | ---: | ---: | --- |
| The Woods, Whispering Pines | Club PDF byte-identical to the prior pin, official HTML re-fetched | 18 | 0 | Yes |
| Mill Creek, Mebane | Both club card images byte-identical to the prior pins | 17 | 1 (Hole 17) | Yes |
| Hillandale, Durham | Club image byte-identical to the prior pin | 18 | 0 | Yes |
| Neuse, Clayton | Club image byte-identical to the prior pin | 0 | 0 | Yes |

The first three maps are exact original Course Factory review blobs from `5b98d3a`. Their SHA-256 digests are checked again by the batch regression. The Woods catalog pins the unaffected club PDF while retaining the refreshed HTML location. Neuse carries the clean scorecard-only record from `81f76d4`. Its lack of verified geometry does not block scoring or Ghost.

Full candidate preflight across the curated catalog found 38 courses and 38 scorecard/Ghost-ready courses, 23 with at least one full drawing, and 15 with all holes fully drawn. These are runtime preflight counts. End-to-end and release qualification are tracked separately in CI. OpenGolfAPI listings are outside these counts.

The next acquisition pass should reopen the prior Seven Lakes review and Pine Island proof before requesting new geometry. Mill Creek No. 17 can keep verified tee, green and routing while its fairway remains omitted.

### North Carolina batch 02

Recovered previously researched course files from `c32c77e` after re-fetching and matching the original club scorecard bytes. Greensboro National, 12 Oaks, Hope Valley and Country Hills join the scorecard and House Ghost catalogs. The original OSM drawings are retained byte-for-byte. Greensboro National 16, 12 Oaks 11 and Hope Valley 14 remain partial. Country Hills has all 18 complete drawing records.

With this batch the runtime preflight reports 42 discovered, 42 scorecard-ready, 27 with drawings, 42 Ghost-ready and 16 with complete drawing preflight. Full course-by-course gameplay verification and geometries for the other 26 are distinct from those counts.
