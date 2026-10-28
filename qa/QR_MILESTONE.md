# QR invitation candidate

The original sunday-test preview remains unchanged while the owner tests it. New work is isolated on development/money-room-qr and deploys only to the separate qr-candidate channel.

The existing Share Match Invitation control can share a locally generated PNG QR plus the invitation URL through native file sharing. Where native file sharing is unavailable, it saves the PNG and attempts to copy the link. Copy invite link retains link-only behavior. No HTML, CSS, labels, layouts, branding, seals or navigation were edited. No in-page QR panel or new button was added. Invitation codes are encoded on-device with vendored qrcode-generator2.0.4; no QR-generation service receives them. Its MIT copyright/license are retained.

QR generation is warmed before sharing to preserve native user activation. Cancellation causes no download/clipboard fallback. Unsupported Canvas or File features retain link sharing. Cached QR state is discarded on account changes. Native file-sharing support must still be checked on physical phones.

Local verification:16 unit tests passed and42 Chromium checks passed against the existing LOCAL FAKE backend. These include decoding the actual generated PNG, joining from the decoded URL, browser download/link-copy fallback, unchanged link-only control behavior, three mobile-width frozen-region checks, and zero page errors. OS-native sharing is stubbed in automated browser tests; the PNG and decoder are real. Real staging and hosted-origin QR verification are pending.
