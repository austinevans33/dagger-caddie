# Active Money Room recovery candidate

Work is isolated on development/money-room-recovery, based on the verified QR candidate. It deploys to a separate recovery-candidate preview; the owner's sunday-test and qr-candidate links remain unchanged.

An active room bookmark stores only version, Firebase UID, room ID, invitation code and display name. It stores no scores, payouts or host privileges. On reload or reopening app home, the app validates that bookmark against the current Firebase identity and reads the room from the server before reconnecting. The backend document determines the user's role and official scores. A different explicit invitation takes precedence. Manual room setup and newer create/join actions supersede in-flight recovery, preventing late responses from replacing the user's new room.

Sign-out/account changes clear the previous account's bookmark and cached scorekeeper controls. Confirmed archived matches clear their bookmarks and do not automatically reopen. A pending archive does not discard the locator before server acknowledgement. Temporary read failures keep the locator for retry on the online event; a15-second deadline prevents an unbounded server read. Missing/archived rooms, changed invitations and permission-denied reads invalidate the matching saved locator. Malformed or unavailable browser storage cannot throw through room operations. Room lookup revalidation is not a replacement for persistent Firebase identity: clearing browser site data or changing origin will not transfer host ownership.

Verification:28 unit tests and51 Chromium checks passed against the LOCAL FAKE backend, including host reload followed by another shared hole, guest automatic return, no repeated membership registration, transient read failure/retry, a deliberately late lookup/new-room action race, account-change clearing, existing QR PNG decoding/joining and frozen visual region comparisons at320/390/430px. Zero page errors. The real staging/hosted check is pending. The previous two previews remain the owner's stable test builds.

No HTML, CSS, layout, branding, seals, button labels or navigation structure were changed. Existing status fields report recovery progress/errors. This does not certify offline cold-start, physical Safari background suspension or camera/native sharing behavior.

## Hosted recovery verified

Recovery candidate: https://dagger-country-club-staging--recovery-candidate-wgfgk1rl.web.app . Firebase expiration is2026-11-04T21:45:35.627534160Z. Deployment source is6979a5cf4036fb61b72b8e190a53fc26a1fc7715; GitHub Actions run40774394992 passed unit/frozen-source checks,37 Firestore emulator cases and the isolated preview deployment.

All16 actual-app browser checks passed against this hosted origin and real staging Firebase11.10 SDK. Beyond the existing QR/join/live-score checks, they verified host reload with unchanged Firebase UID and room, recording a second official hole after recovery, guest reload and app-home reopening without rejoining, persistent read-only guest role, archive delivery, clearing both recovery bookmarks after acknowledgement and no automatic reopening of an archived match. There were zero uncaught page errors and zero blocked requests. The QA match was archived and both temporary auth accounts deleted. Evidence: recovery-hosted-browser.json.

All63 public application files matched tested source bytes; recovery-hosted-source.json records that comparison. After deployment, sunday-test and qr-candidate still served their prior Money Room source exactly; recovery-preview-isolation.json records both checks. No app bytes were promoted to those existing channels or production.

This verifies browser reload/reopening against a live server, not physical Safari suspension, offline cold-start or cross-browser identity transfer. Regular persistent browser storage and the same Firebase identity are required. Use a fresh test room on this new origin. The approved HTML/CSS/layout/branding/seals/buttons/navigation remain unchanged. A QA-only evidence commit uses [skip preview] to avoid redeploying unchanged assets.
