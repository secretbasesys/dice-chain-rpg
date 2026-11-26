#!/usr/bin/env python3
"""Build web assets (webp) for 다이스 체인 v7 from raw generated art.

raw : /workspace/assets_raw/dc/<name>.png
out : work/dice-rpg/assets/<name>.webp
"""
import pathlib, sys
from PIL import Image, ImageFilter
from cutout import cutout, square

RAW = pathlib.Path("/workspace/assets_raw/dc")
OUT = pathlib.Path("/workspace/work/dice-rpg/assets")
OUT.mkdir(parents=True, exist_ok=True)

ENEMIES = ("slime rat goblin bat wolf mushroom beetle moth skeleton spider gargoyle shaman "
           "wraith cultist sentry knight imp shadow serpent berserker voidmaw hound ogre "
           "golem wyvern queen lich dicelord abyssEye devourer gamblerKing").split()
CLASSES = ("warrior mage gambler alchemist paladin").split()
BGS = {"bg1": "act1", "bg2": "act2", "bg3": "act3", "bg4": "abyss"}


def content_bbox(im, thr=9):
    g = im.convert("L")
    # downscale for speed, then scale box back
    small = g.resize((im.width // 3, im.height // 3), Image.BILINEAR)
    px = small.load()
    W, H = small.size
    minx, miny, maxx, maxy = W, H, -1, -1
    for y in range(H):
        for x in range(W):
            if px[x, y] > thr:
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if maxx < 0:
        return (0, 0, im.width, im.height)
    return (minx * 3, miny * 3, min(maxx * 3 + 3, im.width), min(maxy * 3 + 3, im.height))


def square_fit(im, size, pad=0.06, anchor="bottom"):
    box = content_bbox(im)
    im = im.crop(box)
    w, h = im.size
    side = int(max(w, h) * (1 + pad * 2))
    canvas = Image.new("RGB", (side, side), (0, 0, 0))
    x = (side - w) // 2
    y = side - h - int(side * pad) if anchor == "bottom" else (side - h) // 2
    canvas.paste(im, (max(0, x), max(0, y)))
    return canvas.resize((size, size), Image.LANCZOS)


def save(im, name, q=82):
    p = OUT / (name + ".webp")
    if im.mode == "RGBA":
        im.save(p, "WEBP", quality=q, method=6, alpha_quality=70)
    else:
        im.save(p, "WEBP", quality=q, method=6)
    return p


def main():
    total = 0
    for n in ENEMIES:
        src = RAW / (n + ".png")
        if not src.exists():
            print("MISSING", n); continue
        im = Image.open(src).convert("RGB")
        big = n in ("queen", "lich", "dicelord", "abyssEye", "devourer", "gamblerKing")
        # 검은 배경 → 투명 스프라이트 (비율 유지: 배경 아트 위에 바로 얹힌다)
        sp = cutout(im)
        bb = sp.getbbox()
        if bb:
            sp = sp.crop(bb)
        maxdim = 480 if big else 400
        k = maxdim / max(sp.size)
        sp = sp.resize((max(1, round(sp.width * k)), max(1, round(sp.height * k))), Image.LANCZOS)
        p = save(sp, "e_" + n, 58)
        total += p.stat().st_size
        print("enemy", n, p.stat().st_size // 1024, "KB")
    for n in CLASSES:
        src = RAW / (n + ".png")
        if not src.exists():
            print("MISSING", n); continue
        im = Image.open(src).convert("RGB")
        box = content_bbox(im)
        im = im.crop(box)
        # portrait 4:5, keep full body
        w, h = im.size
        target_ratio = 4 / 5
        if w / h > target_ratio:
            nw = int(h * target_ratio); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
        else:
            nh = int(w / target_ratio); im = im.crop((0, 0, w, min(h, nh)))
        im = im.resize((480, 600), Image.LANCZOS)
        p = save(im, "c_" + n, 84)
        total += p.stat().st_size
        print("class", n, p.stat().st_size // 1024, "KB")
    for k, v in BGS.items():
        src = RAW / (k + ".png")
        im = Image.open(src).convert("RGB")
        im = im.resize((1440, 810), Image.LANCZOS)
        im = Image.eval(im, lambda x: min(255, int(x * 1.18 + 4)))
        p = save(im, "bg_" + v, 74)
        total += p.stat().st_size
        print("bg", v, p.stat().st_size // 1024, "KB")
    im = Image.open(RAW / "title.png").convert("RGB").resize((1600, 900), Image.LANCZOS)
    p = save(im, "title", 80)
    total += p.stat().st_size
    print("title", p.stat().st_size // 1024, "KB")
    print("TOTAL %.2f MB" % (total / 1024 / 1024))


if __name__ == "__main__":
    main()
