#!/usr/bin/env python3
"""v7.8 art build: per-event illustrations (900x520 plate).
raw : /workspace/assets_raw/dc3/ev2_<name>.png
out : work/dice-rpg/assets/ev2_<name>.webp
"""
import pathlib
from PIL import Image

RAW = pathlib.Path("/workspace/assets_raw/dc3")
OUT = pathlib.Path("/workspace/work/dice-rpg/assets")
NAMES = ["altar", "mirror", "spring", "forgespirit", "cursedsword", "starfall"]


def cover(im, w, h, anchor=0.5):
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


def main():
    for n in NAMES:
        src = RAW / ("ev2_" + n + ".png")
        if not src.exists():
            print("MISSING", src); continue
        im = cover(Image.open(src).convert("RGB"), 900, 520, 0.5)
        p = OUT / ("ev2_" + n + ".webp")
        im.save(p, "WEBP", quality=75, method=6)
        print(n, p.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
