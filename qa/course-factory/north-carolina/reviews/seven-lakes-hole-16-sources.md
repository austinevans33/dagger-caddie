# Seven Lakes No. 16 tee-start review

The verified West End scorecard lists No. 16 at 188 yards from Black and Blue, 174 from White, 151 from Gold, and 116 from Red and Green. The [club scorecard](https://www.golf7lakes.com/scorecard) and [club hole gallery](https://www.golf7lakes.com/gallery-1-2-1#hc-hole-16) agree. This is a source review for the scorecard-only candidate in [PR #60](https://github.com/austinevans33/dagger-caddie/pull/60).

## What the overlay establishes

[OSM route 1113464356](https://www.openstreetmap.org/way/1113464356) runs from `(-79.5663870, 35.2674444)` in [tee polygon 1113666420](https://www.openstreetmap.org/way/1113666420) to `(-79.5670455, 35.2682582)` in [green polygon 1113464354](https://www.openstreetmap.org/way/1113464354). Coordinates are longitude, latitude in WGS 84. Its two vertices are 118.6 yards apart using a spherical inverse with Earth radius 6,371,008.8 m. The dated NC extract identifies these same features in the [existing course review](seven-lakes-west-end-nc.json).

The January 28, 2025 NC OneMap orthophoto and the USGS NAIP export both put the mapped start over the forward teeing area and the mapped end on the putting surface. The OSM start is about 3 yards from the published Red/Green distance and 69 yards short of Black/Blue. The other OSM tee polygon in the crop is No. 17's already-matched start. The club's No. 16 tee photograph shows blue markers in the foreground and a cart path on the right of the playing corridor. It corroborates the hole and the presence of a Blue tee. The club routing illustration shows multiple tee positions on No. 16, but the symbols have no tee-color key or georeferenced boundaries. The photograph has no georeferenced camera position, and shadows and vegetation break up the visible surfaces farther behind the OSM start.

On the 900 × 950 NC OneMap crop, sample points near pixel (655, 730) and (790, 757) measure approximately 159 and 180 yards to the OSM end. Points around (740, 825) and (778, 813) measure approximately 189–191 yards. Pixel coordinates are zero-based from the upper left and rounded for inspection. These are review samples across the rear clearing. Yardage alone cannot assign a marker or establish the playable edge of a tee pad.

Keep the course scorecard-only. A georeferenced field photo or club-confirmed Black/Blue marker location paired with a defensible tee outline would resolve the remaining uncertainty. Run the full existing Bayonet checks again before publishing any book.

## Reference requests

Both aerial requests use the services' `exportImage` endpoint with `bbox=-79.56765,35.26665,-79.56575,35.26865`, `bboxSR=4326`, `imageSR=4326`, `size=900,950`, `format=png`, and `f=image`. The NC OneMap `f=pjson` response expands the latitude extent to `35.266647222222218,35.268652777777781` to fit the requested aspect ratio. The image services can return updated mosaics. The hashes identify the compared responses.

| Reference | Capture or asset | SHA-256 |
| --- | --- | --- |
| [NC OneMap latest orthophoto](https://services.nconemap.gov/secure/rest/services/Imagery/Orthoimagery_Latest/ImageServer) | Catalog object 512842, `OF6i0_37_000_10853503_20250128_0214R0` | `e0d378cf941ce32133382696410ec35a6747537c4161cef8b9b02ce1eede50b0` |
| [USGS NAIP image service](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer) | Independent leaf-on imagery export. Acquisition date of this mosaic response was not confirmed. | `2dbcf72ab1222ebeb40b8ea69bfb606ae9cbdc5594e10188d2cd753aba00fb97` |
| [Club tee photo](https://images.squarespace-cdn.com/content/v1/695282403c884b4f1e007df2/f6b93894-0313-4bf7-aac9-493c48c4402d/h16-b-web.jpg?format=750w) | Club gallery, No. 16, “From the tee” | `06df063780a3a8600d91b2ced6f30317738a9f3be6b2f66313e95e3dcdabe326` |
| [Club routing illustration](https://images.squarespace-cdn.com/content/v1/695282403c884b4f1e007df2/db14e5e5-91db-4b48-aecc-60cd175c3f8b/Scorecard+map.png?format=1500w) | Club gallery, scorecard map | `bf57f29d399df604cd2494f803b6156287b5be37acb1f51a0170869585d497c8` |

Images were used for comparison and are outside the runtime bundle. OSM geometry is credited to [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
