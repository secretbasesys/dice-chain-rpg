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
    print("at deep:", page.evaluate("() => DC.Game.state.screen"))
    page.reload(); page.wait_for_timeout(400)
    page.click('[data-act="resume"]'); page.wait_for_timeout(400)
    print("resumed screen:", page.evaluate("() => DC.Game.state.screen"))
    page.screenshot(path=OUT + "/v24_resume_deep.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
