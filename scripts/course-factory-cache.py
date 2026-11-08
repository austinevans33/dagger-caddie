#!/usr/bin/env python3
"""Fetch only pinned, reviewed club cards into an offline cache, at most once per pin."""
import argparse
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

MAX_CARD_BYTES = 20 * 1024 * 1024


def cache_card(course, directory):
    spec = course["scorecard"]
    digest = spec["sha256"]
    url = urlsplit(spec["url"])
    key = course["id"]
    if (not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", key)
            or not re.fullmatch(r"[a-f0-9]{64}", digest)
            or url.scheme != "https" or not url.hostname or url.username or url.password):
        raise ValueError("invalid pinned card identity, digest or URL")
    path = directory / key
    if path.exists():
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise ValueError("cached bytes differ from the pin; preserve them and choose a fresh cache")
        return "cache hit"

    request = Request(spec["url"], headers={"User-Agent": "Dagger Country Club Course Factory/1.0"})
    with urlopen(request, timeout=30) as response:
        final_url = urlsplit(response.geturl())
        if final_url.scheme != "https":
            raise ValueError("card redirected outside HTTPS")
        content = response.read(MAX_CARD_BYTES + 1)
    if len(content) > MAX_CARD_BYTES or hashlib.sha256(content).hexdigest() != digest:
        raise ValueError("download exceeds the size cap or differs from the reviewed pin")
    # Exclusive creation leaves existing reviewed cache entries intact.
    with path.open("xb") as handle:
        handle.write(content)
    return "cached"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("cache", type=Path)
    args = parser.parse_args()
    args.cache.mkdir(parents=True, exist_ok=True)
    failed = False
    for course in json.loads(args.manifest.read_text())["courses"]:
        if not course.get("scorecard", {}).get("format"):
            continue
        try:
            print(f"{course['id']}: {cache_card(course, args.cache)}")
        except (OSError, ValueError) as error:
            print(f"{course['id']}: {error}")
            failed = True
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
