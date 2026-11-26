#!/usr/bin/env python3
"""Build a single-file playable HTML from the modular source.

Art (assets/*.webp) is embedded as data URIs into window.DC.ASSET_DATA, so the
single file stays self-contained with no external requests.
Output: downloads/dice-chain-rpg.html  (+ optional path argument)
"""
import base64, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
JS_ORDER = ["data.js", "art.js", "art2.js", "art3.js", "meta.js", "dice.js", "map.js",
            "combat.js", "audio.js", "fx.js", "vfx.js", "ui.js", "main.js"]


def asset_script():
    adir = ROOT / "assets"
    if not adir.exists():
        return ""
    rows = []
    for p in sorted(adir.glob("*.webp")):
        b64 = base64.b64encode(p.read_bytes()).decode("ascii")
        rows.append('"assets/%s":"data:image/webp;base64,%s"' % (p.name, b64))
    return "<script>window.DC=window.DC||{};window.DC.ASSET_DATA={" + ",".join(rows) + "};</script>"


def build(out_path, inline_assets=True):
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    js_parts = []
    for name in JS_ORDER:
        src = (ROOT / "src" / name).read_text(encoding="utf-8")
        if "</script" in src:
            raise SystemExit("unsafe </script in " + name)
        js_parts.append("/* ===== src/%s ===== */\n%s" % (name, src))
    js = "\n".join(js_parts)

    html = re.sub(
        r'<link rel="stylesheet" href="style\.css[^"]*"\s*/?>',
        lambda m: "<style>\n" + css + "\n</style>",
        html,
    )
    html = re.sub(r'\n\s*<script src="src/[^"]+"></script>', "", html)
    if inline_assets:
        a = asset_script()
        if a:
            html = html.replace("</head>", "  " + a + "\n</head>")
    html = html.replace("</body>", "  <script>\n" + js + "\n  </script>\n</body>")

    out = pathlib.Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print("built %s (%.1f KB)" % (out, out.stat().st_size / 1024))


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "/workspace/downloads/dice-chain-rpg.html"
    build(target)
