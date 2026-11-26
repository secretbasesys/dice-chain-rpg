import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.state.ui.modal=null;
      const r=DC.Game.state.run; r.dice.push(DC.Dice.make('storm'), DC.Dice.make('venomd'));
      r.relics.push('flameHeart','wrist'); DC.Game.state.ui.modal='deck'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v30_deck.png")
    print("comp rows:", page.evaluate("() => document.querySelectorAll('.dc-row').length"))
    print("LAYOUT", json.dumps(layout_report(page))[:300])
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
