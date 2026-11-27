#!/usr/bin/env python3
"""v7.10 — new enemy sprites from black-background renders."""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from PIL import Image
from cutout import cutout

RAW = pathlib.Path("/workspace/assets_raw/dc3")
OUT = pathlib.Path("/workspace/work/dice-rpg/assets")
NAMES = {"mirrorGolem": False, "chainHunter": False}
CLASSES = ["monk"]


def main():
    for n, big in NAMES.items():
        src = RAW / (n + ".png")
        if not src.exists():
            print("MISSING", src); continue
        sp = cutout(Image.open(src).convert("RGB"))
        bb = sp.getbbox()
        if bb:
            sp = sp.crop(bb)
        maxdim = 480 if big else 400
        k = maxdim / max(sp.size)
        sp = sp.resize((max(1, round(sp.width * k)), max(1, round(sp.height * k))), Image.LANCZOS)
        p = OUT / ("e_" + n + ".webp")
        sp.save(p, "WEBP", quality=58, method=6, alpha_quality=70)
        print("enemy", n, p.stat().st_size // 1024, "KB", sp.size)
    for n in CLASSES:
        src = RAW / (n + ".png")
        if not src.exists():
            print("MISSING", src); continue
        im = Image.open(src).convert("RGB")
        w, h = im.size
        # 4:5 portrait crop from the top
        tr = 4 / 5
        if w / h > tr:
            nw = int(h * tr); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else:
            nh = int(w / tr); im = im.crop((0, 0, w, min(h, nh)))
        im = im.resize((480, 600), Image.LANCZOS)
        p = OUT / ("c_" + n + ".webp")
        im.save(p, "WEBP", quality=84, method=6)
        print("class", n, p.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
