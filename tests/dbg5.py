import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][0]]; DC.Game.startCombat('combat'); DC.UI.render(); }""")
    page.wait_for_timeout(250)
    print(json.dumps(page.evaluate("""() => [...document.querySelectorAll('.strip-sub')].map(e => {
      const r = e.getBoundingClientRect();
      return {p: e.parentElement.className, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), html: e.innerHTML.slice(0,80)};
    })"""), ensure_ascii=False))
    b.close()
