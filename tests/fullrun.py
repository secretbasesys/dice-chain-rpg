import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("() => { const r = DC.test.autoRun('warrior', 900); return r; }")
    print("autrun:", json.dumps(out))
    page.wait_for_timeout(400)
    print("screen:", page.evaluate("() => DC.Game.state.screen"))
    page.screenshot(path=OUT + "/fullrun_end.png")
    print("ERRORS", json.dumps(errors[:5], ensure_ascii=False))
    b.close()
