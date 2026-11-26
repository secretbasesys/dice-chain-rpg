"""README screenshots for v4.5 — wide desktop combat/shop/map, mobile unchanged."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      DC.Game.state.run.relics = ['mask','hourglass','karma']; }""")
    page.wait_for_timeout(200)
    page.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    page.evaluate("""() => { const c = DC.Game.state.combat; let n=0;
      for (let si=0; si<c.slots.length && n<3; si++) for (let hi=0; hi<c.hand.length; hi++) {
        if (DC.Combat.canPlay(c,hi,si).ok) { DC.Game.play(hi,si,true); n++; break; } }
      c.enemies[1].hp = 12; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    shot(page, "desktop_combat")
    page.evaluate("() => { DC.Game.openShop({type:'shop'}); }")
    page.wait_for_timeout(250)
    shot(page, "desktop_shop")
    page.evaluate("""() => { const s=DC.Game.state; s.run.gold=300;
      s.ui.reward={gold:40, options: DC.Game.makeRewardOptions(3), boss:false}; s.screen='reward'; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    shot(page, "desktop_reward")
    page.evaluate("() => { const s=DC.Game.state; s.screen='map'; DC.UI.render(); }")
    page.wait_for_timeout(300)
    shot(page, "desktop_map")
    print("desktop errors", errors[:3])
    b.close()
