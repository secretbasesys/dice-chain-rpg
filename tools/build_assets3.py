#!/usr/bin/env python3
"""v7.7 art build: reward banners + dice material textures.

raw : /workspace/assets_raw/dc3/<name>.png
out : work/dice-rpg/assets/<name>.webp
"""
import pathlib
from PIL import Image, ImageFilter, ImageOps

RAW = pathlib.Path("/workspace/assets_raw/dc3")
OUT = pathlib.Path("/workspace/work/dice-rpg/assets")


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


def save(im, name, q=80):
    p = OUT / (name + ".webp")
    im.save(p, "WEBP", quality=q, method=6)
    print(name, p.stat().st_size // 1024, "KB")
    return p


def main():
    chest = Image.open(RAW / "rw_chest.png").convert("RGB")
    save(cover(chest, 900, 380, 0.5), "rw_chest", 74)
    altar = Image.open(RAW / "rw_altar.png").convert("RGB")
    save(cover(altar, 900, 380, 0.42), "rw_altar", 74)

    # dice materials: square, blurred a touch so they read at 56px, kept grayscale-ish
    tex = {
        "tex_bone": ("tex_bone.png", 0.0, 1.0),
        "tex_obsidian": ("tex_obsidian.png", 0.0, 1.0),
        "tex_brass": ("tex_brass2.png", 1.6, 1.0),
    }
    for name, (src, blur, _k) in tex.items():
        im = Image.open(RAW / src).convert("L")
        im = cover(im.convert("RGB"), 256, 256)
        if blur:
            im = im.filter(ImageFilter.GaussianBlur(blur))
        im = ImageOps.autocontrast(im, cutoff=1)
        save(im, name, 68)
    print("done")


if __name__ == "__main__":
    main()
