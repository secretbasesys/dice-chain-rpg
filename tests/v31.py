import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      const r=DC.Game.state.run; r.gold=500; r.dice.push(DC.Dice.make('storm'));
      DC.Game.openShop({}); }""")
    page.wait_for_timeout(300)
    print("has remove item:", page.evaluate("() => DC.Game.state.ui.shop.items.some(i=>i.kind==='remove')"))
    idx = page.evaluate("() => DC.Game.state.ui.shop.items.findIndex(i=>i.kind==='remove')")
    page.click(f'[data-act="buy"][data-i="{idx}"]'); page.wait_for_timeout(300)
    print("modal:", page.evaluate("() => DC.Game.state.ui.modal"))
    page.screenshot(path=OUT + "/v31_remove.png")
    n0 = page.evaluate("() => DC.Game.state.run.dice.length")
    page.click('[data-act="removedie"][data-i="3"]'); page.wait_for_timeout(300)
    n1 = page.evaluate("() => DC.Game.state.run.dice.length")
    print("dice:", n0, "->", n1, "modal:", page.evaluate("() => DC.Game.state.ui.modal"))
    # min guard
    page.evaluate("() => { const r=DC.Game.state.run; while(r.dice.length>3) r.dice.pop(); DC.Game.state.ui.modal='remove'; DC.UI.render(); }")
    page.wait_for_timeout(200)
    page.click('[data-act="removedie"][data-i="0"]'); page.wait_for_timeout(200)
    print("min guard dice:", page.evaluate("() => DC.Game.state.run.dice.length"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
