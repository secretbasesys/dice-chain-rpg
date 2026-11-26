import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    print("LAYOUT", json.dumps(layout_report(page)))
    page.screenshot(path=OUT + "/v26_title360.png")
    print("ERRORS", errors[:2])
    b.close()
