import os, sys
os.environ.setdefault("LD_LIBRARY_PATH", "/workspace/.cache/sysroot/usr/lib/x86_64-linux-gnu")
from playwright.sync_api import sync_playwright
CHROME = "/workspace/.cache/chrome/chrome-linux64/chrome"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errs=[]
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto("file:///workspace/downloads/dice-chain-rpg.html")
    page.wait_for_timeout(800)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    page.click('[data-act="pickclass"][data-id="paladin"]'); page.wait_for_timeout(500)
    if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(400)
    if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(500)
    page.wait_for_timeout(300)
    page.screenshot(path="/workspace/work/dice-rpg/screenshots/singlefile_combat.png")
    print('single-file version', page.evaluate("() => DC.VERSION"), 'errors', errs[:3])
    b.close()
