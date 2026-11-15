"""Tests for the pinned scorecard cache CLI without geometry dependencies."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"


class ScorecardCache(unittest.TestCase):
    def test_targeted_offline_scorecard_cache_checks_main_and_additional_pins(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            pin = {"format": "html", "url": "https://example.com/card",
                   "sha256": hashlib.sha256(b"card").hexdigest()}
            manifest = directory / "manifest.json"
            manifest.write_text(json.dumps({"courses": [
                {"id": "priority", "scorecard": {**pin, "additionalSources": [{**pin, "suffix": "back"}]}},
                {"id": "other", "scorecard": pin},
            ]}))
            (directory / "priority").write_bytes(b"card")
            cmd = [sys.executable, str(SCRIPTS / "course-factory-cache.py"), str(manifest), str(directory),
                   "--offline", "--course", "priority"]
            missing = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(missing.returncode, 1)
            self.assertIn("missing pinned card", missing.stdout)
            (directory / "priority-back").write_bytes(b"card")
            result = subprocess.run(cmd, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn("priority-back: cache hit", result.stdout)
            self.assertNotIn("other:", result.stdout)
            unknown = subprocess.run([*cmd, "--course", "typo"], capture_output=True, text=True)
            self.assertEqual(unknown.returncode, 2)
            self.assertIn("unknown course selection", unknown.stderr)


if __name__ == "__main__":
    unittest.main()
