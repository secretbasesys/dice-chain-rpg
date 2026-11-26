import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      DC.Game.state.run.gold = 100; DC.Game.state.run.act=2;
      DC.Game.state.screen='reward'; DC.Game.state.ui.reward={gold:30, options: DC.Game.makeRewardOptions(3), boss:false}; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    first = page.evaluate("() => DC.Game.state.ui.reward.options.map(o=>o.name).join(',')")
    page.click('[data-act="rerollreward"]'); page.wait_for_timeout(300)
    second = page.evaluate("() => DC.Game.state.ui.reward.options.map(o=>o.name).join(',')")
    print("changed:", first != second, "gold:", page.evaluate("() => DC.Game.state.run.gold"), "rerolled:", page.evaluate("() => DC.Game.state.ui.reward.rerolled"))
    page.screenshot(path=OUT + "/v39_reward.png")
    page.click('[data-act="rerollreward"]'); page.wait_for_timeout(200)
    print("gold after 2nd try:", page.evaluate("() => DC.Game.state.run.gold"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
