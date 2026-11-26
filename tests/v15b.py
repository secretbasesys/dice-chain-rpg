import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('alchemist');
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(400)
    page.evaluate("""() => { const c = DC.Game.state.combat;
      c.hand.forEach((h,i)=>{ h.k='fire'; h.v= i<2?3:4; });
      c.spawns = null; DC.UI.render(); }""")
    page.wait_for_timeout(200)
    page.evaluate("() => { const c = DC.Game.state.combat; DC.Combat.play(c,0,0); DC.Combat.play(c,1,1); DC.UI.render(); }")
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/v15c_flask2.png")
    print("flask2:", page.evaluate("() => JSON.stringify(DC.Game.state.combat.flask)"))
    r = page.evaluate("""() => { const c = DC.Game.state.combat;
      const res = DC.Combat.play(c,2,2); DC.UI.render();
      return {ok:res.ok, flask:c.flask, ev:res.events.filter(e=>e.t==='msg'||e.t==='flask').map(e=>(e.text||e.e)+':'+(e.n==null?'':e.n)), hp:c.enemies[0].hp, maxHp:c.enemies[0].maxHp}; }""")
    print("potion:", json.dumps(r, ensure_ascii=False))
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/v15c_potion.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
