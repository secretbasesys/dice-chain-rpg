import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    print("counts:", page.evaluate("() => [DC.DICE_IDS.length, DC.EVENTS.length, DC.RELIC_IDS.length]"))
    # new event
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      const ev = DC.EVENTS.find(e=>e.id==='starShard');
      DC.Game.state.screen='event'; DC.Game.state.ui.event={def:ev,text:ev.text,node:{},result:null}; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v37_event.png")
    n0 = page.evaluate("() => DC.Game.state.run.maxHp")
    page.click('[data-act="choice"][data-i="0"]'); page.wait_for_timeout(300)
    print("maxHp:", n0, "->", page.evaluate("() => DC.Game.state.run.maxHp"), "hp:", page.evaluate("() => DC.Game.state.run.hp"))
    # new dice in codex
    page.evaluate("""() => { const m=DC.Meta.get(); m.seen.dice = DC.DICE_IDS.slice(); DC.Meta.save();
      DC.Game.state.ui.event=null; DC.Game.state.screen='title'; DC.Game.state.ui.modal='codex'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    print("dice total:", page.evaluate("() => document.querySelector('.cx-progress').textContent"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
