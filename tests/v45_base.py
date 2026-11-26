"""v4.5 baseline: desktop screens before the wide-layout work."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null; }""")
    page.wait_for_timeout(300)
    shot(page, "d45_map")
    page.evaluate("""() => { const s=DC.Game.state; DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(350)
    # play one die to fill the log
    page.evaluate("""() => { const c = DC.Game.state.combat; DC.Game.play(0, 0, true); }""")
    page.wait_for_timeout(400)
    print("layout", json.dumps(layout_report(page))[:400])
    shot(page, "d45_combat")
    page.evaluate("() => { DC.Game.openShop({type:'shop'}); }")
    page.wait_for_timeout(250)
    shot(page, "d45_shop")
    page.evaluate("() => { DC.Game.state.run.gold=300; DC.Game.state.ui.reward={gold:40, options: DC.Game.makeRewardOptions(3), boss:false}; DC.Game.state.screen='reward'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    shot(page, "d45_reward")
    print("errors", errors[:4])
    b.close()
