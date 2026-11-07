"""Fail Friday packaging when a relative HTML asset or ES module is missing."""
from pathlib import Path
import re
import sys

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("candidate")
errors = []
checked = 0
asset_pattern = re.compile(r"""(?:src|href)=["']([^"']+)["']""")
module_pattern = re.compile(r"""(?:import\s+(?:[^'"\n;]*?\s+from\s+)?|export\s+[^'"\n;]*?\s+from\s+|import\s*\()\s*['"]((?:\./|\.\./)[^'"]+)['"]""")

for source in root.rglob("*"):
    if not source.is_file():
        continue
    text = source.read_text(encoding="utf-8", errors="replace") if source.suffix in {".js", ".mjs", ".html"} else ""
    refs = []
    if source.suffix == ".html":
        refs += asset_pattern.findall(text)
    if source.suffix in {".js", ".mjs", ".html"}:
        refs += module_pattern.findall(text)
    for ref in refs:
        path = ref.split("?", 1)[0].split("#", 1)[0]
        if path in ('.', '..', './', '../') or not path or path.startswith(("http:", "https:", "//", "#", "data:", "blob:", "mailto:", "tel:", "javascript:", "/")):
            continue
        checked += 1
        if not (source.parent / path).resolve().is_file():
            errors.append(f"{source}: {ref}")

for error in errors:
    print(f"MISSING DEPENDENCY: {error}", file=sys.stderr)
print(f"Friday candidate: {checked} local references checked; {len(errors)} missing")
if errors:
    raise SystemExit(1)
