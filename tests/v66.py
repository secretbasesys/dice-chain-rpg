import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    for (w, h, mob) in [(390, 844, True), (360, 640, True)]:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null; }")
        page.wait_for_timeout(200)
        if page.locator('[data-act="gift"]').count():
            page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(300)
        print(w, "tut modal:", page.evaluate("() => DC.Game.state.ui.modal"))
        rep = layout_report(page)
        print(w, "overflowX", rep["overflowX"], "off", len(rep["offscreen"]))
        shot(page, "tut_%d" % w)
        b.close()
