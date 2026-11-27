import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="mage"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(150)
    page.evaluate("() => { DC.Game.state.ui.modal='draft'; DC.Game.state.ui.draft={step:'pick', options: DC.CLASSES.mage.skills.slice(0,3)}; DC.UI.render(); }")
    page.wait_for_timeout(300)
    print(page.evaluate("""() => { const c=document.querySelector('.dr-card'); if(!c) return 'none'; const cs=getComputedStyle(c);
      return {display:cs.display, bgImg:cs.backgroundImage.slice(0,70), border:cs.borderColor, radius:cs.borderRadius}; }"""))
    shot(page,'v75_draft2')
    b.close()
