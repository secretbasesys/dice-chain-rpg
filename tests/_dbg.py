import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(200)
    print(page.evaluate("""() => {
      const t = document.getElementById('toast'); const cs = getComputedStyle(t);
      const r = t.getBoundingClientRect();
      return {top: cs.top, bottom: cs.bottom, y: Math.round(r.top), bodyAttr: document.body.getAttribute('data-screen'),
              appCls: document.querySelector('#app').className,
              enemyRow: (()=>{const e=document.querySelector('.enemy-row'); const q=e.getBoundingClientRect(); return [q.height, e.dataset.n];})()};
    }"""))
    page.screenshot(path="/workspace/work/dice-rpg/tests/_shots/m_combat2.png")
    b.close()
