import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    print(json.dumps(page.evaluate("""() => {
      const b = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
        const cs = getComputedStyle(e); return {x:Math.round(r.left), w:Math.round(r.width), h:Math.round(r.height), disp:cs.display, cols:cs.gridTemplateColumns, maxw:cs.maxWidth}; };
      return {app: b('#app'), combat: b('.combat'), arena: b('.arena'), log: b('.battle-log-wrap'), strip: b('.strip'), slots: b('.slots'), actions: b('.actions'), tray: b('.tray-wrap')};
    }"""), indent=1))
    print("errors", errors[:3])
    b.close()
