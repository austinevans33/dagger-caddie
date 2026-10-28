# Sunday release target: November 1, 2026

Scope: approved frozen visual design and easy invitation-based Money Room joining for two golfers. Additional features are subordinate to these gates.

Production baseline: 64c0f2ede5b8dece8614b502c40a06fea2f732f2. Production-root files remain untouched. staging-app is an isolated copy of supplied R177, not the missing later development checkpoint. Earlier reported QR/Nassau/Ghost/AI/backup changes are not claimed recovered.

Immutable references: qa/references contains original supplied R163, supplied R177, and recovered five-tab capture ZIP. SHA-256 for the untouched R177 files is qa/baseline-sha256.json. Never regenerate references to make a candidate pass.

Rollback: restore staging-app from preserved baseline commit. Production is unchanged, so no production rollback is currently required. Any later release needs an exact production tag/bundle and independently approved deployment plan before promotion.

Acceptance: all five mobile tabs preserve approved regions and injected account controls; global membership banner absent; host creates a two-player room; buddy opens invitation, enters a name, joins without profile setup; host-only score editing; live sync, reload/rejoin, account change revocation, invalid invitation denial; real staging auth and deployed rules verified; physical two-phone trial; explicit final production approval.

Access blockers observed: GitHub integration branch creation returns403; Firebase plugin is not connected. No hosted authentication/rules/deployment verification is claimed.

## Rebuilt milestone (October 28)

New checkpoint, not a recovery of missing commits. Money Room now refreshes current authentication per operation, coalesces guest signup/join/create attempts, registers invitation membership without a pre-read, verifies identity after awaited operations, and clears cached host controls on identity change. Invitation routing waits for the existing profile initialization using its club-selector mutation; no HTML changes.

Verified: 5 unit tests and 39 actual Chromium checks against a LOCAL FAKE backend, including two independent browser profiles and frozen-region comparisons at320/390/430px. No page errors. Original R177 HTML/CSS/images/configuration remain byte-identical. These comparisons verify no new visual differences in checked regions; they do not certify every populated/authenticated state or replace approved screenshots.

Direct real staging authentication probe: anonymous signup returned HTTP400 ADMIN_ONLY_OPERATION; no test account was created. This confirms the staging guest-signup release blocker, not a Firestore rules result. Firebase connection/configuration access is needed to resolve it. GitHub branch creation still returns403 and shell push dry-run cannot authenticate. No production deployment, production data access, or hosted functional certification.

Sunday readiness remains CONDITIONAL on guest signup configuration, deployed staging rules tests, a real two-phone trial, final visual review, and explicit production promotion approval.

## Real staging authentication retest

After the owner enabled Anonymous sign-in, three fresh staging identities signed up successfully (HTTP200). This supersedes the earlier ADMIN_ONLY_OPERATION blocker for anonymous signup.

The first authenticated room-create request was denied HTTP403: Missing or insufficient permissions. No Firestore QA room was created. All three disposable authentication identities were deleted successfully (HTTP200). The deployed rules must be inspected before making a compatible change. Joining, score updates and archive checks did not execute and remain unverified on real staging.

Exact sanitized evidence is qa/evidence/staging-money-room-real.json. Probe source is qa/probe-staging-money-room.py; no credentials or tokens are retained. No application or visual changes were made for this retest.

## Tested staging rules replacement

The owner supplied deny-all staging rules; preserved in qa/prior-staging-deny-all.rules for rollback. Proposed replacement is qa/staging-money-room.rules. It enables authenticated room creation, invite-bearing own-UID membership, host/member document reads, host-only scoring and archive locking. Room enumeration, guest edits, immutable identity/stake changes, document deletion and unrelated collections remain blocked. It has not been published.

All37 Firestore emulator checks passed using firebase-tools14.22.0, Firestore emulator1.19.8, Firebase SDK13.1.0 and rules-unit-testing6.0.0. These test the actual rules engine locally with simulated identities, not deployed staging or physical phones. Exact evidence is qa/evidence/staging-rules-emulator.json. Production code, configuration and frozen visual files are unchanged.

Reproduce with npm ci --prefix qa, then npm --prefix qa run test:rules. Node22 and Java21 are suitable for the CI environment. In the current workspace Java17 runs this pinned emulator. The tests use demo-dagger-qa, which has no live cloud resources.

