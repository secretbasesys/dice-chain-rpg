#!/usr/bin/env python3
"""Build a single-file playable HTML (no server, no assets) from the modular source.
Output: downloads/dice-chain-rpg.html  (+ optional path argument)"""
import re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent
JS_ORDER = ["data.js", "dice.js", "map.js", "combat.js", "audio.js", "fx.js", "ui.js", "main.js"]

def build(out_path):
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "style.css").read_text(encoding="utf-8")
    js_parts = []
    for name in JS_ORDER:
        src = (ROOT / "src" / name).read_text(encoding="utf-8")
        if "</script" in src:
            raise SystemExit("unsafe </script in " + name)
        js_parts.append("/* ===== src/%s ===== */\n%s" % (name, src))
    js = "\n".join(js_parts)

    html = html.replace(
        '<link rel="stylesheet" href="style.css" />',
        "<style>\n" + css + "\n</style>",
    )
    html = re.sub(r'\n\s*<script src="src/[^"]+"></script>', "", html)
    html = html.replace("</body>", "  <script>\n" + js + "\n  </script>\n</body>")

    out = pathlib.Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print("built %s (%.1f KB)" % (out, out.stat().st_size / 1024))

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "/workspace/downloads/dice-chain-rpg.html"
    build(target)
