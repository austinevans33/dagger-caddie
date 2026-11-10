# Dagger Founders 12 — ChatGPT Work Course Factory (2026-11-07)

Base: `release/friday-staging-20261106`. Start by checking its current SHA. Write on new feature branches; use PRs and exact-commit staging tests. Never deploy production.

## Quality requirement
Bayonet is the minimum standard. A scorecard-only course is **not a completed Yardage Book**. Completion requires exact venue identity, validated selected-tee scorecards, 18 real hole-specific tee-to-green routes, mapped tee/green/fairway geometry at Bayonet fidelity, useful two-line caddy advice, and House Ghost playing cinematic shots on the *same drawing*. No fabricated pin positions, hazards, distances or hole artwork. Test mobile scrolling, return-to-hole, round recovery, save/load, and Ghost score secrecy.

## Current implementation
`playtest/founders-verified-scorecards.js`: existing source-backed tee/hole cards.
`playtest/opengolf-catalog.js`: course search and tee discovery.
`playtest/active-course-context.js`: shared verified round facts.
`playtest/hole-sketch.js`, `playtest/shared-hole-sketch.js`: Yardage and Ghost shared drawing pipeline.
`playtest/founders-book-quality.js`, `playtest/founder-geometry-audit.js`: real Bayonet artwork qualification gate.
`playtest/course-art/FOUNDERS_12_STATUS.md`: founder progress.
Draft PR #38: Pelican Pointe 27-hole looping cards and strict quality tests, not yet ready to release.
Draft PR #40: exact provider IDs and remote geometry source audit, not a public release.

## Source findings
OpenGolfAPI exact locality matches:
- Kings Grant Fayetteville NC: `05fcbdde-5401-482f-a58a-f9095a4d31f6`
- Quail Ridge Sanford NC: `c81f16f9-5c38-4558-b514-1a130d340c9e`
- Tobacco Road Sanford NC: `e52240da-a538-46b3-ae9a-b46396b20123`
- Pine Hills Winder GA: `1c93c1ff-42e8-470a-9289-5f68b7909477`
- Hyland Southern Pines NC: `a8ba8ea2-89fb-41b7-9c67-6b7de4f762c2`
- Kiawah Ocean Course SC: `2f8238b3-85d2-4d54-b1af-779dec846381`

OpenGolfAPI currently returns real hole playing lines but mostly lacks hole-assigned tee/green/fairway polygons. Third-party Zomma GeoJSON fetch returned HTTP 403; do not depend on it. Public Overpass timed out in a single probe; avoid bulk use of live free endpoints. Explore appropriately licensed bulk OSM extracts or authorized geodata suppliers. Observe ODbL requirements and attribution.

## Batch execution
1. **Kings Grant + Quail Ridge**: real 18-hole polygon sources, hole-numbering cross-check, bundle licensed data, Bayonet test gate, shared Ghost and caddy flows.
2. Tobacco Road, Pinehurst No. 3, Ryder, Hyland.
3. Pine Hills, Chimneys, Kiawah Ocean; Pelican Pointe (three distinct 9+9 pairings); Sassamon Trace (real 9-hole course, not invented back nine).

For every batch create machine-readable coverage matrix (course, ID, city, tees, valid hole data, art coverage, source/license, pass/fail), import scripts, regression tests, screenshots, PR and exact-SHA verified staging link. An incomplete map must remain clearly labeled provisional. Never promote a scorecard-only course as B/B+.

Do not alter approved Clubhouse design, brand/seal, Money Room, Ledger, AI backend, score write architecture, game engines or Ghost result logic. House Ghost banter, long-term rivalries and personality tweaks are later-stage ideas.

First deliverable: build one small verified mapping batch (Kings Grant and Quail Ridge); if the required polygons are unavailable, document the source blocker and improve only the scorecard coverage honestly. Report actual PRs and tests, not mockups or estimates.
