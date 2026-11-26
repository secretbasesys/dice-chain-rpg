import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][5]]; DC.Game.startCombat('combat');
      const c=DC.Game.state.combat; c.hand.forEach((h,i)=>{h.k=['fire','bolt','slash'][i%3];h.v=4}); DC.UI.render(); }""")
    page.wait_for_timeout(400)
    page.screenshot(path=OUT + "/combat_360.png")
    print("LAYOUT", json.dumps(layout_report(page)))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
