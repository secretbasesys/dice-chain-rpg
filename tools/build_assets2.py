#!/usr/bin/env python3
"""v7.1 art build: event plate illustrations, shopkeeper, portrait title.

raw : /workspace/assets_raw/dc2/<name>.png
out : work/dice-rpg/assets/<name>.webp
"""
import pathlib
from PIL import Image

RAW = pathlib.Path("/workspace/assets_raw/dc2")
OUT = pathlib.Path("/workspace/work/dice-rpg/assets")

EVENTS = ["gamble", "curse", "shrine", "trade", "explore", "forge", "danger"]


def cover(im, w, h, anchor=0.5):
    """Crop to the target aspect ratio, then resize (no distortion)."""
    tw, th = w / h, im.width / im.height
    if th > tw:
        nw = int(im.height * tw)
        x = int((im.width - nw) * 0.5)
        im = im.crop((x, 0, x + nw, im.height))
    else:
        nh = int(im.width / tw)
        y = int((im.height - nh) * anchor)
        im = im.crop((0, y, im.width, y + nh))
    return im.resize((w, h), Image.LANCZOS)


def save(im, name, q=80):
    p = OUT / (name + ".webp")
    im.save(p, "WEBP", quality=q, method=6)
    print(name, p.stat().st_size // 1024, "KB")
    return p


def main():
    for n in EVENTS:
        src = RAW / ("ev_" + n + ".png")
        if not src.exists():
            print("MISSING", src)
            continue
        im = Image.open(src).convert("RGB")
        im = cover(im, 900, 520)
        save(im, "ev_" + n, 76)
    sp = Image.open(RAW / "shopkeeper.png").convert("RGB")
    save(cover(sp, 420, 500, 0.42), "shopkeeper", 82)
    t2 = Image.open(RAW / "title2.png").convert("RGB")
    save(cover(t2, 900, 1600, 0.5), "title_portrait", 78)
    print("done")


if __name__ == "__main__":
    main()
