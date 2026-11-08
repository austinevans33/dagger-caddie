# Dagger Country Club — Founders' Twelve Course Coverage
Updated 2026-11-07. Course discovery in OpenGolfAPI is NOT the same as a complete book.

A complete book requires an identified course, validated par + hole yards for each supported tee, 18 verified hole-specific drawings, and two short useful chosen-caddy notes. Caddy, Ghost, and paper scorecard must use the same facts.

| # | Founder course | Verified 18-hole scorecard | 18 matched pencil maps | Status |
|---|---|---|---|---|
| 1 | Bayonet at Puppy Creek, Raeford NC | Five club-verified tee sets | 18 mapped routes, bundled | Complete; iPhone field-tested |
| 2 | Ryder Golf Course, Fort Bragg NC | Three published tee sets with 18 hole values | Named OSM boundary, no matched numbered routes in the pinned extract | Scorecard functional. Army MWR has a routing reference; confirm its reuse rights and pair with licensed geometry before importing |
| 3 | King's Grant Golf & Country Club, Fayetteville NC | Six tee sets from club source | 18 routes, greens and fairway holes; 16 mapped tee outlines and two approximate tee points | Playable with disclosed reference tees on Nos. 9 and 13 |
| 4 | The Chimneys Golf Course, Winder GA | Four 18-hole tee cards with published par and stroke index | 18 matched routes, tees and greens; 17 fairways bundled | Passes Bayonet parity on Gold. No fairway drawn on par-3 No. 11 |
| 5 | Pelican Pointe Golf and Country Club | Club-published Gold, Blue, White, Black and Red for all three rated pairings | 17 of 27 physical holes meet route containment and have matched tee, green and fairway | Scorecard playable in review candidate. Ten routes cross gaps in the mapped club boundary; artwork withheld for all three pairings |
| 6 | Hyland Golf Club | Five official tees, including reconciled Black 6,934 and Blue 6,700 | No. 10 route located in an excluded parcel; 18 route/tee/green matches in outer-ring QA only, 15 fairway holes | Scorecard functional. Holes 3, 6 and 10 have no uniquely assigned fairway; artwork withheld |
| 7 | Tobacco Road Golf Course | Five verified-sum published tee rows covering all 18 | 18 routes and greens, 16 tees, 14 fairways in QA | Scorecard functional; artwork gated off pending verified starts for Nos. 1/10 and fairway coverage |
| 8 | Pine Hills Golf Club, Winder GA | Blue/White 18-hole par 72; Red 18-hole par 73, all published hole yards | 18 matched routes, tees and greens; 17 fairways bundled | Passes Bayonet parity on Blue. Red keeps its tee-specific par 5 on No. 18 |
| 9 | Sassamon Trace Golf Course | Official nine-hole card: par 32, Blue 2,383, White 2,167, Yellow 2,011, Red 1,744 | Nine routes, tees and greens; eight matched fairways | Native nine-hole book and Ghost. No. 3 is a par 3 with no fairway drawn |
| 10 | The Golf Club at Quail Ridge, Sanford NC | Black 6,783 yards, par 72, USGA total cross-check. Existing White, Gold and Red are source-listed legacy cards | 18 matched routes, tees, greens and fairways bundled from OSM | Passes Bayonet parity on Black; current White, Gold and Red hole cards still need confirmation |
| 11 | Pinehurst No. 3 | Official course card: all 18 holes across White/Green/Red/Yellow | 18 candidate routes and greens, 10 tees, no validated fairways | Scorecard ready; separate No. 3 boundary and missing shapes require source review |
| 12 | The Ocean Course, Kiawah Island SC | Six complete published 18-hole tee rows; Carolina excluded for conflicting total | 18 matched routes, tees and greens; 17 fairway holes bundled | Passes Bayonet parity on the club Black card. The club diagram corroborates No. 16’s tee |

## Source and audit guardrails
- King's Grant scorecard: https://kingsgrantgolfcc.com/course-details/ — par 71, six sets, all 18 holes.
- King's Grant source geometry: [OpenStreetMap relation 6446970](https://www.openstreetmap.org/relation/6446970). The original rejected extract and revised reference-tee audit are in `qa/course-factory/`.
- Quail Ridge Sanford card: https://zommagolf.com/courses/nc/quail-ridge-golf-club — all 18 holes from White/Gold/Red. The displayed aggregate totals contradict the sum of the per-hole values; Dagger uses the latter and computes its own totals. Quail Ridge in Ada, Michigan is a different club and MUST NOT be imported.
- Sanford Quail Ridge uses [OpenStreetMap relation 6400453](https://www.openstreetmap.org/relation/6400453), with all 18 numbered routes checked against the Black card. The published scorecard takes precedence over the OSM par tag on No. 14.
- Never invent pin distances, hazards, mapped hole shapes, or a tee's unpublished 18-hole distances.
- Do not mark a course 'full Yardage Book' merely because it is in provider search.
- Preserve existing round, Ghost, games, and ledger identities when switching courses. Never silently move an old round to a new provider identity.

- Ryder published card: https://zommagolf.com/courses/nc/ryder-golf-course — three sets, 18 holes; published source has no stroke index or mapped holes.
- Tobacco Road published card/map: https://zommagolf.com/courses/nc/tobacco-road-golf-club — five separate tee sets with cross-checked sums and 18 mapped course routes.
- Hyland [official club card](https://www.hylandgolfclub.com/course-details/) resolves the conflicting third-party Blue and Black yardages. Existing White/Gold/Red hole yardages and tee IDs match.
- Pelican Pointe [official club layout and scorecards](https://www.pelicanpointeclub.com/-course-layout) and [FSGA pairing order](https://www.fsga.org/Club/Detail/20426cb1-7488-42db-9818-9268bcfcb311). Routing IDs are separate and no per-nine handicap index is converted to a pairing index.
- [Founders source review and reproduction steps](../../qa/course-factory/founders/README.md) record the dated ODbL extracts, exact route issues, and which changes are withheld.

- Pinehurst No. 3 official four-tee par-68 scorecard: https://www.pinehurst.com/golf/courses/no-3/ — 18 holes and tee-specific stroke index.
- Ocean Course Kiawah official card: https://kiawahresort.com/wp-content/uploads/2025/03/Ocean-Course-SC25.pdf — Black/Gold/Silver/Red club-checked yardages, plus Dye/Kiawah reported. Carolina total disagrees with row sum and is withheld.

- Chimneys Winder Georgia 18-hole scorecard: https://maps.golf/courses/the-chimneys-golf-course — Gold, Blue, White and Green rows, summed from 18 documented holes. Secondary aggregate claims conflict, so only per-hole sums used.
- Pine Hills Winder Georgia full three-tee course card: https://zommagolf.com/courses/ga/pine-hills-golf-club — 18 holes with mapped outlines; Red tee 18th is a published par 5, unlike Blue and White par 4.
