import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    # ascension 10 unlock check
    page.evaluate("() => { const m=DC.Meta.get(); m.unlockedAsc=10; DC.Meta.save(); DC.UI.render(); }")
    page.wait_for_timeout(200)
    print("asc label:", page.evaluate("() => { const e=document.querySelector('.asc-label b'); return e?e.textContent:null; }"))
    page.click('[data-act="asc"][data-dir="1"]'); page.click('[data-act="asc"][data-dir="1"]'); page.click('[data-act="asc"][data-dir="1"]')
    page.wait_for_timeout(250)
    print("asc after 3 clicks:", page.evaluate("() => DC.Game.state.ui.asc"))
    page.screenshot(path=OUT + "/v20_title.png")
    # shop reroll
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.state.run.gold = 300; DC.Game.openShop({}); }""")
    page.wait_for_timeout(300)
    first = page.evaluate("() => DC.Game.state.ui.shop.items.map(i=>i.name).join(',')")
    page.click('[data-act="rerollshop"]'); page.wait_for_timeout(300)
    second = page.evaluate("() => DC.Game.state.ui.shop.items.map(i=>i.name).join(',')")
    print("reroll changed:", first != second, "gold:", page.evaluate("() => DC.Game.state.run.gold"), "rerolls:", page.evaluate("() => DC.Game.state.ui.shop.rerolls"))
    page.screenshot(path=OUT + "/v20b_shop.png")
    # end screen tags
    page.evaluate("""() => { DC.Game.state.ui.shop=null; const r=DC.Game.state.run;
      r.seed='TESTSEED'; r.challenge='glass'; r.asc=3; DC.Game.state.screen='win'; DC.Game.state.ui.winInfo={unlocked:false}; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/v20_end.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
