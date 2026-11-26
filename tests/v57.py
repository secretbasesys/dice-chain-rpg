"""v5.7 — end screen: synergies, boss relics, next goal."""
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
    page.evaluate("""() => { const s = DC.Game.state;
      s.run.relics = ['wrist','thornMail','flameHeart','conductor','bloodPact'];
      s.run.stats = { kills: 24, turns: 40, dmg: 2600, skillUse: { '강타': 12, '철벽': 9, '분쇄': 4 } };
      s.run.maxCombo = 7;
      const m = DC.Meta.get(); m.bestCombo = 6; DC.Meta.save();
      DC.Game.finishRun(); }""")
    page.wait_for_timeout(300)
    rep = layout_report(page)
    print("end screen:", page.evaluate("() => DC.Game.state.screen"), "overflowX", rep["overflowX"], "off", len(rep["offscreen"]))
    print("syn chips:", page.evaluate("() => document.querySelectorAll('.eb-chip').length"),
          "boss relic icons:", page.evaluate("() => document.querySelectorAll('.end-build .relic').length"),
          "goal:", page.evaluate("() => { const e=document.querySelector('.end-goal'); return e ? e.textContent.replace(/\\s+/g,' ').trim() : 'none'; }"))
    shot(page, "end_v57")
    print("errors:", errors[:4])
    b.close()
