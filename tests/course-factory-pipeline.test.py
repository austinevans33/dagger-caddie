"""Network-free tests for the Course Factory source adapters."""
import hashlib
import json
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET

import osmium
from shapely.geometry import Point

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
load_card = runpy.run_path(str(SCRIPTS / "course-factory-card.py"))["load_card"]
snapshot = runpy.run_path(str(SCRIPTS / "course-factory-snapshot.py"))["snapshot"]
GolfSnapshot = runpy.run_path(str(SCRIPTS / "course-factory-review.py"))["GolfSnapshot"]


checked_range = runpy.run_path(str(SCRIPTS / "course-factory-imagery.py"))["checked_range"]


class CourseFactoryPipeline(unittest.TestCase):
    def test_imagery_cache_rejects_wrong_and_missing_bytes(self):
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp)
            data = b"pinned aerial tile"
            digest = hashlib.sha256(data).hexdigest()
            spec = {"offset": 123, "length": len(data), "sha256": digest}
            with self.assertRaisesRegex(ValueError, "Missing cached range"):
                checked_range(spec, cache)
            tile = cache / (digest + ".range")
            tile.write_bytes(data)
            self.assertEqual(checked_range(spec, cache), (123, data))
            tile.write_bytes(b"x" * len(data))
            with self.assertRaisesRegex(ValueError, "checksum differs"):
                checked_range(spec, cache)

    def test_ryder_anchors_cover_all_eighteen_holes_inside_the_pinned_crop(self):
        folder = SCRIPTS.parent / "qa" / "course-factory" / "founders" / "ryder"
        review = json.loads((folder / "green-review.json").read_text())
        source = json.loads((folder / review["source"]).read_text())
        left, top, right, bottom = source["crop"]
        self.assertEqual(review["status"], "review-only")
        self.assertEqual([g["hole"] for g in review["greens"]], list(range(1, 19)))
        pixels = {tuple(g["pixel"]) for g in review["greens"]}
        self.assertEqual(len(pixels), 18)
        self.assertTrue(all(0 <= x < right - left and 0 <= y < bottom - top for x, y in pixels))

    def test_all_parts_of_an_official_card_are_required(self):
        with tempfile.TemporaryDirectory() as temp:
            front = Path(temp) / "card"
            back = Path(temp) / "card-back"
            front.write_bytes(b"front")
            back.write_bytes(b"back")
            spec = {
                "sha256": hashlib.sha256(b"front").hexdigest(),
                "additionalSources": [{"suffix": "back", "sha256": hashlib.sha256(b"back").hexdigest()}],
                "format": "reviewed-image", "reviewNote": "Both numbered images checked",
                "reviewedRows": {"Par": [[4] * 9 + [36], [4] * 9 + [36, 72]],
                                 "Blue": [[400] * 9 + [3600], [400] * 9 + [3600, 7200]]},
                "tees": {"blue": {"label": "Blue"}},
            }
            self.assertEqual(load_card(front, spec)["tees"]["blue"]["yards"], [400] * 18)
            back.write_bytes(b"wrong course")
            with self.assertRaisesRegex(ValueError, "scorecard part checksum differs"):
                load_card(front, spec)
            back.unlink()
            with self.assertRaises(FileNotFoundError):
                load_card(front, spec)

    def test_reviewed_par_correction_checks_printed_value_and_totals(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "pinned.pdf"
            path.write_bytes(b"fixture")
            spec = {
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "format": "reviewed-image", "reviewNote": "Checked printed card",
                "reviewedRows": {"Par": [[4] * 9 + [36], [4] * 7 + [5, 4, 36, 72]],
                                 "Blue": [[400] * 9 + [3600], [400] * 9 + [3600, 7200]]},
                "tees": {"blue": {"label": "Blue"}},
            }
            with self.assertRaisesRegex(ValueError, "subtotal or total"):
                load_card(path, spec)
            correction = {"hole": 17, "printed": 5, "verified": 4, "evidence": ["club card"]}
            self.assertEqual(load_card(path, {**spec, "parCorrection": correction})["par"], [4] * 18)
            with self.assertRaisesRegex(ValueError, "printed par differs"):
                load_card(path, {**spec, "parCorrection": {**correction, "printed": 3}})

    def test_pdf_page_selection_prevents_adjacent_course_mixups(self):
        def row(label, value):
            nine = [value] * 9 + [value * 9]
            return label + " " + " ".join(map(str, nine + nine + [value * 18]))

        def page(name, yards):
            return "\n".join([name, row("Par", 4), row("Blue", yards),
                              "Handicap " + " ".join(map(str, range(1, 19)))])

        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "pinned.pdf"
            path.write_bytes(b"pinned fixture")
            spec = {"format": "pdf", "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                    "page": 2, "pageHeading": "Wanted Course", "parWidth": [21],
                    "handicap": "Handicap", "handicapWidth": [18],
                    "tees": {"blue": {"label": "Blue", "width": [21]}}}
            with patch("subprocess.run") as extract:
                extract.return_value.stdout = page("Other Course", 410) + "\f" + page("W anted C ourse", 390)
                card = load_card(path, spec)
                self.assertEqual(card["tees"]["blue"]["yards"], [390] * 18)
                self.assertEqual(card["handicapMen"], list(range(1, 19)))
                with self.assertRaisesRegex(ValueError, "heading differs"):
                    load_card(path, {**spec, "page": 1})

    def test_disconnected_boundary_with_touching_cutouts(self):
        points = {
            "1": [(0, 0), (5, 0), (5, 5), (0, 5), (0, 0)],
            "2": [(7, 0), (9, 0), (9, 2), (7, 2), (7, 0)],
            "3": [(1, 1), (2, 1), (2, 2), (1, 2), (1, 1)],
            "4": [(2, 1), (3, 1), (3, 2), (2, 2), (2, 1)],
        }
        relation = ET.Element("relation")
        ways = {}
        nodes = {}
        for ref, ring in points.items():
            ET.SubElement(relation, "member", type="way", ref=ref, role="outer" if ref in ("1", "2") else "inner")
            ways[ref] = ET.Element("way")
            for i, point in enumerate(ring):
                node_id = ref + str(i)
                nodes[node_id] = point
                ET.SubElement(ways[ref], "nd", ref=node_id)
        boundary = GolfSnapshot.geometry(relation, "boundary", ways, nodes)
        self.assertTrue(boundary.is_valid)
        self.assertTrue(boundary.covers(Point(8, 1)))
        self.assertFalse(boundary.covers(Point(6, 1)))
        self.assertFalse(boundary.covers(Point(2, 1.5)))
        ET.SubElement(relation, "member", type="way", ref="3", role="inner")
        self.assertIsNone(GolfSnapshot.geometry(relation, "boundary", ways, nodes))

    def test_html_card_requires_order_and_exact_totals(self):
        rows = [
            ["Hole", *range(1, 10), "Out"], ["Par", *([4] * 9), 36],
            ["Blue", *([400] * 9), 3600], ["Hole", *range(10, 19), "In", "Total"],
            ["Par", *([4] * 9), 36, 72], ["Blue", *([400] * 9), 3600, 7200],
        ]

        def read(path):
            html = "<table>" + "".join("<tr>" + "".join(f"<td>{cell}</td>" for cell in row) + "</tr>"
                                       for row in rows) + "</table>"
            path.write_text(html)
            return load_card(path, {"sha256": hashlib.sha256(html.encode()).hexdigest(),
                                    "format": "html", "tees": {"blue": {"label": "Blue"}}})

        with tempfile.TemporaryDirectory() as temp:
            card = Path(temp) / "card.html"
            self.assertEqual(load := read(card)["tees"]["blue"]["yards"], [400] * 18)
            rows[-1][-1] = sum(load) + 1
            with self.assertRaisesRegex(ValueError, "subtotal or total"):
                read(card)
            rows[-1][-1] = sum(load)
            rows[3][1], rows[3][2] = rows[3][2], rows[3][1]
            with self.assertRaisesRegex(ValueError, "headings"):
                read(card)

    def test_pbf_snapshot_and_review_withhold_ambiguous_tees(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp)
            pbf = path / "golf.osm.pbf"
            with osmium.SimpleWriter(pbf) as writer:
                points = [
                    (-82.0, 28.0), (-81.99, 28.0), (-81.99, 28.01), (-82.0, 28.01),
                    (-81.999, 28.005), (-81.994, 28.005),
                    (-81.9995, 28.0045), (-81.9985, 28.0045), (-81.9985, 28.0055), (-81.9995, 28.0055),
                    (-81.9945, 28.0045), (-81.9935, 28.0045), (-81.9935, 28.0055), (-81.9945, 28.0055),
                    (-82.5, 28.005),
                ]
                for ref, point in enumerate(points, 1):
                    writer.add_node(osmium.osm.mutable.Node(id=ref, location=point))
                for ref, nodes, tags in [
                    (1, [1, 2, 3, 4, 1], {"leisure": "golf_course", "name": "Fixture Golf", "contact:email": "excluded@example.test"}),
                    (2, [5, 6], {"golf": "hole", "ref": "1", "par": "4", "name": "Blue Routing"}),
                    (3, [7, 8, 9, 10, 7], {"golf": "tee"}),
                    (4, [7, 8, 9, 10, 7], {"golf": "tee"}),
                    (5, [11, 12, 13, 14, 11], {"golf": "green"}),
                    (6, [15, 5], {"golf": "hole", "ref": "2"}),
                    (7, [5, 6], {"golf": "hole", "ref": "20", "name": "Other Routing"}),
                ]:
                    writer.add_way(osmium.osm.mutable.Way(id=ref, nodes=nodes, tags=tags))
            output = path / "snapshot.osm"
            snapshot(pbf, output, [-82.1, 27.9, -81.9, 28.1])
            xml = ET.parse(output).getroot()
            self.assertIsNone(xml.find("node[@id='15']"))
            self.assertIsNone(xml.find("way[@id='6']"))
            self.assertNotIn("contact:email", output.read_text())
            original = output.read_bytes()
            snapshot(pbf, output, [-82.1, 27.9, -81.9, 28.1])
            self.assertEqual(output.read_bytes(), original)
            data = GolfSnapshot(output)
            self.assertEqual(list(data.discover("fixture"))[0]["unique_numbered_routes"], 1)
            self.assertEqual(list(data.discover("fixture", 27))[0]["unique_numbered_routes"], 2)
            review, issues = data.review({"boundary": "w1", "osmName": "Fixture Golf", "mapRef": "fl/fixture"}, "fixture")
            extended, _ = data.review({"boundary": "w1", "osmName": "Fixture Golf",
                                       "mapRef": "fl/fixture", "holeCount": 27}, "fixture")
            self.assertEqual(len(review["holes"]), 18)
            self.assertEqual(extended["holes"][19]["route"], "7")
            self.assertEqual(review["holes"][0]["green"], ["w5"])
            self.assertNotIn("tee", review["holes"][0])
            self.assertIn({"hole": 1, "issue": "tee-ambiguous", "candidates": ["w3", "w4"]}, issues)
            self.assertIn({"hole": 2, "issue": "missing-route"}, issues)
            scoped, issues = data.review({"boundary": "w1", "osmName": "Fixture Golf",
                                           "mapRef": "fl/fixture", "routeName": "Blue Routing"}, "fixture")
            self.assertEqual(scoped["routeName"], "Blue Routing")
            self.assertEqual(scoped["holes"][0]["route"], "2")
            self.assertNotIn("green", scoped["holes"][0])
            self.assertIn({"hole": 1, "issue": "green-shared-endpoint", "candidates": ["w5"]}, issues)
            with self.assertRaisesRegex(ValueError, "boundary name"):
                data.review({"boundary": "w1", "osmName": "Other Fixture", "mapRef": "fl/fixture"}, "fixture")


if __name__ == "__main__":
    unittest.main()
