#!/usr/bin/env python3
"""Qualify the exact course-data successor while preserving the Pages origin and backend."""
import argparse
import json
from pathlib import Path
import re
import subprocess
from time import time_ns
from urllib.request import Request, urlopen

STAGED = "61f9e9de0a3a7950ce28f223541cdd12f897b5d8"
# Historical Clubhouse hotfixes are part of the exact successor pin below.
HOTFIX_FILES = frozenset({"app/61f9e9de0a/clubhouse-home.js", "app/61f9e9de0a/clubhouse-home.css"})
LEGACY = "390b501ffd0b923c6b009ca70509e32319b2e032"
# Reviewable successor pin. Every changed runtime byte comes from this immutable source.
SUCCESSOR = "d9bc012add5d3ffddf292eb19351d3a49130c77c"
PRE_RELEASE = "8a07777e19c26529d1adccbc0296961977e7b3a4"
KINGDOM_SOURCE = "227f400e0c358c6abda06f70fa5efa17b6e712dd"
GAMEPLAY_SOURCE = "3dea266061f954e05be0c45750dea4c3cae8d515"
HEART_SOURCE = "ddbbba10ebad1e71d6105a221581b4a7e63a87f1"
VERDAE_SOURCE = "8701933596c6abc0f7861e182a0214e8c187966b"
SUCCESSOR_FILES = frozenset({
    "index.html",
    "yardage-preview.html",
    "ghost-preview.html",
    "app/61f9e9de0a/course-art/shining-rock-northbridge-ma.json",
    "app/61f9e9de0a/founders-verified-scorecards.js",
    "app/61f9e9de0a/hole-sketch.js",
    "app/61f9e9de0a/yardage-live.js",
    "app/61f9e9de0a/money-room.js",
    "app/61f9e9de0a/ghost-partial-archive.js",
})

SUCCESSOR_NEW_FILES = frozenset({"app/61f9e9de0a/course-art/shining-rock-northbridge-ma.json"})

# Exact runtime delta from the integrated, reviewable source commit.
KINGDOM_REPLACEMENTS = frozenset({
    "index.html",
    "ghost-preview.html",
    "app/61f9e9de0a/founders-verified-scorecards.js",
    "app/61f9e9de0a/house-ghost-ledger.js",
    "app/61f9e9de0a/house-ghost-playback.js",
    "app/61f9e9de0a/house-ghost-round.js",
    "app/61f9e9de0a/ledger-settlement.js",
    "app/61f9e9de0a/solo-scorecard.js",
})
KINGDOM_ADDITIONS = frozenset({
    "app/61f9e9de0a/course-factory-acquisition.js",
    "app/61f9e9de0a/course-factory-batch.js",
    "app/61f9e9de0a/round-hole-order.js",
})

GAMEPLAY_REPLACEMENTS = frozenset({
    "index.html",
    "app/61f9e9de0a/ghost-partial-archive.js",
    "app/61f9e9de0a/ledger-settlement.js",
    "app/61f9e9de0a/paper-to-game-prefill.js",
    "app/61f9e9de0a/solo-scorecard-ui.js",
    "app/61f9e9de0a/solo-scorecard.js",
    "app/61f9e9de0a/starters-desk-ui.js",
})

HEART_ADDITIONS = frozenset({
    "app/61f9e9de0a/all-heart-inround.js",
    "app/61f9e9de0a/all-heart-journal.js",
    "app/61f9e9de0a/all-heart-moment-card.js",
    "app/61f9e9de0a/all-heart-moments.js",
    "app/61f9e9de0a/all-heart-receipts.js",
    "app/61f9e9de0a/legendary-adaptations.js",
    "app/61f9e9de0a/matchbook.js",
})
HEART_REPLACEMENT = "app/61f9e9de0a/solo-scorecard-ui.js"

LIVE = "https://austinevans33.github.io/dagger-caddie/"
PREFIX = "app/" + STAGED[:10] + "/"
PAGES = ("index.html", "yardage-preview.html", "ghost-preview.html", "19th-hole.html")
ROOT_ASSETS = ("manifest.json", "firebase-config.js", "profile.json", "dcc-approved-seal.png",
               "dcc-original-emblem.png", "dcc-approved-header-clean.png", "dcc-icon-192.png",
               "dcc-icon-512.png", "dcc-icon-1024.png")
SHARED = ("yardage-book.js", "yardage-selection.js", "round-yardage-transition.js", "house-ghost-trail.js",
          "house-ghost-round.js", "house-ghost-ledger.js", "house-ghost-playback.js", "round-receipt.js")
STAGE_PROJECT = b"dagger-country-club-staging"
EXCLUDED = ("playtest", "functions", "tests", "qa-scorecard", "docs", "scripts", "firebase.json", "firestore.rules")

# Keep browser navigation, PWA assets and storage on the original document URL.
ASSET = re.compile(r"""(?P<head>\b(?:src|href)\s*=\s*|\bfrom\s+|\bimport\s*\(\s*)(?P<quote>['"])(?:\.\.?/)?(?P<file>[\w-]+\.(?:js|css)(?:\?[^'"]*)?)(?P=quote)""")
RYDER = re.compile(rb" \{\n  id:'ryder-fort-bragg-nc',.*?\n \},\n", re.S)


def git(*args):
    return subprocess.check_output(("git", *args))


def object_bytes(ref, path):
    return git("show", f"{ref}:{path}")


