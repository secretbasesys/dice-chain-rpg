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
    page.evaluate("() => { DC.Game.openDraft && DC.Game.openDraft(); }")
    page.wait_for_timeout(400)
    if not page.evaluate("() => DC.Game.state.ui.modal === 'draft'"):
        page.evaluate("() => { DC.Game.state.ui.modal='draft'; DC.Game.state.ui.draft={step:'pick', cands: DC.CLASSES.mage.skills.map(s=>s), picked:null}; DC.UI.render(); }")
        page.wait_for_timeout(300)
    shot(page,'v75_draft')
    page.evaluate("() => { DC.Game.state.ui.modal='patch'; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page,'v75_patch')
    print('errors', errors[:2])
    b.close()
