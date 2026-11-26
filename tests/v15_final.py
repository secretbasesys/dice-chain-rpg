import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/class.png")
    page.click('[data-act="pickclass"][data-id="alchemist"]'); page.wait_for_timeout(450)
    page.evaluate("() => DC.UI.clearToast()")
    page.screenshot(path=OUT + "/map.png")
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[2][0]];
      DC.Game.startCombat('combat');
      const c = DC.Game.state.combat;
      c.hand.forEach((h,i)=>{ h.k=['fire','venom','bolt'][i%3]; h.v=4; });
      DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/alchemist_combat.png")
    # fill 2 essences then show flask
    page.evaluate("""() => { const c = DC.Game.state.combat;
      DC.Combat.play(c,0,0); DC.Combat.play(c,1,1); DC.UI.render(); }""")
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/alchemist_flask.png")
    r = page.evaluate("""() => { const c = DC.Game.state.combat;
      const ev = DC.Combat.play(c,2,3); DC.UI.render();
      return {flask:c.flask, msgs:ev.events.filter(e=>e.t==='msg').map(e=>e.text)}; }""")
    print("potion:", json.dumps(r, ensure_ascii=False))
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/alchemist_catalyze.png")
    # codex incl new dice
    page.evaluate("""() => { const m = DC.Meta.get(); m.seen.dice = DC.DICE_IDS.slice(); DC.Meta.save && DC.Meta.save();
      DC.Game.state.screen='title'; DC.Game.state.ui.modal='codex'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/codex.png")
    print("dice count:", page.evaluate("() => DC.DICE_IDS.length"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
