"""v4.4 screenshots for README — boss relic choice + shadow die combat."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    for (w, h, mob, tag) in [(390, 844, True, ""), (1280, 800, False, "desktop_")]:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(300)
        page.evaluate("""() => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass('warrior');
          DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null; }""")
        # gift screen removed -> now at map; go boss relic
        page.evaluate("""() => { const s = DC.Game.state; s.run.act = 2; s.run.relics = ['mask']; s.run.hp = 54; s.run.maxHp = 72;
          DC.Game.openBossRelic(); }""")
        page.wait_for_timeout(350)
        page.evaluate("() => { const t=document.getElementById('toast'); if(t) t.classList.remove('show'); }")
        page.screenshot(path=OUT + "/%sbossrelic.png" % tag)
        # now pick eye of fate and go into a combat to show shadow die
        page.evaluate("""() => { DC.Game.state.ui.bossRelic.options = ['eyeOfFate','warDrum','glassCannon']; DC.Game.state.ui.bossRelic = null;
          const s = DC.Game.state; s.run.relics = ['mask','eyeOfFate']; s.run.act = 2;
          DC.Game.spawnsFor = () => [DC.ENEMIES[2][3], DC.ENEMIES[2][0]];
          DC.Game.startCombat('combat'); }""")
        page.wait_for_timeout(350)
        page.screenshot(path=OUT + "/%sshadow_die.png" % tag)
        print(tag or "mobile", "errors", errors[:3])
        b.close()
