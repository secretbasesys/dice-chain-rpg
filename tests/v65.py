"""v6.5 — aria-live status, keyboard focus, help counts."""
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
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    print("sr node:", page.evaluate("() => { const e=document.querySelector('#sr-status'); return e ? [e.getAttribute('role'), e.getAttribute('aria-live'), e.textContent.slice(0,30)] : null; }"))
    # play a die and confirm the live text updates
    page.evaluate("""() => { const c = DC.Game.state.combat;
      c.hand[0].v = 6; c.hand[0].k = 'slash';
      DC.Game.play(0, 0, false); }""")
    page.wait_for_timeout(300)
    print("sr after play:", page.evaluate("() => document.querySelector('#sr-status').textContent.slice(0,40)"))
    # keyboard focus ring: tab to first button
    page.keyboard.press("Escape")
    page.evaluate("() => DC.UI.render()")
    page.keyboard.press("Tab")
    print("focused:", page.evaluate("() => { const e=document.activeElement; return e ? (e.getAttribute('data-act') || e.tagName) : null; }"))
    # help counts dynamic
    page.evaluate("() => { DC.Game.state.ui.modal='help'; DC.Game.state.ui.helpTab='grow'; DC.UI.render(); }")
    page.wait_for_timeout(200)
    print("help relic row:", page.evaluate("() => { const rows=[...document.querySelectorAll('.help-row')]; const r=rows.find(x=>x.textContent.includes('유지되는 패시브')); return r ? r.textContent.slice(0,80) : 'none'; }"))
    shot(page, "help_grow")
    print("errors:", errors[:4])
    b.close()
