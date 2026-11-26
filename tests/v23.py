import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.state.run.act = 3; DC.Game.advanceAct(); }""")
    page.wait_for_timeout(300)
    print("screen:", page.evaluate("() => DC.Game.state.screen"))
    page.screenshot(path=OUT + "/v23_deep.png")
    page.click('[data-act="deeper"]'); page.wait_for_timeout(600)
    print("after deeper:", page.evaluate("() => { const r=DC.Game.state.run; return {screen:DC.Game.state.screen, act:r.act, depth:r.depth, rows:r.map.rows, name:DC.actName(r.act)}; }"))
    page.screenshot(path=OUT + "/v23_act4map.png")
    # act4 boss combat
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.BOSSES[3]]; DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(400)
    print("boss hp:", page.evaluate("() => DC.Game.state.combat.enemies[0].maxHp"), "name:", page.evaluate("() => DC.Game.state.combat.enemies[0].name"))
    page.screenshot(path=OUT + "/v23_boss4.png")
    # finish
    page.evaluate("() => { DC.Game.state.combat = null; DC.Game.state.run.act = 5; DC.Game.finishRun(); }")
    page.wait_for_timeout(300)
    print("finish screen:", page.evaluate("() => DC.Game.state.screen"), "bestDepth:", page.evaluate("() => DC.Meta.get().bestDepth"))
    page.screenshot(path=OUT + "/v23_win.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
