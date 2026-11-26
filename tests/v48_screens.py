import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    for (w, h, mob) in [(390, 844, True), (1280, 800, False)]:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("""() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('paladin');
          DC.Game.state.ui.modal=null; DC.Game.state.ui.set.hc = true; DC.Game.state.ui.set.fs = 2; DC.Game.applyDisplay(); }""")
        page.wait_for_timeout(200)
        if page.locator('[data-act="gift"]').count():
            page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
        for name, js in [
            ("map", "DC.Game.goMap()"),
            ("shop", "DC.Game.openShop({type:'shop'})"),
            ("reward", "const s=DC.Game.state; s.run.gold=200; s.ui.reward={gold:30, options: DC.Game.makeRewardOptions(3), boss:false}; s.screen='reward'; DC.UI.render()"),
            ("bossrelic", "const s=DC.Game.state; s.run.act=1; DC.Game.openBossRelic()"),
            ("codex", "DC.Game.state.ui.modal='codex'; DC.UI.render()"),
            ("deck", "DC.Game.state.ui.modal='deck'; DC.UI.render()"),
        ]:
            page.evaluate("() => { eval(%r); }" % js)
            page.wait_for_timeout(250)
            rep = layout_report(page)
            print(w, name, "overflowX", rep["overflowX"], "off", len(rep["offscreen"]), "small", len(rep["smallTargets"]))
            shot(page, "v48_%d_%s" % (w, name))
        print(w, "errors", errors[:3])
        b.close()
