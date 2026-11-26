import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      const r=DC.Game.state.run; r.relics = DC.RELIC_IDS.slice(0,14);
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    print("LAYOUT", json.dumps(layout_report(page))[:400])
    page.screenshot(path=OUT + "/hud_many.png")
    print("relic count:", page.evaluate("() => document.querySelectorAll('.relic').length"))
    b.close()
