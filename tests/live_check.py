import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errs=[]
    page.on("pageerror", lambda e: errs.append("pageerror: "+e.message))
    page.on("console", lambda m: errs.append("console."+m.type+": "+m.text) if m.type=="error" else None)
    page.goto("https://secretbasesys.github.io/dice-chain-rpg/", wait_until="load", timeout=45000)
    page.wait_for_timeout(1200)
    print("title:", page.title())
    print("version:", page.evaluate("() => DC && DC.VERSION"))
    print("has cards:", page.evaluate("() => !!document.querySelector('[data-act=newrun]')"))
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(800)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    print("screen:", page.evaluate("() => DC.Game.state.screen"))
    page.screenshot(path="/workspace/work/dice-rpg/screenshots/live_gift.png")
    print("ERRORS", json.dumps(errs[:5], ensure_ascii=False))
    b.close()
