# Dagger Country Club — Games Expansion Register
Updated 2026-11-09. Scope preservation only. This document does not certify any game implemented.

## Guiding rule
Fun, fast, minimal taps. One score entry powers every compatible game, the scorecard, Money Room, Ticket Window and Ledger. Do not regress existing wager rules, live Firebase, round data, Ghost, or saved state.

## Preserve and finish existing commitments first
- Bingo Bango Bongo: verify first on green, closest to pin, first in hole event capture and ties; do not infer these events from strokes alone.
- Nassau: front/back/overall, presses only with explicit consent and clear ledger representation.
- House Ghost: head-to-head and handicap variants, hole-by-hole and future shot-by-shot where verified data supports it.
- Existing Games and Ledger integrations: no double entry, no phantom wagers, auditable results, paid/unpaid tracking.

## Future game candidates (not promised for Thursday)
- Skins: carryovers, ties, handicap strokes, configurable stakes.
- Wolf: rotating order, partner choices, lone wolf declarations before relevant shots, clear scoring.
- Vegas: two-player teams, combined digit scoring, explicit rules for birdie flips and caps.
- Stableford: gross/net point schedules and handicap strokes.
- Match play and team best ball: concessions, halved holes, handicap allocations.
- Optional variants: Sixes / 6-6-6, Chicago, Rabbit, Snake, closest-to-pin and longest-drive contests, if group demand supports them.
- All Heart Moments: optional contextual proposals only; never silently create a wager.

## Delivery sequencing
P0 Thursday Nov 12: safe core round, course selection, verified pars, Money Room QR two-phone join, existing game regression and score synchronization.
P1: complete existing Bingo Bango Bongo, Nassau and Ghost game flows and ledger reconciliation.
P2: prioritize user-selected games; ship one rules-verified game at a time behind isolated PRs and acceptance tests.
P3: Trip Mode Cup De Diesel Nips: integrate tournament games with Club Treasury, Bounty Board and trip-wide net settlement.

## Acceptance for each game
- Rules and handicap/stroke allocation written down; tie, carryover, press and concession cases tested.
- Clear opt-in, game start and settlement; no unapproved bets.
- Multi-phone consistency, rejoin/recovery, offline behavior, paid/unpaid status.
- No duplicate score entry; result reconciles to ledger and Matchbook.
- CI, browser QA and physical-device checks before promotion.
