DAGGER R175 - STAGING-ONLY functional test candidate

DESIGN: index.html, all CSS and image assets exactly unchanged from the approved R163/R172 frozen candidate.
BACKEND: firebase-config.js and .firebaserc taken from the existing R159 staging package; ai-chat.js endpoint changed ONLY to target the staging Cloud Function. Production backend is not targeted by these bundled JavaScript files.

DEPLOYMENT: NOT APPROVED FOR PRODUCTION / GitHub Pages. Do not mix this bundle with your production branch.

LIMITATIONS: The staging Firebase project may have restrictive rules, missing Cloud Functions or other issues; its credentials and deployment have NOT been live tested. Auth, scoring, saved data, wagers, two-phone Money Room and AI are NOT verified. Do not test with real member accounts or wagering data.

SAFE TEST PATH: staging Firebase Hosting project dagger-country-club-staging only, if you elect to deploy this candidate after checking site configuration. Take a staging Hosting backup/release record before deployment. Testing only with disposable staging accounts.

Release checklist: verify loading all five tabs; create disposable test account; persist/reload test score; create/reload test ledger ticket; exercise room join from second device; test AI request and missing-function error handling. Do not promote to production until fully verified.
