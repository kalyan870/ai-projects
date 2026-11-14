import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "llm"))
from metadata import parse_metadata


class ParseMetadataTests(unittest.TestCase):
    def test_accepts_mapping_and_json(self):
        self.assertEqual(parse_metadata({"file": "main.py"}), {"file": "main.py"})
        self.assertEqual(parse_metadata('{"file":"main.py"}'), {"file": "main.py"})

    def test_accepts_legacy_python_literal(self):
        self.assertEqual(parse_metadata("{'file': 'main.py'}"), {"file": "main.py"})

    def test_rejects_malformed_or_non_mapping_values(self):
        self.assertEqual(parse_metadata("not metadata"), {})
        self.assertEqual(parse_metadata("['not', 'a', 'mapping']"), {})
        self.assertEqual(parse_metadata(None), {})

    def test_never_executes_serialized_input(self):
        marker = Path(__file__).with_name("should-not-exist")
        payload = "__import__('pathlib').Path(" + repr(str(marker)) + ").touch()"
        self.assertEqual(parse_metadata(payload), {})
        self.assertFalse(marker.exists())


if __name__ == "__main__":
    unittest.main()
