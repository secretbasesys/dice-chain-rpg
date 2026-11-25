import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('gambler'); const r=DC.Game.state.run; r.act=3; r.hp=52;
      DC.Game.spawnsFor=()=>[DC.BOSSES[3], DC.ENEMIES[3][1]]; DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(400)
    print(page.evaluate("""() => {
      const off=[]; document.querySelectorAll('#app *').forEach(el=>{const r=el.getBoundingClientRect();
        if(r.width<2||r.height<2) return; if(el.closest('.tray')) return;
        if(r.right>innerWidth+2||r.bottom>innerHeight+2||r.left<-2||r.top<-2)
          off.push({cls:(el.className||'').toString().slice(0,40), tag:el.tagName, r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]});});
      return JSON.stringify(off.slice(0,6));
    }"""))
    b.close()
