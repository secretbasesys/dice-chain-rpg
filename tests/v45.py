"""v4.5 verification: wide desktop screens + mobile regression + FX sanity."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()


def newrun(page, cls='warrior'):
    page.evaluate("""(cls) => { localStorage.clear(); DC.Game.newRun(); DC.Game.pickClass(cls);
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      if (DC.Meta.tutSeen && !DC.Meta.tutSeen()) DC.Meta.setTut(); }""", cls)
    page.wait_for_timeout(250)


with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 1280, 800, False)
    page.goto(BASE); page.wait_for_timeout(300)
    newrun(page)
    shot(page, "d45_map")
    page.evaluate("""() => { DC.Game.state.run.relics=['mask','hourglass','karma'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    # play 3 dice so the log + chain fill up
    page.evaluate("""() => {
      const c = DC.Game.state.combat;
      let played = 0;
      for (let si = 0; si < c.slots.length && played < 3; si++) {
        for (let hi = 0; hi < c.hand.length; hi++) {
          if (DC.Combat.canPlay(c, hi, si).ok) { DC.Game.play(hi, si, true); played++; break; }
        }
      }
      DC.UI.render();
    }""")
    page.wait_for_timeout(400)
    print("log rows:", page.evaluate("() => document.querySelectorAll('.bl-row').length"),
          "chain:", page.evaluate("() => document.querySelectorAll('.chain-dot').length"))
    shot(page, "d45_combat")
    page.evaluate("() => { DC.Game.openShop({type:'shop'}); }")
    page.wait_for_timeout(250)
    shot(page, "d45_shop")
    page.evaluate("""() => { const s=DC.Game.state; s.run.gold=300;
      s.ui.reward={gold:40, options: DC.Game.makeRewardOptions(4), boss:false}; s.screen='reward'; DC.UI.render(); }""")
    page.wait_for_timeout(250)
    shot(page, "d45_reward")
    page.evaluate("() => { const s=DC.Game.state; s.screen='map'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    shot(page, "d45_map2")
    print("desktop layout", json.dumps(layout_report(page))[:200], "errors", errors[:3])
    b.close()

    # mobile regression 360/390
    for (w, h) in [(360, 640), (390, 844)]:
        b2, c2, pg, e2 = launch(p, w, h, True)
        pg.goto(BASE); pg.wait_for_timeout(250)
        newrun(pg, 'alchemist')
        pg.evaluate("""() => { DC.Game.spawnsFor = () => [DC.ENEMIES[1][0], DC.ENEMIES[1][4]];
          DC.Game.startCombat('combat'); }""")
        pg.wait_for_timeout(300)
        rep = layout_report(pg)
        # log toggle should open the inline panel
        pg.evaluate("() => { DC.Game.state.ui.logOpen = true; DC.UI.render(); }")
        pg.wait_for_timeout(200)
        openvis = pg.evaluate("() => { const e = document.querySelector('.battle-log-wrap'); return e ? getComputedStyle(e).display : 'none'; }")
        print(w, "overflowX", rep["overflowX"], "off", len(rep["offscreen"]), "small", len(rep["smallTargets"]),
              "logOpenDisplay", openvis, "err", e2[:2])
        shot(pg, "v45_%d" % w)
        b2.close()
