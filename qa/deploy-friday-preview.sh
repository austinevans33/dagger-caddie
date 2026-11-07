#!/usr/bin/env bash
# Publish an approved, unzipped Friday candidate to an expiring STAGING channel.
set -euo pipefail
PROJECT="dagger-country-club-staging"
CHANNEL="${DCC_FRIDAY_CHANNEL:-friday-friends-20261106}"
if [[ "$CHANNEL" != "friday-friends-20261106" && ! "$CHANNEL" =~ ^friday-[0-9a-f]{10}$ ]]; then
  echo "STOP: Invalid isolated Friday preview channel." >&2
  exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD="${1:-}"
if [[ -z "$BUILD" || ! -d "$BUILD/playtest" ]]; then
  echo "Usage: bash qa/deploy-friday-preview.sh /absolute/path/to/unzipped/candidate" >&2
  exit 2
fi
BUILD="$(cd "$BUILD" && pwd)"
if [[ ! -f "$BUILD/FRIDAY_BRANCH_SHA.txt" || ! -f "$BUILD/FRIDAY_CHECKED_OUT_SHA.txt" ]]; then
  echo "STOP: Missing release provenance files." >&2
  exit 2
fi
if [[ ! -f "$BUILD/playtest/index.html" || ! -f "$BUILD/round-receipt.js" ]]; then
  echo "STOP: Candidate is incomplete." >&2
  exit 2
fi
# Preflight artifacts have not passed browser tests and must never be deployed.
if [[ ! -f "$BUILD/FRIDAY_BROWSER_VERIFIED_SHA.txt" ]]; then
  echo "STOP: This is not a browser-verified Friday candidate. Download dagger-friday-candidate only after both CI jobs pass." >&2
  exit 2
fi
checked_out_sha="$(tr -d '\r\n' < "$BUILD/FRIDAY_CHECKED_OUT_SHA.txt")"
verified_sha="$(tr -d '\r\n' < "$BUILD/FRIDAY_BROWSER_VERIFIED_SHA.txt")"
if [[ ! "$checked_out_sha" =~ ^[0-9a-f]{40}$ || "$verified_sha" != "$checked_out_sha" ]]; then
  echo "STOP: Browser verification provenance does not match the packaged checkout." >&2
  exit 2
fi
# PR checks run against synthetic merge commits. Only an exact release-branch
# build (push or manual dispatch) may become the friends' staging preview.
if [[ ! -f "$BUILD/FRIDAY_BUILD_EVENT.txt" ]]; then
  echo "STOP: Missing build event provenance." >&2
  exit 2
fi
build_event="$(tr -d '\r\n' < "$BUILD/FRIDAY_BUILD_EVENT.txt")"
branch_sha="$(tr -d '\r\n' < "$BUILD/FRIDAY_BRANCH_SHA.txt")"
if [[ "$build_event" != "push" && "$build_event" != "workflow_dispatch" ]]; then
  echo "STOP: Staging requires a release-branch build, not a pull-request merge artifact." >&2
  exit 2
fi
if [[ ! "$branch_sha" =~ ^[0-9a-f]{40}$ || "$branch_sha" != "$checked_out_sha" ]]; then
  echo "STOP: Packaged branch commit is not the exact tested checkout." >&2
  exit 2
fi
python3 "$ROOT/tests/friday-bundle-integrity.py" "$BUILD"
if ! command -v firebase >/dev/null; then
  echo "STOP: Firebase CLI is not installed." >&2
  exit 2
fi
echo "Branch SHA: $(cat "$BUILD/FRIDAY_BRANCH_SHA.txt")"
echo "Checkout SHA: $(cat "$BUILD/FRIDAY_CHECKED_OUT_SHA.txt")"
echo "Preview project: $PROJECT"
echo "Preview channel: $CHANNEL"
echo "No Firestore rules, functions, data, or production site will be deployed."
printf 'Confirm by typing exactly DEPLOY STAGING: '
read -r confirmation
if [[ "$confirmation" != "DEPLOY STAGING" ]]; then
  echo "Cancelled; no deployment."
  exit 1
fi
# Isolated Hosting-only config beside the extracted candidate; public root is
# the folder containing both playtest/ and shared root modules.
cat > "$BUILD/firebase.friday-preview.json" <<'JSON'
{
  "hosting": {
    "public": ".",
    "ignore": ["firebase.friday-preview.json", "**/.*", "**/node_modules/**"],
    "headers": [
      {"source": "**", "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
      ]}
    ]
  }
}
JSON
(
  cd "$BUILD"
  firebase hosting:channel:deploy "$CHANNEL" \
    --project "$PROJECT" \
    --config "$BUILD/firebase.friday-preview.json" \
    --expires 7d \
    --no-authorized-domains \
    --non-interactive \
    --json
)
echo "Open the returned URL with /playtest/ appended. Verify exact SHA before any two-phone test."
