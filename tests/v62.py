"""v6.2 — synergy feedback at combat start + sidebar chips."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null; }")
    page.wait_for_timeout(200)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(200)
    page.evaluate("""() => { const s = DC.Game.state; s.run.relics = ['wrist','thornMail','flameHeart','conductor'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(700)
    print("banner:", page.evaluate("() => { const b=document.querySelector('.fx-banner'); return b ? b.textContent : 'none'; }"))
    print("sidebar syn chips:", page.evaluate("() => document.querySelectorAll('.bf-syns .eb-chip').length"))
    shot(page, "syn_sidebar")
    print("errors:", errors[:3])
    b.close()