def expected_files():
    root_config = object_bytes(LEGACY, "firebase-config.js")
    bundle = {PREFIX + "firebase-config.js": root_config}
    for source in git("ls-tree", "-r", "--name-only", STAGED, "playtest").decode().splitlines():
        path = source.removeprefix("playtest/")
        if path in PAGES:
            html = object_bytes(STAGED, source).decode()
            html = ASSET.sub(lambda m: m["head"] + m["quote"] + "./" + PREFIX + m["file"] + m["quote"], html)
            bundle[path] = html.encode()
        elif path != "firebase-config.js" and (
                ("/" not in path and path.endswith((".js", ".css"))) or
                (path.startswith("course-art/") and path.endswith(".json")) or
                path in ("vendor/qrcode-generator.js", "vendor/qrcode-generator.LICENSE.txt")):
            content = object_bytes(STAGED, source)
            if path == "yardage-live.js":
                assert content.count(b"../yardage-book.js") == 1
                content = content.replace(b"../yardage-book.js", b"./yardage-book.js")
            if path == "founders-verified-scorecards.js":
                content, count = RYDER.subn(b"", content)
                assert count == 1, "Expected exactly one unverified Ryder record"
            bundle[PREFIX + path] = content
    for path in SHARED:
        bundle[PREFIX + path] = object_bytes(STAGED, path)
    bundle[PREFIX + "source-sha.txt"] = (STAGED + "\n").encode()
    # Previously allowed Clubhouse hotfixes are now also pinned and compared byte for byte.
    for path in SUCCESSOR_FILES | HOTFIX_FILES:
        assert path in bundle or path in SUCCESSOR_NEW_FILES, f"Successor cannot introduce an unrelated runtime file: {path}"
        bundle[path] = object_bytes(SUCCESSOR, path)
    for path in (PREFIX + "south-carolina-course-factory.js", PREFIX + "opengolf-catalog.js"):
        assert path in bundle
        bundle[path] = object_bytes(VERDAE_SOURCE, path)
    assert KINGDOM_REPLACEMENTS <= bundle.keys()
    assert KINGDOM_ADDITIONS.isdisjoint(bundle)
    for path in KINGDOM_REPLACEMENTS | KINGDOM_ADDITIONS:
        bundle[path] = object_bytes(KINGDOM_SOURCE, path)
    assert GAMEPLAY_REPLACEMENTS <= bundle.keys()
    for path in GAMEPLAY_REPLACEMENTS:
        bundle[path] = object_bytes(GAMEPLAY_SOURCE, path)
    assert HEART_REPLACEMENT in bundle and HEART_ADDITIONS.isdisjoint(bundle)
    for path in HEART_ADDITIONS | {HEART_REPLACEMENT}:
        bundle[path] = object_bytes(HEART_SOURCE, path)
    bundle[PREFIX + "source-sha.txt"] = (HEART_SOURCE + "\n").encode()
    assert all(STAGE_PROJECT not in value for value in bundle.values())
    return bundle


def verify(directory, expected):
    for path, value in expected.items():
        assert (directory / path).read_bytes() == value, f"Bundle differs: {path}"
    actual = {str(path.relative_to(directory)) for path in (directory / PREFIX).rglob("*") if path.is_file()}
    assert actual == {p for p in expected if p.startswith(PREFIX)}, "Unexpected release runtime files"
    for asset in ROOT_ASSETS:
        assert (directory / asset).read_bytes() == object_bytes(LEGACY, asset), f"Legacy asset differs: {asset}"
    assert json.loads((directory / "manifest.json").read_text())["start_url"] == "./index.html"
    assert not any((directory / path).exists() for path in EXCLUDED), "Excluded source is publicly served"
    for file in directory.rglob("*"):
        if file.is_file() and file.suffix in (".js", ".json", ".html", ".css", ".txt"):
            assert STAGE_PROJECT not in file.read_bytes(), f"Staging Firebase reference in {file}"
    print(f"Validated {len(expected)} release files, {len(ROOT_ASSETS)} unchanged launch/config assets and public Firebase separation.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", type=Path, metavar="CHECKOUT")
    mode.add_argument("--check", type=Path, metavar="CHECKOUT")
    mode.add_argument("--verify-site", type=Path, metavar="PAGES_OUTPUT")
    mode.add_argument("--verify-live", action="store_true")
    mode.add_argument("--verify-rollback", action="store_true")
    args = parser.parse_args()
    expected = expected_files()
    if args.write:
        for path, value in expected.items():
            dest = args.write / path
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(value)
    elif args.check:
        for path, value in expected.items():
            assert (args.check / path).read_bytes() == value, f"Checkout differs: {path}"
        for path in ROOT_ASSETS:
            assert (args.check / path).read_bytes() == object_bytes(LEGACY, path), f"Legacy asset differs: {path}"
    elif args.verify_site:
        verify(args.verify_site, expected)
    else:
        live_paths = {name: object_bytes(LEGACY, name) for name in ROOT_ASSETS}
        if args.verify_rollback:
            baseline_paths = set(git("ls-tree", "-r", "--name-only", PRE_RELEASE).decode().splitlines())
            live_paths.update({path: object_bytes(PRE_RELEASE, path) for path in expected if path in baseline_paths})
            live_paths[""] = live_paths["index.html"]
        else:
            live_paths.update(expected)
            live_paths[""] = expected["index.html"]
        nonce = time_ns()
        for path, value in live_paths.items():
            request = Request(f"{LIVE}{path}?dcc-verify={nonce}", headers={"Cache-Control": "no-cache"})
            with urlopen(request, timeout=20) as response:
                assert response.read(len(value) + 1) == value, f"Live Pages differs: {path or '/'}"
        print(f"Verified {len(live_paths)} hosted assets against the {'rollback' if args.verify_rollback else 'promotion'} bytes.")


if __name__ == "__main__":
    main()
