import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    page.fill('#seed-input', 'daily'); page.wait_for_timeout(150)
    page.screenshot(path=OUT + "/title.png")
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(450)
    page.screenshot(path=OUT + "/tutorial.png")
    page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
    page.evaluate("() => DC.UI.clearToast()")
    page.screenshot(path=OUT + "/map.png")
    page.evaluate("""() => { DC.Game.state.run.stats.dmg=812; DC.Game.state.run.maxCombo=6; DC.Game.combatLost();
      DC.Game.state.screen='title'; DC.Game.state.ui.modal='history'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/history.png")
    print("LAYOUT", json.dumps(layout_report(page)))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
