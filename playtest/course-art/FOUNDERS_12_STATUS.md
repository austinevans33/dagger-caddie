# Dagger Country Club — Founders' Twelve Course Coverage
Updated 2026-11-07. Course discovery in OpenGolfAPI is NOT the same as a complete book.

A complete book requires an identified course, validated par + hole yards for each supported tee, 18 hole-specific drawings (or explicitly labeled unavailable geometry), and two short useful chosen-caddy notes. Caddy, Ghost, and paper scorecard must use the same facts.

| # | Founder course | Verified 18-hole scorecard | 18 matched pencil maps | Status |
|---|---|---|---|---|
| 1 | Bayonet at Puppy Creek, Raeford NC | Five club-verified tee sets | 18 mapped routes, bundled | Complete; iPhone field-tested |
| 2 | Ryder Golf Course, Fort Bragg NC | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 3 | King's Grant Golf & Country Club, Fayetteville NC | Six tee sets from club source | Mapped remote art adapter, cross-origin and hole labels require live QA | Scorecard ready; mapping QA pending |
| 4 | The Chimneys Golf Course | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 5 | Pelican Pointe Golf and Country Club | Provider fallback only | Provider fallback only | Resolve three nine-hole loops before assigning 18 holes |
| 6 | Hyland Golf Club | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 7 | Tobacco Road Golf Course | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 8 | Pine Hills Golf Club | Provider fallback only | Provider fallback only | Verify correct club identity, then source cards/art |
| 9 | Sassamon Trace Golf Course | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 10 | The Golf Club at Quail Ridge, Sanford NC | White/Gold/Red 18-hole listing; source totals conflict with hole values | Mapped geometry exists but hole numbering is unverified; deliberately blocked | Scorecard functional; map reconciliation and published-total review pending |
| 11 | Pinehurst No. 3 | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 12 | The Ocean Course | Provider fallback only | Provider fallback only | Verify correct venue/identity and hole-map QA |

## Source and audit guardrails
- King's Grant scorecard: https://kingsgrantgolfcc.com/course-details/ — par 71, six sets, all 18 holes.
- King's Grant illustrative geometry: https://zommagolf.com/courses/nc/kings-grant-golf-and-country-club/geo.json — © OpenStreetMap contributors (ODbL 1.0). Only render if exact course_ref and hole-assigned features pass validation.
- Quail Ridge Sanford card: https://zommagolf.com/courses/nc/quail-ridge-golf-club — all 18 holes from White/Gold/Red. The displayed aggregate totals contradict the sum of the per-hole values; Dagger uses the latter and computes its own totals. Quail Ridge in Ada, Michigan is a different club and MUST NOT be imported.
- Quail Ridge mapped features are not safe to assign to scored holes until numbering reconciliation; no fabricated hazards or fairway shapes in lieu of verified mapping.
- Never invent pin distances, hazards, mapped hole shapes, or a tee's unpublished 18-hole distances.
- Do not mark a course 'full Yardage Book' merely because it is in provider search.
- Preserve existing round, Ghost, games, and ledger identities when switching courses. Never silently move an old round to a new provider identity.
