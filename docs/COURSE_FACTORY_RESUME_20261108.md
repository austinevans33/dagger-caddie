# Course Factory continuation, November 8, 2026

Read [handoff PR #46](https://github.com/austinevans33/dagger-caddie/pull/46) first for release and staging procedure. The inspected release branch `release/friday-staging-20261106` is at `75c8a13ce9a45f05384445c134d6c701838cf318`. PRs #43–#50 were open drafts at inspection, with passing workflows on implementation heads and no PR workflow on documentation-only #46. The continuation starts from PR #50, `6a5c31b175efee441fc9bf432dfb8d0c6181593d`, which includes native nine-hole Sassamon Trace. Florida PR [#51](https://github.com/austinevans33/dagger-caddie/pull/51) adds the next three verified Florida books at `d8403f4b82aa8dcace3b2997091ac3be31a59e39`. The Carolinas batch builds on #51.

## Added strict books

| Course | Comparison tee | Routes / tees / greens / fairways | Published tee cards |
| --- | --- | --- | --- |
| Disney’s Palm, Lake Buena Vista FL | Blue, 6,840 yards, par 72 | 18 / 18 / 18 / 17 | Blue, White, Yellow, Red |
| Palatka Golf Club, Palatka FL | Blue, 5,862 yards, par 70 | 18 / 18 / 18 / 18 | Blue, White and White (Women) |
| Mount Dora Golf Club, Mount Dora FL | Blue, 5,719 yards, par 70 | 18 / 18 / 18 / 18 | Blue, White, Red, Gold |
| Tanglewood Park Championship Course, Clemmons NC | Gold, 7,101 yards, par 70 | 18 / 18 / 18 / 18 | Gold, Blue, White, Black, Red, Family |
| Hidden Cypress Golf Club, Bluffton SC | Gold, 6,549 yards, par 72 | 18 / 18 / 18 / 17 | Red, Gold, Blue, White, Black, Orange |

The [Florida QA matrix](../qa/course-factory/florida/README.md) covers all 18 reviewed venues and the [Carolinas QA matrix](../qa/course-factory/carolinas/README.md) covers four strict books. The manifests pin the dated OSM extracts, derived snapshots, club cards and individual geometry bundles. The browser tests use actual app routes for check-in, Yardage Book, shared Ghost and Caddy handoff. Scope is browser QA on isolated local assets and GitHub build artifacts. Hosted staging, physical iPhone Safari, actual live Caddy replies and two-device Firebase acceptance remain separate.

## Remaining Florida and Founders work

- **Florida:** DeBary needs a current route correspondence for nine par conflicts and four distance flags. Waldorf needs current post-renovation geometry, especially Nos. 7, 16, 17 and 18. Magnolia needs a verified front-nine routing and its rebuilt Nos. 14–17. Crooked Cat and Panther Lake have separate OSM route reviews under the same facility. Crooked Cat has 14 matched fairways. Panther Lake has 16 fully matched route endpoints, a boundary exception on No. 12 and an unnamed candidate on No. 17. Otter Creek still needs a full club-issued card. Existing partials retain scorecard access where verified.
- **Founders:** The native Sassamon book and round handling are in #50, including a documented unmapped fairway at the par-3 third. Pelican Pointe's three pairings retain the official five-tee cards, and ten physical routes still cross mapped boundary gaps. Hyland No. 10 is located, but the tee is within a cutout in the venue relation and the outer-ring diagnostic only yields 15 matched fairways. Tobacco Road still needs mapped tees for Nos. 1 and 10 and additional qualifying fairways. Pinehurst No. 3 still needs verified individual course assignment and missing shapes. Ryder's Army MWR routing matches the owner’s image, and its open map boundary still lacks numbered hole lines. A 2022 USDA NAIP tile (`nc_m_3507849_sw_17_060_20220531`) covers the venue. The tile metadata and TIFF header were confirmed in the prior session, with imagery-to-hole alignment and feature tracing still open. See [Founders source notes](../qa/course-factory/founders/native-nine/README.md).
- **Next:** Confirm course-specific, reusable evidence for Pelican’s crossings and Ryder’s 18 routes. For the next regional batch, prioritize Longleaf’s full official tee card and verify the club sources for Dolphin Head and Olde Beaufort. Keep partial maps out of runtime until their existing parity gate passes.

The PR build is a review candidate. Stage only through the existing approved preview procedure after explicit authorization. The production release and the Firebase environment are outside the course changes.
