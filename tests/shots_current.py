import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/title.png")
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('alchemist'); DC.Game.state.ui.modal=null;
      const r = DC.Game.state.run; r.map.current = r.map.grid[2][0]; r.cleared.push(r.map.grid[0][0], r.map.grid[1][0], r.map.grid[2][0]);
      DC.UI.render(); }""")
    page.wait_for_timeout(400)
    page.screenshot(path=OUT + "/map.png")
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][5]];
      DC.Game.state.run.act = 2; DC.Game.startCombat('combat');
      const c=DC.Game.state.combat; c.hand.forEach((h,i)=>{h.k=['fire','venom','bolt'][i%3];h.v=4+i%3}); DC.UI.render(); }""")
    page.wait_for_timeout(400)
    page.screenshot(path=OUT + "/combat.png")
    page.evaluate("""() => { DC.Game.state.combat=null; DC.Game.state.screen='event';
      const ev=DC.EVENTS[7]; DC.Game.state.ui.event={def:ev,text:ev.text,node:{},result:null}; DC.UI.render(); }""")
    page.wait_for_timeout(250); page.screenshot(path=OUT + "/event.png")
    page.evaluate("""() => { DC.Game.state.ui.event=null; DC.Game.openShop({}); }""")
    page.wait_for_timeout(250); page.screenshot(path=OUT + "/shop.png")
    page.evaluate("""() => { DC.Game.state.ui.modal='deck'; DC.Game.state.screen='map'; DC.UI.render(); }""")
    page.wait_for_timeout(250); page.screenshot(path=OUT + "/deck.png")
    page.evaluate("""() => { DC.Game.state.ui.modal='codex'; DC.UI.render(); }""")
    page.wait_for_timeout(250); page.screenshot(path=OUT + "/codex.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
