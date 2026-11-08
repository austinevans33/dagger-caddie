#!/usr/bin/env python3
"""Read hole-numbered facts from locally cached, reviewed official scorecards."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess

NUMBER = re.compile(r"(?<![\w./])(?:\d{1,3}(?:,\d{3})+|\d+)(?![\w./])")


class TableRows(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows = []
        self.row = self.cell = None

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        if tag in {"td", "th"} and self.row is not None:
            self.cell = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = None
        if tag == "tr" and self.row:
            self.rows.append(self.row)
            self.row = None


def validate_nines(rows, totals):
    if len(rows) == 1 and len(rows[0]) == 21:
        rows = [rows[0][:10], rows[0][10:]]
    if len(rows) != 2 or any(len(row) < 9 for row in rows):
        raise ValueError("expected one complete row for each nine")
    front, back = rows
    values = front[:9] + back[:9]
    if totals and (len(front) != 10 or len(back) not in (10, 11) or
                   sum(front[:9]) != front[9] or sum(back[:9]) != back[9] or
                   (len(back) == 11 and sum(values) != back[10])):
        raise ValueError("published subtotal or total differs from hole values")
    return values


def load_card(path, spec):
    if hashlib.sha256(path.read_bytes()).hexdigest() != spec["sha256"]:
        raise ValueError("official scorecard checksum differs")
    if spec["format"] == "html":
        table = TableRows()
        table.feed(path.read_text(encoding="utf-8"))
        headers = [[int(value) for value in cells if value.isdecimal()]
                   for label, *cells in table.rows if label.casefold() == "hole"]
        if headers != [list(range(1, 10)), list(range(10, 19))]:
            raise ValueError("official HTML hole headings are missing, reordered or ambiguous")

        def read(label, *_):
            return [[int(value.replace(",", "")) for value in cells if NUMBER.fullmatch(value)]
                    for title, *cells in table.rows if title.casefold() == label.casefold() and len(cells) >= 9]
    elif spec["format"] == "pdf":
        content = subprocess.run(["pdftotext", "-layout", str(path), "-"], check=True,
                                 capture_output=True, text=True).stdout

        def read(label, width, skip=0, unlabeled_back=None):
            start = re.compile(r"^\s*(?:\d+\.\d+/\d+\s+)?" + re.escape(label) + r"\s+", re.IGNORECASE)
            rows = []
            for line in content.splitlines():
                match = start.match(line)
                if match:
                    numbers = [int(value.replace(",", "")) for value in NUMBER.findall(line[match.end():])]
                    if len(numbers) >= min(width):
                        if isinstance(skip, list):
                            offset = skip[len(rows)]
                        else:
                            offset = skip
                        count = width[len(rows)] if len(rows) < len(width) else 0
                        rows.append(numbers[offset:offset + count])
            if unlabeled_back is not None and len(rows) == 1:
                page = content.split("\f")[unlabeled_back["page"] - 1]
                line = [line for line in page.splitlines() if line.strip()][unlabeled_back["line"]]
                numbers = [int(value.replace(",", "")) for value in NUMBER.findall(line)]
                rows.append([numbers[index] for index in unlabeled_back["columns"]])
            return rows
    elif spec["format"] == "reviewed-image":
        # Structured facts are independently checked against the pinned club image.
        # OCR guesses never enter the catalog.
        if not spec.get("reviewNote"):
            raise ValueError("image transcription requires review evidence")

        def read(label, *_):
            return spec["reviewedRows"].get(label, [])
    else:
        raise ValueError("unsupported official scorecard format")
    par = validate_nines(read(spec.get("parLabel", "Par"), spec.get("parWidth", [10, 11]),
                               0, spec.get("parUnlabeledBack")), True)
    if any(value < 3 or value > 6 for value in par):
        raise ValueError("invalid per-hole par")
    tees = {}
    for tee_id, config in spec["tees"].items():
        yards = validate_nines(read(config["label"], config.get("width", [10, 11]),
                                     config.get("skip", 0), config.get("unlabeledBack")), True)
        if any(not 50 <= value <= 800 for value in yards):
            raise ValueError(f"invalid yardage on {tee_id}")
        if "total" in config and sum(yards) != config["total"]:
            raise ValueError(f"{tee_id} differs from independently checked published total")
        tees[tee_id] = {"label": config.get("name", config["label"]), "yards": yards}
    if not tees:
        raise ValueError("no complete official tee")
    card = {"par": par, "tees": tees}
    if "handicap" in spec:
        handicap = validate_nines(read(spec["handicap"], [9, 9]), False)
        if sorted(handicap) != list(range(1, 19)):
            raise ValueError("stroke indexes must use 1 through 18 once")
        card["handicapMen"] = handicap
    return card


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("cache", type=Path)
    args = parser.parse_args()
    output = {}
    for course in json.loads(args.manifest.read_text())["courses"]:
        spec = course.get("scorecard")
        try:
            if not spec or not spec.get("format"):
                raise ValueError((spec or {}).get("blocker", "official scorecard has not been matched"))
            output[course["id"]] = {"card": load_card(args.cache / course["id"], spec)}
        except (OSError, ValueError, IndexError, subprocess.CalledProcessError) as error:
            output[course["id"]] = {"issue": str(error)}
    print(json.dumps(output))


if __name__ == "__main__":
    main()
