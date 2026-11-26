import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      const r=DC.Game.state.run; r.act=2; DC.Game.spawnsFor = () => [DC.ENEMIES[2][1]];
      DC.Game.startCombat('combat');
      const c=DC.Game.state.combat; c.enemies[0].intentIdx=1; DC.Combat.endTurn(c);
      c.statuses.poisonOnPlayer = 3; c.statuses.burnOnPlayer = 2; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v27_status.png")
    print("chips:", page.evaluate("() => [...document.querySelectorAll('.schip')].map(e=>e.textContent).join('|')"))
    print("LAYOUT", json.dumps(layout_report(page)))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
