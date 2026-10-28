# Sunday release target: November 1, 2026

Scope: approved frozen visual design and easy invitation-based Money Room joining for two golfers. Additional features are subordinate to these gates.

Production baseline: 64c0f2ede5b8dece8614b502c40a06fea2f732f2. Production-root files remain untouched. staging-app is an isolated copy of supplied R177, not the missing later development checkpoint. Earlier reported QR/Nassau/Ghost/AI/backup changes are not claimed recovered.

Immutable references: qa/references contains original supplied R163, supplied R177, and recovered five-tab capture ZIP. SHA-256 for the untouched R177 files is qa/baseline-sha256.json. Never regenerate references to make a candidate pass.

Rollback: restore staging-app from preserved baseline commit. Production is unchanged, so no production rollback is currently required. Any later release needs an exact production tag/bundle and independently approved deployment plan before promotion.

Acceptance: all five mobile tabs preserve approved regions and injected account controls; global membership banner absent; host creates a two-player room; buddy opens invitation, enters a name, joins without profile setup; host-only score editing; live sync, reload/rejoin, account change revocation, invalid invitation denial; real staging auth and deployed rules verified; physical two-phone trial; explicit final production approval.

Access blockers observed: GitHub integration branch creation returns403; Firebase plugin is not connected. No hosted authentication/rules/deployment verification is claimed.
