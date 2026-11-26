import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    page.evaluate("""() => { const s = DC.Game.state; s.run.relics = ['clockwork','collector','bloodRite','engine'];
      s.ui.modal = 'deck'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    page.evaluate("() => { const p = document.querySelector('.deck-relics'); if (p) p.scrollIntoView({block:'center'}); }")
    page.wait_for_timeout(200)
    shot(page, "relics_v63")
    print("deck relic icons:", page.evaluate("() => document.querySelectorAll('.deck-relic .relic-art').length"))
    print("errors", errors[:3])
    b.close()
