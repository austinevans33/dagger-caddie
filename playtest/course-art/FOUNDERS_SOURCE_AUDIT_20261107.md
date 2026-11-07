# Founders 12 real-hole art source audit — 2026-11-07

Status: **not B/B+ complete**. This is the read-only technical source investigation, not a release.

The existing third-party `zommagolf.com/.../geo.json` URLs return **HTTP 403** when fetched from GitHub Actions, including Kings Grant, Sanford Quail Ridge, Tobacco Road, Winder Pine Hills and Kiawah Ocean. Consequently they cannot currently be a dependable source for new production Yardage Books. Do not repeatedly retry a forbidden source.

OpenGolfAPI's read endpoints **do** work from GitHub Actions. Exact city/state matches were verified with provider search:

| Founder | Provider ID | Course location | Sample hole data |
|---|---|---|---|
| King's Grant | `05fcbdde-5401-482f-a58a-f9095a4d31f6` | Fayetteville, NC | real OSM hole lines 1,7,18 |
| Quail Ridge | `c81f16f9-5c38-4558-b514-1a130d340c9e` | Sanford, NC | real OSM hole lines 1,7,18 |
| Tobacco Road | `e52240da-a538-46b3-ae9a-b46396b20123` | Sanford, NC | real OSM hole lines 1,7,18 |
| Pine Hills | `1c93c1ff-42e8-470a-9289-5f68b7909477` | Winder, GA | holes 7,18, but hole 1 absent |
| Ocean Course | `2f8238b3-85d2-4d54-b1af-779dec846381` | Kiawah Island, SC | OSM lines 1,7,18, and hole-18 green |
| Hyland | `a8ba8ea2-89fb-41b7-9c67-6b7de4f762c2` | Southern Pines, NC | real OSM hole lines 1,7,18 |

The OpenGolfAPI feature endpoint responds with `precise_included:false`; most sample holes return **only a playing line** and not tee/green/fairway polygons. **This is not Bayonet-level art.** A line alone can guide a Ghost tracer only if par/hole identity and tee distance also match, but it cannot be marketed as a finished illustrated book.

The one-off OpenStreetMap Overpass probe for Kings Grant (small 1.2km search radius, polite User-Agent, no retries) exceeded a 26-second timeout. Production must not depend on public Overpass. For full real-hole polygons use an offline OSM extract / responsibly cached licensed data / approved full-course source. Attribute and respect ODbL share-alike.

Automated gate already merged on release: `playtest/founder-geometry-audit.js`, `playtest/founders-book-quality.js`, tests. Bayonet 18/18 passes; swapped, missing, duplicate and wrong-club geometry fails. For new course art, preserve exact course identity, 18 hole assignments, route-length correlation, tee/green/fairway polygons and matching selected-tee card before calling it B/B+.

This branch's scripts `scripts/audit-founder-remote-art.mjs`, `scripts/probe-founder-opengolf.mjs`, `scripts/probe-founder-overpass.mjs` and its isolated audit workflow are **diagnostics only**. Do not merge or enable repeated external public map scraping as a normal deployment requirement.