Next action: owner replaces the existing rules in dagger-country-club-staging with the tested file and clicks Publish. Then run qa/probe-staging-money-room.py against real staging before declaring the permission blocker resolved. Rollback uses the preserved deny-all rules; this closes all Firestore client access again.

## Published staging rules: real verification passed

After the owner published the tested rules, all15 real staging REST checks passed: three distinct guest identities, room creation, nonmember and invalid-invite denial, invitation membership registration, member reads, guest edit denial, host scoring, score retrieval by another identity, returning membership update, archive, post-archive edit denial and unauthenticated read denial. All three test auth accounts were deleted. The QA room was successfully archived in the verified test; a redundant cleanup archive returned403 because archived matches are correctly immutable. Raw evidence preserves that response. The probe now skips redundant cleanup writes on already-archived test rooms.

All10 actual-app browser checks then passed against the real deployed staging backend, with the unmodified Firebase11.10 SDK and two independent Chromium profiles: anonymous auth, room creation through existing controls, invitation routing without bag setup, name-and-tap joining, read-only guest controls, distinct identities, real listener score delivery, reload/rejoin persistence, archive listener delivery and zero uncaught application errors. Cleanup confirmed archived QA room and successful deletion of both test accounts. No network requests were blocked. This used local app origins and a controlled runner proxy with the sandbox-provided proxy CA public keys pinned for this test process. No application transport/security settings were changed.

These are real backend and browser milestones, not a physical two-phone or hosted-origin certification. Next gates: hosted staging preview, authorized-domain/caching checks on that origin, and Safari/Chrome phone trial. GitHub write access remains unavailable; no production deployment or production data change occurred. Frozen source verification still passes.

## Remote preservation and CI

GitHub installation176307948 on austinevans33 now grants repository write access. Remote reference branch baseline/recovered-r177-2026-10-28 is at d6d6f5582fdf4eb4761a2519efa5797f415b2ccf; development/sunday-money-room-2026-11-01 first verified snapshot is f9ba9e904e931eb553711efc3da44f2548e56b3e. Their complete Git trees exactly match local baseline d678ae3 and local functional checkpoint7e5986f. Original local history remains on development/local-verified-before-remote-sync and in the saved bundle. Draft PR2 targets the baseline branch. Main remains64c0f2e. No server-side branch protection is claimed.

GitHub Actions run40758952821 passed both source-checks and firestore-rules. A staging-only preview job now attempts to reuse the repository's existing Google Cloud OIDC variables after both checks pass. It runs only on the named development branch, pins the project to dagger-country-club-staging, serves only staging-app, uses an expiring sunday-test preview channel, and disables automatic authorized-domain changes. It does not deploy live Hosting, Firestore rules or functions. No new credentials or secret values were added. Actual preview success is not claimed until the job returns its URL.

## Hosted staging preview verified

The owner granted the existing deployment identity staging-project access. GitHub Actions run40760173428 attempt2 then passed the token and staging-project access checks, deployed only the sunday-test Firebase Hosting preview, and recorded its URL. The deployment source commit is10989031b9d91845a880f7d0db11622b5fe357b6. Preview URL: https://dagger-country-club-staging--sunday-test-95n00msn.web.app . Firebase returned expiration2026-11-04T20:15:53.450755004Z (November4 at3:15pm America/New_York), which covers the SundayNovember1 deadline.

The actual hosted URL passed all10 real-SDK two-profile browser checks, with zero uncaught errors and zero blocked requests: anonymous identities, room creation, invitation routing without bag setup, name-and-tap joining, guest edit restrictions, distinct accounts, live score delivery, reload/rejoin persistence and archive locking. Test cleanup archived the QA room and deleted both temporary auth accounts. Evidence: qa/evidence/staging-hosted-browser.json. All59 public application files (HTML/CSS/JS/config/assets/profile/manifest) match the tested local staging source byte for byte; evidence: qa/evidence/hosted-source.json. The hosted checker accepts only the staging sunday-test hostname pattern.

No production website, main commit, production Firebase data or approved visual source changed. The preview command deploys Hosting only and disables automatic authorized-domain changes. Physical Safari/Chrome two-phone behavior and user review of previously unverified states remain to be confirmed. A QA-only verification commit uses [skip preview] so the unchanged app does not need another deployment; unit and rules CI still run. Do not promote production without explicit approval.
