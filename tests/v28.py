import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); const m=DC.Meta.get();
      [1,2,3].forEach(a=>{ DC.ENEMIES[a].forEach(e=>m.seen.enemies.push(e.id)); DC.ELITES[a].forEach(e=>m.seen.enemies.push(e.id)); });
      m.seen.enemies.push('queen','lich','dicelord'); DC.Meta.save();
      DC.Game.state.ui.modal='codex'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v28_codex.png")
    print("gimmicks:", page.evaluate("() => document.querySelectorAll('.cx-gimmick').length"))
    print("intent rows:", page.evaluate("() => document.querySelectorAll('.cx-intents').length"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
