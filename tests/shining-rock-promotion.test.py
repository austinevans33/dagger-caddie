"""The successor gate rejects modified course, Ghost, money and brand bytes."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("promotion", "scripts/production-bundle.py")
promotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promotion)


class SuccessorIntegrity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.expected = promotion.expected_files()

    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.site = Path(self.folder.name)
        files = dict(self.expected)
        files.update({path: promotion.object_bytes(promotion.LEGACY, path)
                      for path in promotion.ROOT_ASSETS})
        for name, content in files.items():
            path = self.site / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)

    def test_exact_successor_passes(self):
        promotion.verify(self.site, self.expected)

    def test_modified_release_surfaces_fail(self):
        for name in ["index.html",
                     "app/61f9e9de0a/founders-verified-scorecards.js",
                     "app/61f9e9de0a/money-room.js",
                     "app/61f9e9de0a/clubhouse-home.js"]:
            with self.subTest(path=name):
                path = self.site / name
                original = path.read_bytes()
                path.write_bytes(original + b"\n// unreviewed change")
                with self.assertRaisesRegex(AssertionError, "Bundle differs"):
                    promotion.verify(self.site, self.expected)
                path.write_bytes(original)

    def test_staging_config_cannot_enter_public_tree(self):
        (self.site / "accidental-config.js").write_bytes(promotion.STAGE_PROJECT)
        with self.assertRaisesRegex(AssertionError, "Staging Firebase"):
            promotion.verify(self.site, self.expected)

    def test_brand_asset_change_fails(self):
        (self.site / "dcc-approved-seal.png").write_bytes(b"replacement")
        with self.assertRaisesRegex(AssertionError, "Legacy asset differs"):
            promotion.verify(self.site, self.expected)


if __name__ == "__main__":
    unittest.main()
