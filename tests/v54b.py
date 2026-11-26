"""v5.4b — final 360x640 sweep across all screens."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('paladin'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    page.evaluate("""() => { const s = DC.Game.state; s.run.relics=['wrist','thornMail'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat');
      const c = s.combat; c.verdict = 4; c.block = 11; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    shot(page, "m360_combat")
    print("combat layout:", json.dumps(layout_report(page))[:200])
    for name, js in [
        ("map", "DC.Game.goMap()"),
        ("shop", "DC.Game.openShop({type:'shop'})"),
        ("reward", "const s=DC.Game.state; s.run.gold=200; s.ui.reward={gold:30, options: DC.Game.makeRewardOptions(4), boss:false}; s.screen='reward'; DC.UI.render()"),
        ("bossrelic", "const s=DC.Game.state; s.run.act=1; DC.Game.openBossRelic()"),
        ("draft", "const s=DC.Game.state; s.screen='map'; DC.Game.openDraft(null,'map')"),
    ]:
        page.evaluate("() => { eval(%r); }" % js)
        page.wait_for_timeout(250)
        rep = layout_report(page)
        print(name, "overflowX", rep["overflowX"], "off", len(rep["offscreen"]), "small", len(rep["smallTargets"]))
        shot(page, "m360_" + name)
    print("errors:", errors[:4])
    b.close()
