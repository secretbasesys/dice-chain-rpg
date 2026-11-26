"""v5.8 — resume card summary + data reset flow."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    page.evaluate("() => { DC.Game.state.run.relics = ['mask','rune']; DC.Game.save(); DC.Game.state.screen = 'title'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    print("resume card:", page.evaluate("() => { const e=document.querySelector('.resume-card'); return e ? e.textContent.replace(/\\s+/g,' ').trim() : 'none'; }"))
    shot(page, "title_v58")

    page.evaluate("() => { DC.Game.state.ui.modal='settings'; DC.UI.render(); }")
    page.wait_for_timeout(200)
    page.click('[data-act="askreset"]'); page.wait_for_timeout(200)
    print("confirm shown:", page.evaluate("() => !!document.querySelector('[data-act=\"resetdata\"]')"))
    shot(page, "settings_reset")
    page.click('[data-act="resetdata"]'); page.wait_for_timeout(300)
    print("after reset:", page.evaluate("() => ({ screen: DC.Game.state.screen, save: DC.Game.hasSave(), meta: DC.Meta.get().wins, ach: Object.keys(DC.Meta.get().ach||{}).length })"))
    page.wait_for_timeout(200)
    shot(page, "after_reset")
    print("errors:", errors[:4])
    b.close()
