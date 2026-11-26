import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.state.ui.set.hc = true; DC.Game.state.ui.set.fs = 2; DC.Game.applyDisplay(); }""")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat');
      const c = DC.Game.state.combat; c.verdict = 0; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    rep = layout_report(page)
    print("layout:", json.dumps(rep)[:400])
    shot(page, "combat_hc_xl")
    page.evaluate("() => { DC.Game.state.ui.set.hc = false; DC.Game.state.ui.set.fs = 0; DC.Game.applyDisplay(); DC.UI.render(); }")
    page.wait_for_timeout(200)
    shot(page, "combat_default")
    b.close()
