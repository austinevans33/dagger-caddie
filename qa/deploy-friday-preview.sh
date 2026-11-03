#!/usr/bin/env bash
# Publish an approved, unzipped Friday candidate to an expiring STAGING channel.
set -euo pipefail
PROJECT="dagger-country-club-staging"
CHANNEL="friday-friends-20261106"
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
    --expires 7d
)
echo "Open the returned URL with /playtest/ appended. Verify exact SHA before any two-phone test."
