# QR invitation candidate

The original sunday-test preview remains unchanged while the owner tests it. New work is isolated on development/money-room-qr and deploys only to the separate qr-candidate channel.

The existing Share Match Invitation control can share a locally generated PNG QR plus the invitation URL through native file sharing. Where native file sharing is unavailable, it saves the PNG and attempts to copy the link. Copy invite link retains link-only behavior. No HTML, CSS, labels, layouts, branding, seals or navigation were edited. No in-page QR panel or new button was added. Invitation codes are encoded on-device with vendored qrcode-generator2.0.4; no QR-generation service receives them. Its MIT copyright/license are retained.

QR generation is warmed before sharing to preserve native user activation. Cancellation causes no download/clipboard fallback. Unsupported Canvas or File features retain link sharing. Cached QR state is discarded on account changes. Native file-sharing support must still be checked on physical phones.

Local verification:16 unit tests passed and42 Chromium checks passed against the existing LOCAL FAKE backend. These include decoding the actual generated PNG, joining from the decoded URL, browser download/link-copy fallback, unchanged link-only control behavior, three mobile-width frozen-region checks, and zero page errors. OS-native sharing is stubbed in automated browser tests; the PNG and decoder are real. Real staging and hosted-origin QR verification are pending.

## Hosted verification complete

QR candidate: https://dagger-country-club-staging--qr-candidate-qrb4e23h.web.app . Firebase expiration is2026-11-04T21:17:40.998957947Z, covering SundayNovember1. Deployment source is9381bed3ecf1b47b8a457b3241e0a232262dc802; GitHub Actions run40770506000 passed source checks,37 Firestore emulator cases and the separate candidate deployment.

All11 actual-app checks passed on the hosted QR candidate using Firebase11.10 SDK and the real staging backend: PNG QR generation via the existing Share control, decoding that image to the exact invitation, a fresh guest joining via the decoded URL, real listener score updates, reload/rejoin, guest edit restrictions and archive locking. Both temporary test accounts were deleted and the QA room archived. There were zero uncaught application errors and zero blocked requests. OS-native sharing was stubbed; physical camera/native share-sheet verification remains for the owner. Automated decoding is not claimed as a physical phone test.

All62 public application files, including the vendored encoder and its license, match local source byte for byte. Evidence is qr-hosted-browser.json and qr-hosted-source.json. After this deployment, the original sunday-test Money Room code still exactly matches its prior deployed source; sunday-preview-isolation.json records that check. The owner can continue their existing room there. A new origin uses a separate browser identity, so start a fresh QR test room on the new candidate rather than expecting an existing host identity to transfer between preview URLs.

No production deployment or approved HTML/CSS/layout/branding/seal/button/navigation edits occurred. The candidate uses the existing Share Match Invitation control; it does not add an inline QR panel. Files are generated locally and can be shared natively or downloaded with link-copy fallback.
