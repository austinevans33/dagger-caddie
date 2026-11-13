# Tournament HQ production release gate

STATUS: NOT LIVE. A GitHub Pages merge does not deploy the Firebase tournamentHQ callable or its Firestore rules.

1. Firebase project ownership: production is dagger-caddie-money-room and staging is dagger-country-club-staging. .firebaserc defaults to production. Never run an unqualified Firebase deployment.
2. Explicitly deploy ONLY the tournamentHQ Cloud Function and separately reviewed Firestore rules to a controlled staging Firebase project. Check Functions region us-central1, IAM permissions, authentication, App Check stance, and API availability.
3. Staging client MUST use the staging Firebase project for Auth, Firestore and Functions. The current playtest/tournament-hq-live.html reuses production Firebase config and must NOT be treated as a safe staging deployment without config isolation.
4. Test unauthorized captain writes, guessed IDs, cross-team edits, invitation replay, duplicate and concurrent score submissions, locked finals, signed-out sessions, connectivity loss, and transaction retries.
5. Two-device acceptance: director and two captains use distinct signed-in accounts; a spectator sees live updates, correct scores and hole-order wrap for shotgun Hole 4. Verify A/B groups sharing a hole and realistic 36-team load.
6. Course par MUST be source-backed. For now a development device with a matching verified complete local scorecard can display relative scores. A public shared tournament needs event-wide authoritative hole pars; never fabricate scores or declare rankings when missing.
7. Confirm existing Money Room, House Ghost, scorecard, saved data and Golfer Memory regression checks.
8. Do not bypass the pinned production index.html gate to release shotgun Ghost PR #86. Review a versioned, regression-tested promotion separately.
9. Do not expose Tournament HQ through the public Games navigation until both frontend AND Firebase backend are deployed and independently verified.
10. After rollout, separately confirm actual GitHub Pages publication, Cloud Function availability, and live cross-device scoring. Only then announce LIVE.

Known blockers: no verified staging or production Firebase deploy, no true two-phone acceptance evidence, production UI still excluded, Ghost shotgun PR #86 blocked by release invariant, event-wide verified pars / captain QR / director corrections still pending.

Fail closed: retain existing production DCC site and data whenever a gate cannot be proven.
