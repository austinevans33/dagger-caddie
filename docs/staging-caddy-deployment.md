# Staging AI Caddy deployment — controlled handoff

**Status:** source and automated checks are committed. **The Firebase function has not been deployed or phone-tested.**

Target project: `dagger-country-club-staging`. Historical `.firebaserc` default is **not** staging. Do not run a bare `firebase deploy`.

## Before any deploy (Cloud Shell)

1. Verify the target project's enabled APIs and billing prerequisites for Functions v2:
   `gcloud services list --enabled --project=dagger-country-club-staging`.
   Verify Cloud Functions, Cloud Run, Cloud Build, Artifact Registry, Secret Manager, Firestore, Identity Toolkit. Do not enable services or upgrade billing without owner approval.
2. List actual service accounts:
   `gcloud iam service-accounts list --project=dagger-country-club-staging`.
   Choose an **existing, least-privileged, staging-owned** runtime account. Never reuse the production service account or invent an account name.
3. Verify the secret **exists in staging** (never print its value):
   `gcloud secrets describe OPENAI_API_KEY --project=dagger-country-club-staging`.
   Verify the chosen runtime identity has appropriate secret access and Firestore access; never copy production secrets by assumption.
4. Verify staging Firebase Authentication, its allowed domains, Firestore security rules, quotas, and the intended browser URL. Test with a staging user.

## Prepare the target configuration

After verifying the actual service account, create a local file `functions/.env.dagger-country-club-staging` containing:

```dotenv
DAGGER_CADDY_PROJECT=dagger-country-club-staging
DAGGER_CADDY_SERVICE_ACCOUNT=<VERIFIED_EXISTING_STAGING_SERVICE_ACCOUNT_EMAIL>
```

The account email is an operator-supplied IAM identifier, **not** an API key. Do not commit the local environment file. The deployment target resolver rejects staging without a matching staging-project account.

## Deploy only when ready

From the repository root, with the Firebase CLI authenticated to the staging project:

```bash
firebase deploy --only functions:caddieChat --project dagger-country-club-staging
```

Never deploy without the explicit `--project`. If the CLI reports a project/account mismatch, stop. Do not alter production configuration to bypass a staging failure.

## Verify after deployment

- Confirm the deployed function is under `dagger-country-club-staging` and uses the intended runtime service account.
- Test valid staging login, unauthorized requests, allowed origin, rate limiting, and that no API key appears in browser traffic.
- With a real selected course and tee, ask Keith about a known hole; confirm the request carries `courseFacts` with par, tee yardage, and modeled wind (when available). Do not claim real pin GPS.
- Test missing course data, expired weather, changing holes, and an explicit golfer-reported target distance.
- Verify Money Room, scorecard and Club Record regression flows separately.

Only mark GitHub issue #23 verified after an end-to-end staging function test. The source code alone does not establish successful cloud deployment.
