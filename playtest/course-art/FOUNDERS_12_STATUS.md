# Dagger Country Club — Founders' Twelve Course Coverage
Updated 2026-11-07. Course discovery in OpenGolfAPI is NOT the same as a complete book.

A complete B/B+ book is **not** a scorecard-only import. Bayonet is the minimum acceptance sample. An identified course and selected-tee 18-hole scorecard are prerequisites, but the map is the product: 18 real hole-matched tee-to-green routes and tee/green outlines, with at least the 17/18 fairway coverage achieved by Bayonet. A chosen caddy supplies two short, helpful notes about playing the pictured hole. House Ghost must animate on the **same** sketch as the Yardage Book (same hole and selected course), with scores hidden until the Ghost finishes. Verify navigation, recovery and iPhone scrolling before promotion. Automated gate: `playtest/founders-book-quality.js`; a source's map remaining offline or unverified means its B/B+ gate FAILS, even if Ghost's generic simulation still runs.

| # | Founder course | Verified 18-hole scorecard | 18 matched pencil maps | Status |
|---|---|---|---|---|
| 1 | Bayonet at Puppy Creek, Raeford NC | Five club-verified tee sets | 18 mapped routes, bundled | Complete; iPhone field-tested |
| 2 | Ryder Golf Course, Fort Bragg NC | Three published tee sets with 18 hole values | No hole-specific OSM outlines | Scorecard functional; actual hole maps need survey or other verified source |
| 3 | King's Grant Golf & Country Club, Fayetteville NC | Six tee sets from club source | Mapped remote art adapter, cross-origin and hole labels require live QA | Scorecard ready; mapping QA pending |
| 4 | The Chimneys Golf Course, Winder GA | Four 18-hole tee cards with published par and stroke index | Provider geometry only; no bundled 18-hole art yet | Scorecard available; full map QA pending |
| 5 | Pelican Pointe Golf and Country Club, Venice FL | Three selectable 18-hole routings: Meadows / Preserve; Preserve / Hatchett; Hatchett / Meadows, Blue/White tee cards | Mapped drawings not curated per named loop | Full routing scorecards ready; loop-mapped art QA pending |
| 6 | Hyland Golf Club | White/Gold/Red all 18 holes; Black/Blue totals conflict with source row sums | No hole-specific OSM outlines | Scorecard functional for three tees; map sourcing and remaining tee audit needed |
| 7 | Tobacco Road Golf Course | Five verified-sum published tee rows covering all 18 | Source has 18 OSM mapped holes; remote-art check pending | Scorecard functional; mapping QA pending |
| 8 | Pine Hills Golf Club, Winder GA | Blue/White 18-hole par 72; Red 18-hole par 73, all published hole yards | 18 mapped OSM holes available, hole-assignment QA pending | Scorecard ready; map QA pending |
| 9 | Sassamon Trace Golf Course | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 10 | The Golf Club at Quail Ridge, Sanford NC | White/Gold/Red 18-hole listing; source totals conflict with hole values | Mapped geometry exists but hole numbering is unverified; deliberately blocked | Scorecard functional; map reconciliation and published-total review pending |
| 11 | Pinehurst No. 3 | Official course card: all 18 holes across White/Green/Red/Yellow | Not curated into the shared pencil-book geometry | Verified scorecard ready; map sourcing QA pending |
| 12 | The Ocean Course, Kiawah Island SC | Six complete published 18-hole tee rows; Carolina excluded for conflicting total | 18 mapped OSM routes available via remote adapter | Scorecard ready; remote art QA pending |

## Source and audit guardrails
- King's Grant scorecard: https://kingsgrantgolfcc.com/course-details/ — par 71, six sets, all 18 holes.
- King's Grant illustrative geometry: https://zommagolf.com/courses/nc/kings-grant-golf-and-country-club/geo.json — © OpenStreetMap contributors (ODbL 1.0). Only render if exact course_ref and hole-assigned features pass validation.
- Quail Ridge Sanford card: https://zommagolf.com/courses/nc/quail-ridge-golf-club — all 18 holes from White/Gold/Red. The displayed aggregate totals contradict the sum of the per-hole values; Dagger uses the latter and computes its own totals. Quail Ridge in Ada, Michigan is a different club and MUST NOT be imported.
- Quail Ridge mapped features are not safe to assign to scored holes until numbering reconciliation; no fabricated hazards or fairway shapes in lieu of verified mapping.
- Never invent pin distances, hazards, mapped hole shapes, or a tee's unpublished 18-hole distances.
- Do not mark a course 'full Yardage Book' merely because it is in provider search.
- Preserve existing round, Ghost, games, and ledger identities when switching courses. Never silently move an old round to a new provider identity.

- Ryder published card: https://zommagolf.com/courses/nc/ryder-golf-course — three sets, 18 holes; published source has no stroke index or mapped holes.
- Tobacco Road published card/map: https://zommagolf.com/courses/nc/tobacco-road-golf-club — five separate tee sets with cross-checked sums and 18 mapped course routes.
- Hyland published card: https://zommagolf.com/courses/nc/hyland-golf-club — White/Gold/Red rows sum properly. Source Blue/Black aggregate totals disagree with hole values; those rows remain withheld.

- Pinehurst No. 3 official four-tee par-68 scorecard: https://www.pinehurst.com/golf/courses/no-3/ — 18 holes and tee-specific stroke index.
- Ocean Course Kiawah 18-hole card and OSM mapping: https://zommagolf.com/courses/sc/kiawah-island-golf-resort-the-ocean-course — Black/Gold/Silver/Red club-checked yardages, plus Dye/Kiawah reported. Carolina total disagrees with row sum and is withheld.

- Chimneys Winder Georgia 18-hole scorecard: https://maps.golf/courses/the-chimneys-golf-course — Gold, Blue, White and Green rows, summed from 18 documented holes. Secondary aggregate claims conflict, so only per-hole sums used.
- Pine Hills Winder Georgia full three-tee course card: https://zommagolf.com/courses/ga/pine-hills-golf-club — 18 holes with mapped outlines; Red tee 18th is a published par 5, unlike Blue and White par 4.

- Pelican Pointe official three-loop routing: https://www.pelicanpointeclub.com/-course-layout and published combo cards https://offcourse.co/courses/scorecard/pelican-pointe-golf-country-club/ — separate exact IDs for all 3 pairings so score data cannot be swapped between different layouts; Blue and White full 18-hole cards per pairing. No unverified hole art.

## Founder art acceptance checklist
1. Fetch the exact verified course geometry once, preserve OSM attribution/licensing and source identity, and bundle/map it through a deterministic loader. Do not rely on cross-origin geo.json without verified CORS and offline behavior.
2. Verify **all 18 hole identifiers** against that course's scorecard (or each named nine-hole loop), and validate tee, green, route and fairway features. Do not put hole 3 artwork under hole 4.
3. Audit with `auditFounderBook`: 18/18 matched tee/green routes; fairways at least 17/18 like Bayonet. A missing hazard is unknown, never evidence it doesn't exist.
4. Render the same mapping in Yardage Book and Ghost and test actual watch/skip/replay, hidden strokes until completion, scorecard preservation and real iPhone scrolling.
5. Only then mark the venue **B/B+**. A published 18-hole card with placeholder art is **scorecard-ready**, not founder-ready.
6. Sassamon Trace is a real nine-hole course: support honest nine-hole play, not nine invented holes to pass an 18-hole gate. Pelican Pointe uses distinct named loop pairs; each routing earns its own certification.
