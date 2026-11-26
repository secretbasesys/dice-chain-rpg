import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(350)
    page.screenshot(path=OUT + "/v17_title.png")
    # custom seed
    page.fill('#seed-input', 'testseed')
    page.wait_for_timeout(150)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(500)
    page.screenshot(path=OUT + "/v17_tut.png")
    print("tut modal:", page.evaluate("() => !!document.querySelector('.tut-panel')"))
    page.click('[data-act="closetut"]'); page.wait_for_timeout(300)
    print("seed label:", page.evaluate("() => DC.Game.state.run.seed"))
    print("seed chip:", page.evaluate("() => { const e=document.querySelector('.seed-chip'); return e ? e.textContent : null; }"))
    page.screenshot(path=OUT + "/v17_map_seed.png")
    # same seed determinism: regenerate map
    d1 = page.evaluate("() => { DC.setSeed('abc'); const m = DC.MapGen.gen(DC.rng,1); return JSON.stringify(m.grid)+JSON.stringify(Object.keys(m.nodes).map(k=>m.nodes[k].type)); }")
    d2 = page.evaluate("() => { DC.setSeed('abc'); const m = DC.MapGen.gen(DC.rng,1); return JSON.stringify(m.grid)+JSON.stringify(Object.keys(m.nodes).map(k=>m.nodes[k].type)); }")
    print("deterministic:", d1 == d2, len(d1))
    # history after a loss
    page.evaluate("""() => { DC.Game.state.run.stats.dmg = 123; DC.Game.state.run.maxCombo = 5;
      DC.Game.state.run.hp = 1; DC.Game.combatLost(); }""")
    page.wait_for_timeout(400)
    page.evaluate("() => { DC.Game.state.screen='title'; DC.Game.state.ui.modal='history'; DC.UI.render(); }")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v17_history.png")
    print("hist rows:", page.evaluate("() => document.querySelectorAll('.hist-row').length"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
