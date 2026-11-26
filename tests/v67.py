"""v6.7 QA — touch tooltips, guard rails, empty-selection prompts."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 360, 640, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('paladin'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    page.evaluate("""() => { const s = DC.Game.state; s.run.relics = ['mask','clockwork'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)

    # tap a relic chip in HUD (desktop-only) -> mobile uses deck badge; tap the skill card for tip
    page.locator('.slot').first.tap()
    page.wait_for_timeout(250)
    print("tip visible after slot tap:", page.evaluate("() => !!document.querySelector('.tip.show, .tip.on, #tip.show')"), page.evaluate("() => { const t=document.querySelector('.tip'); return t ? t.className : 'no-tip-node'; }"))
    # manipulate without selection
    page.locator('[data-act="manip"][data-op="reroll"]').tap()
    page.wait_for_timeout(300)
    print("toast:", page.evaluate("() => { const t=document.getElementById('toast'); return t ? t.textContent : ''; }"))
    # end turn
    page.locator('[data-act="endturn"]').tap()
    page.wait_for_timeout(1500)
    print("screen after endturn:", page.evaluate("() => DC.Game.state.screen"), "phase:", page.evaluate("() => { const c=DC.Game.state.combat; return c ? c.phase : 'none'; }"))
    print("errors:", errors[:4])
    shot(page, "qa_360_combat")
    b.close()
