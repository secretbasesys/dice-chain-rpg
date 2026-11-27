#!/usr/bin/env python3
"""v7.10 — new enemy sprites from black-background renders."""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from PIL import Image
from cutout import cutout

RAW = pathlib.Path("/workspace/assets_raw/dc3")
OUT = pathlib.Path("/workspace/work/dice-rpg/assets")
NAMES = {"mirrorGolem": False, "chainHunter": False}


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


if __name__ == "__main__":
    main()
