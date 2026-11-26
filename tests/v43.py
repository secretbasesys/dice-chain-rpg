import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("() => { DC.Game.state.ui.modal='tut'; DC.UI.render(); }")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v43_tut.png")
    print("LAYOUT", json.dumps(layout_report(page))[:260])
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
