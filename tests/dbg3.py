import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][5]]; DC.Game.startCombat('combat');
      const c=DC.Game.state.combat; c.hand.forEach((h,i)=>{h.k='slash';h.v=4}); DC.UI.render(); }""")
    page.wait_for_timeout(300)
    print(json.dumps(page.evaluate("""() => {
      const g = s => { const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return [s, Math.round(r.left), Math.round(r.width), Math.round(e.scrollWidth)]; };
      return [g('#app'), g('.combat'), g('.strip'), g('.strip-main'), g('.strip-sub'), g('.slots'), g('.tray'), g('.actions')];
    }"""), ensure_ascii=False))
    b.close()
