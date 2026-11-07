# Dagger Country Club — Founders' Twelve Course Coverage
Updated 2026-11-07. Course discovery in OpenGolfAPI is NOT the same as a complete book.

A complete book requires an identified course, validated par + hole yards for each supported tee, 18 verified hole-specific drawings, and two short useful chosen-caddy notes. Caddy, Ghost, and paper scorecard must use the same facts.

| # | Founder course | Verified 18-hole scorecard | 18 matched pencil maps | Status |
|---|---|---|---|---|
| 1 | Bayonet at Puppy Creek, Raeford NC | Five club-verified tee sets | 18 mapped routes, bundled | Complete; iPhone field-tested |
| 2 | Ryder Golf Course, Fort Bragg NC | Three published tee sets with 18 hole values | No hole-specific OSM outlines | Scorecard functional; actual hole maps need survey or other verified source |
| 3 | King's Grant Golf & Country Club, Fayetteville NC | Six tee sets from club source | 18 OSM lines, 17 tee/green matches, 18 fairway matches in QA | Scorecard available. Artwork blocked by missing tee at No. 9 and No. 13 route/card mismatch |
| 4 | The Chimneys Golf Course, Winder GA | Four 18-hole tee cards with published par and stroke index | Provider geometry only; no bundled 18-hole art yet | Scorecard available; full map QA pending |
| 5 | Pelican Pointe Golf and Country Club | Provider fallback only | Provider fallback only | Resolve three nine-hole loops before assigning 18 holes |
| 6 | Hyland Golf Club | White/Gold/Red all 18 holes; Black/Blue totals conflict with source row sums | No hole-specific OSM outlines | Scorecard functional for three tees; map sourcing and remaining tee audit needed |
| 7 | Tobacco Road Golf Course | Five verified-sum published tee rows covering all 18 | Source has 18 OSM mapped holes; remote-art check pending | Scorecard functional; mapping QA pending |
| 8 | Pine Hills Golf Club, Winder GA | Blue/White 18-hole par 72; Red 18-hole par 73, all published hole yards | 18 mapped OSM holes available, hole-assignment QA pending | Scorecard ready; map QA pending |
| 9 | Sassamon Trace Golf Course | Provider fallback only | Provider fallback only | Needs sources and hole-map QA |
| 10 | The Golf Club at Quail Ridge, Sanford NC | Black 6,783 yards, par 72, USGA total cross-check. Existing White, Gold and Red are source-listed legacy cards | 18 matched routes, tees, greens and fairways bundled from OSM | Passes Bayonet parity on Black; current White, Gold and Red hole cards still need confirmation |
| 11 | Pinehurst No. 3 | Official course card: all 18 holes across White/Green/Red/Yellow | Not curated into the shared pencil-book geometry | Verified scorecard ready; map sourcing QA pending |
| 12 | The Ocean Course, Kiawah Island SC | Six complete published 18-hole tee rows; Carolina excluded for conflicting total | 18 mapped OSM routes available via remote adapter | Scorecard ready; remote art QA pending |

## Source and audit guardrails
- King's Grant scorecard: https://kingsgrantgolfcc.com/course-details/ — par 71, six sets, all 18 holes.
- King's Grant source geometry: [OpenStreetMap relation 6446970](https://www.openstreetmap.org/relation/6446970). The QA extract and exact rejected holes are in `qa/course-factory/`.
- Quail Ridge Sanford card: https://zommagolf.com/courses/nc/quail-ridge-golf-club — all 18 holes from White/Gold/Red. The displayed aggregate totals contradict the sum of the per-hole values; Dagger uses the latter and computes its own totals. Quail Ridge in Ada, Michigan is a different club and MUST NOT be imported.
- Sanford Quail Ridge uses [OpenStreetMap relation 6400453](https://www.openstreetmap.org/relation/6400453), with all 18 numbered routes checked against the Black card. The published scorecard takes precedence over the OSM par tag on No. 14.
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
