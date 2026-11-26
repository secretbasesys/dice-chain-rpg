#!/usr/bin/env python3
"""Trim a black-background render into a transparent, square sprite.

luminance -> alpha, then un-premultiply so the subject keeps its colour when
composited straight onto the game's dark background art.
"""
import numpy as np
from PIL import Image, ImageFilter


def cutout(im, lo=0.012, hi=0.05, gamma=1.0, feather=0.8):
    """im: RGB PIL, black background -> RGBA with straight alpha."""
    a = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    lum = a.max(axis=2)
    al = np.clip((lum - lo) / max(1e-4, hi - lo), 0.0, 1.0) ** gamma
    al = np.asarray(Image.fromarray((al * 255).astype(np.uint8)).filter(
        ImageFilter.GaussianBlur(feather))).astype(np.float32) / 255.0
    rgb = np.clip(a / np.maximum(al[..., None], 1e-3), 0.0, 1.0)
    out = np.dstack([rgb, al])
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def square(im, size, pad=0.05, anchor="bottom"):
    """Fit trimmed sprite into a square canvas, aligned to the feet."""
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)
    w, h = im.size
    side = int(max(w, h) * (1 + pad * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    x = (side - w) // 2
    y = int(side - h - side * pad) if anchor == "bottom" else (side - h) // 2
    canvas.alpha_composite(im, (max(0, x), max(0, y)))
    return canvas.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    import sys
    im = Image.open(sys.argv[1])
    out = square(cutout(im), 512)
    out.save(sys.argv[2])
    print("ok", out.size)
