import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(350)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v15b_class.png")
    print("class cards:", page.evaluate("() => document.querySelectorAll('[data-act=pickclass]').length"))
    page.click('[data-act="pickclass"][data-id="alchemist"]'); page.wait_for_timeout(500)
    page.evaluate("() => DC.UI.clearToast()")
    page.screenshot(path=OUT + "/v15_map.png")
    print("screen:", page.evaluate("() => DC.Game.state.screen"))
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]];
      DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(400)
    page.evaluate("""() => { const c = DC.Game.state.combat;
      c.hand.forEach((h,i)=>{ h.k='fire'; h.v=3; });
      DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v15_combat.png")
    # play two skills to put 2 essences in
    r = page.evaluate("""() => { const c = DC.Game.state.combat; const out=[];
      for (let n=0;n<2;n++) {
        const before = JSON.stringify(c.flask);
        const res = DC.Combat.play(c, 0, 0);
        out.push([res.ok, before, JSON.stringify(c.flask)]);
      }
      DC.UI.render(); return out; }""")
    print("plays:", r)
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v15_flask2.png")
    # third -> potion trigger
    r2 = page.evaluate("""() => { const c = DC.Game.state.combat;
      const res = DC.Combat.play(c, 0, 0);
      DC.UI.render();
      return {ok:res.ok, flask:c.flask, ev:res.events.map(e=>e.t+(e.text?':'+e.text:'')).slice(0,12)}; }""")
    print("trigger:", json.dumps(r2, ensure_ascii=False))
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v15_flask_trigger.png")
    # catalyze with 2 essences
    r3 = page.evaluate("""() => { const c = DC.Game.state.combat;
      c.flask = {fire:1,poison:1,bolt:0};
      const res = DC.Combat.play(c, 1, 3);
      DC.UI.render(); return {ok:res.ok, flask:c.flask, dmg:c.totalDamage}; }""")
    print("catalyze:", json.dumps(r3, ensure_ascii=False))
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v15_catalyze.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
