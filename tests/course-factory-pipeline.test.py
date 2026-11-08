"""Network-free tests for the Florida Course Factory source adapters."""
import hashlib
from pathlib import Path
import runpy
import tempfile
import unittest
import xml.etree.ElementTree as ET

import osmium

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
load_card = runpy.run_path(str(SCRIPTS / "course-factory-card.py"))["load_card"]
snapshot = runpy.run_path(str(SCRIPTS / "course-factory-snapshot.py"))["snapshot"]
GolfSnapshot = runpy.run_path(str(SCRIPTS / "course-factory-review.py"))["GolfSnapshot"]


class CourseFactoryPipeline(unittest.TestCase):
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
                    (2, [5, 6], {"golf": "hole", "ref": "1", "par": "4"}),
                    (3, [7, 8, 9, 10, 7], {"golf": "tee"}),
                    (4, [7, 8, 9, 10, 7], {"golf": "tee"}),
                    (5, [11, 12, 13, 14, 11], {"golf": "green"}),
                    (6, [15, 5], {"golf": "hole", "ref": "2"}),
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
            review, issues = data.review({"boundary": "w1", "osmName": "Fixture Golf", "mapRef": "fl/fixture"}, "fixture")
            self.assertEqual(review["holes"][0]["green"], ["w5"])
            self.assertNotIn("tee", review["holes"][0])
            self.assertIn({"hole": 1, "issue": "tee-ambiguous", "candidates": ["w3", "w4"]}, issues)
            self.assertIn({"hole": 2, "issue": "missing-route"}, issues)
            with self.assertRaisesRegex(ValueError, "boundary name"):
                data.review({"boundary": "w1", "osmName": "Other Fixture", "mapRef": "fl/fixture"}, "fixture")


if __name__ == "__main__":
    unittest.main()
