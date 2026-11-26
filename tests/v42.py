import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      DC.Game.openEvent({});
      DC.Game.state.screen='title'; DC.Game.state.ui.modal='codex'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    print("seen events:", page.evaluate("() => DC.Meta.get().seen.events"))
    print("cx events:", page.evaluate("() => document.querySelectorAll('.cx-event').length"))
    page.evaluate("""() => { const p=document.querySelector('.codex-panel'); const h=[...p.querySelectorAll('h4')].find(x=>x.textContent.indexOf('이벤트')>=0); if(h) h.scrollIntoView(); }""")
    page.wait_for_timeout(250)
    page.screenshot(path=OUT + "/v42_events.png")
    print("progress:", page.evaluate("() => document.querySelector('.cx-progress').textContent"))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
