"""Shared Playwright harness for Dice Chain verify passes."""
import sys, json, os, threading, functools, socketserver
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

CHROME = "/workspace/.cache/chrome/chrome-linux64/chrome"
BASE = "http://127.0.0.1:8099/index.html"
OUT = "/workspace/work/dice-rpg/screenshots"
ROOT = "/workspace/work/dice-rpg"
_server = None

def serve(port=8099):
    global _server
    if _server is not None:
        return _server
    handler = functools.partial(SimpleHTTPRequestHandler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    _server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    t = threading.Thread(target=_server.serve_forever, daemon=True)
    t.start()
    return _server

def launch(p, w, h, mobile=False):
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1,
                        is_mobile=mobile, has_touch=mobile)
    page = ctx.new_page()
    errors = []
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    return b, ctx, page, errors

def shot(page, name):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name + ".png")
    page.screenshot(path=path)
    return path

def layout_report(page):
    return page.evaluate("""() => {
      const out = {vw: innerWidth, vh: innerHeight, docW: document.documentElement.scrollWidth,
                   bodyH: document.body.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth + 1};
      // interactive targets smaller than 40px
      const small = [];
      document.querySelectorAll('[data-act],button').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        if (r.width < 40 || r.height < 40) small.push({act: el.dataset.act || el.tagName, w: Math.round(r.width), h: Math.round(r.height)});
      });
      out.smallTargets = small.slice(0, 12);
      // out-of-viewport elements
      const off = [];
      document.querySelectorAll('#app *').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        if (r.right > innerWidth + 2 || r.bottom > innerHeight + 2 || r.left < -2 || r.top < -2) {
          if (el.closest('.tray') || el.closest('.forge-strip') || el.closest('.strip-main')) return; // horizontal scroll strips
          if (el.tagName === 'svg' || el.tagName === 'path' || el.tagName === 'line') return;
          off.push({cls: el.className && el.className.toString().slice(0, 40), tag: el.tagName,
                    r: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]});
        }
      });
      out.offscreen = off.slice(0, 10);
      return out;
    }""")

def new_game(page, cls="warrior"):
    page.click('[data-act="newrun"]')
    page.wait_for_timeout(120)
    page.click(f'[data-act="pickclass"][data-id="{cls}"]')
    page.wait_for_timeout(200)

def no_save(page):
    page.evaluate("() => localStorage.clear()")
    page.reload()
    page.wait_for_timeout(250)
