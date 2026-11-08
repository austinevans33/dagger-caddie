"""Reproduce a review crop from checksum-pinned Cloud Optimized GeoTIFF ranges."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import tempfile
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def checked_range(spec, cache, url=None):
    offset, length = spec["offset"], spec["length"]
    destination = cache / (spec["sha256"] + ".range")
    if destination.exists():
        data = destination.read_bytes()
    else:
        if url is None:
            raise ValueError(f"Missing cached range at byte {offset}")
        end = offset + length - 1
        # Give caches a distinct URL for each range. Authorization stays in memory.
        request = Request(
            f"{url}&dcc_range={offset}-{end}",
            headers={"Range": f"bytes={offset}-{end}"},
        )
        with urlopen(request, timeout=45) as response:
            actual = response.headers.get("Content-Range", "").split("/")[0]
            if response.status != 206 or actual != f"bytes {offset}-{end}":
                raise ValueError(f"Server returned a different range for byte {offset}")
            data = response.read(length + 1)
    if len(data) != length or hashlib.sha256(data).hexdigest() != spec["sha256"]:
        raise ValueError(f"Byte range checksum differs at offset {offset}")
    if not destination.exists():
        destination.write_bytes(data)
    return offset, data


def recover_crop(manifest, cache, output, download):
    from PIL import Image
    import rasterio
    from rasterio.windows import Window

    url = None
    if download:
        source = manifest["source"]
        asset = urlsplit(source)
        account = (asset.hostname or "").split(".")[0]
        container = asset.path.lstrip("/").partition("/")[0]
        if asset.scheme != "https" or asset.hostname != account + ".blob.core.windows.net" or not container or asset.query:
            raise ValueError("Expected an unsigned HTTPS Azure Blob asset")
        with urlopen(
            f"https://planetarycomputer.microsoft.com/api/sas/v1/token/{account}/{container}",
            timeout=30,
        ) as response:
            token = json.load(response)["token"].lstrip("?")
        url = f"{source}?{token}"
    cache.mkdir(parents=True, exist_ok=True)
    ranges = [manifest["header"], *manifest["tiles"]]
    with tempfile.TemporaryDirectory(prefix="dcc-imagery-") as scratch:
        partial = Path(scratch) / "source.tif"
        with partial.open("wb") as sparse, ThreadPoolExecutor(max_workers=6) as workers:
            for offset, data in workers.map(lambda item: checked_range(item, cache, url), ranges):
                sparse.seek(offset)
                sparse.write(data)
        left, top, right, bottom = manifest["crop"]
        window = Window(left, top, right - left, bottom - top)
        with rasterio.open(partial) as dataset:
            if dataset.crs.to_epsg() != manifest["epsg"]:
                raise ValueError("Source CRS differs from manifest")
            transform = list(dataset.window_transform(window))[:6]
            if any(abs(a - b) > 0.000001 for a, b in zip(transform, manifest["affine"], strict=True)):
                raise ValueError("Crop transform differs from manifest")
            bands = dataset.read((1, 2, 3), window=window).transpose(1, 2, 0)
            projection = dataset.crs.to_wkt()
        if hashlib.sha256(bands.tobytes()).hexdigest() != manifest["rgbSha256"]:
            raise ValueError("Decoded RGB crop checksum differs from manifest")
        Image.fromarray(bands).save(output)
        output.with_suffix(".prj").write_text(projection + "\n")
        output.with_suffix(".pgw").write_text(
            "\n".join(map(str, [
                transform[0], transform[3], transform[1], transform[4],
                transform[2] + (transform[0] + transform[1]) / 2,
                transform[5] + (transform[3] + transform[4]) / 2,
            ])) + "\n"
        )
    print(f"{right-left} × {bottom-top} px, EPSG:{manifest['epsg']}, pinned RGB checksum verified")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path)
    parser.add_argument("cache", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if args.output.suffix.lower() != ".png":
        parser.error("output must have a .png extension")
    try:
        recover_crop(json.loads(args.manifest.read_text()), args.cache, args.output, args.download)
    except (ValueError, OSError) as error:
        # URLs from network exceptions can contain a short-lived SAS token.
        parser.exit(1, f"Crop failed: {str(error).split('?')[0]}\n")


if __name__ == "__main__":
    main()
