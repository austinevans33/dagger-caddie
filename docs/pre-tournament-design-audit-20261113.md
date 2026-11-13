# Dagger Country Club — pre-tournament UX and design audit
Review date: 2026-11-13
Scope: GitHub source inspection of the pinned production Clubhouse facade, tournament Firebase playtest, and release gates. This is NOT device QA or a certification that the app is ready for a battalion event.

## Design direction (preserve)
- Keep R160 Dagger Country Club name, original approved seal, club green/cream/gold palette and the existing three-tab on-course approach.
- One scoring input powers the scorecard and downstream surfaces. No parallel tournament score state inside the Clubhouse.
- Keep Tournament HQ behind Games once released, not an additional permanent navigation tab.
- Favor functional clarity over extra decorative content.

## Implemented on this review branch
1. Scoped focus-visible outlines across Clubhouse actions and Grounds doors, including services and dialog fields.
2. Tactile feedback for touch surfaces without introducing JavaScript listeners.
3. A narrow-viewport layout adjustment for smaller iPhones, preventing oversized tile labels and maintaining tap-area height.
4. Respect reduced-motion preferences for Clubhouse/Grounds transitions.

These CSS-only changes do not modify scoring, Firebase, data persistence, routes, branding assets or production HTML. They are NOT live until separately reviewed and safely promoted.

## Findings from actual source inspection
| Priority | Finding | Evidence | Safe fix / acceptance criterion |
|---|---|---|---|
| P0 | Tournament not deployed and not phone-verified | docs/tournament-hq-release-gates.md | Explicit staging Firebase deploy, permissions verification, 2+ distinct real phones, rollback plan |
| P0 | Firebase playtest currently imports shared production config | playtest/tournament-hq-live.html | Isolate staging Auth/Firestore/Functions before any staging trial |
| P0 | Public rankings depend on verified local scorecard data | playtest/tournament-hq-live.html | Store authoritative, source-backed course/tee hole pars for the event and serve identical score-to-par/ranks to all clients |
| P0 | No proven offline scoring submission and recovery UX | playtest/tournament-hq-live.html | Clear pending/confirmed/failed status, no silent score loss, retries idempotent, paper fallback |
| P0 | Public production shell remains pinned deliberately | scripts/production-bundle.py | Do not bypass invariant; separate reviewed promotion with CI, regression and Pages verification |
| P1 | Event creation hardcodes teamLimit:36 | playtest/tournament-hq-live.html | Director selects 2–36 teams with server-side limit and validation; do not claim selector already exists |
| P1 | Event form lacks 2-player / 4-player roster format | playtest/tournament-hq-live.html | Event-wide team-size metadata and capacity counts, coordinated with backend validation |
| P1 | Live score entry only shows a numeric strokes input + next hole | playtest/tournament-hq-live.html | One-tap +/- score entry and real team scorecard, with visible confirmed sync state |
| P1 | Captain invitation is exposed as a token-bearing URL | playtest/tournament-hq-live.html | Preserve one-use invite flow, minimize token exposure in URLs/history/logs, test join/replay |
| P1 | Director correction and documented reason not exposed in playtest UI | playtest/tournament-hq-live.html | Audited director-only correction interface, with history visible to director |
| P1 | Finalize UI doesn't visibly show unresolved/unfinished team counts before lock | playtest/tournament-hq-live.html | Confirmation must show missing holes/teams and require explicit finalization |
| P1 | Leaderboard uses a wide 3-column table | playtest/tournament-hq-live.html | Narrow-screen leaderboard with team name, to-par, thru, tie, and position clearly legible |
| P1 | No spectator/guest-friendly entry in playtest | playtest/tournament-hq-live.html | Read-only guest route with explicit data permissions; no Money Room/private ledger leakage |
| P2 | Clubhouse uses multiple high-importance controls stacked vertically | app/61f9e9de0a/clubhouse-home.js | Test the first-visit and live-round task paths before rearranging approved navigation |
| P2 | Some Clubhouse buttons use decorative glyphs as icons | app/61f9e9de0a/clubhouse-home.js | Ensure labels remain readable with large text and VoiceOver |
| P2 | No event-ready awards/share card observed in inspected playtest | playtest/tournament-hq-live.html | Championship end card, team scorecards, verified hole-by-hole totals, clearly labeled unofficial/final state |

## Pre-battalion real-device acceptance scenarios
1. Two-person and four-person events; fields of 2, 4, 18, 26 and 36 teams.
2. Shotgun starts 4, 18, 1 and A/B groups on same starting hole; correct 18-hole wrap and 9-hole variant.
3. Captain accepts one-use invite; another account cannot claim or edit that team.
4. Director correction has reason, audit event and refreshed standings for everyone.
5. Disconnect before score entry, during submission, reconnect after a timeout, and attempt double-submit; distinguish pending, confirmed and failed.
6. Tournament finalization with incomplete rounds, ties, and corrections before/after lock.
7. Spectator view on an unsigned-in phone cannot access Money Room, private wagers, account data or captain actions.
8. iPhone Safari home-screen shortcut, narrow iPhone portrait, large-text accessibility, Android Chrome, VoiceOver, and low signal.
9. Verify all original Clubhouse, Ghost, Money Room, Games, Ledger, account and scorecard flows remain intact.
10. Test 36-team simultaneous updates and maintain a physical printed scorecard fallback.

## Rollout order
- Review CSS enhancement branch and run the existing production bundle and caddy/course safety checks.
- Treat full championship scorecard work as separate staged implementation after authoritative event course data and multi-phone backend.
- Never announce Tournament HQ live on the strength of GitHub PRs alone.
