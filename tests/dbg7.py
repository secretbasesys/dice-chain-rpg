import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][1]]; DC.Game.startCombat('combat');
      const c=DC.Game.state.combat; c.statuses.poisonOnPlayer=3; c.statuses.burnOnPlayer=2; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    print(page.evaluate("() => { const c=DC.Game.state.combat; return {st: JSON.stringify(c.statuses), strip: document.querySelector('.strip').innerHTML.length, schips: document.querySelectorAll('.schip').length}; }"))
    b.close()
