import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(400)
    page.click('[data-act="codex"]'); page.wait_for_timeout(400)
    shot(page,'v71_codex')
    page.click('[data-act="closecodex"]'); page.wait_for_timeout(200)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(300)
    page.click('[data-act="pickclass"][data-id="mage"]'); page.wait_for_timeout(450)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(350)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(500)
    page.evaluate("() => { DC.Game.state.ui.modal='deck'; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page,'v71_deck')
    page.evaluate("() => { DC.Game.state.ui.modal='help'; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page,'v71_help')
    page.evaluate("() => { DC.Game.state.ui.modal='settings'; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page,'v71_settings')
    # force an event
    page.evaluate("""() => { const g=DC.Game; g.state.ui.modal=null; g.state.run.gold=200;
      g.state.screen='event'; g.state.ui.event={ def: DC.EVENTS[7], text: DC.EVENTS[7].text, result:null };
      DC.UI.render(); }"""); page.wait_for_timeout(400)
    shot(page,'v71_event')
    print('errors', errors[:3])
    b.close()
