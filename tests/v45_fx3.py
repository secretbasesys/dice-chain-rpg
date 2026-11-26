import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null;
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(200)
    print(page.evaluate("""() => {
      const c = DC.Game.state.combat;
      c.combo = 2; c.maxCombo = 2;
      c.hand[0].v = 6; c.hand[0].k = 'slash';
      const why = [];
      for (let si = 0; si < c.slots.length; si++) why.push(si + ':' + JSON.stringify(DC.Combat.canPlay(c, 0, si)));
      return why;
    }"""))
    page.evaluate("() => { DC.Game.play(0, 0, false); }")
    page.wait_for_timeout(140)
    print("combo", page.evaluate("() => DC.Game.state.combat.combo"),
          "burst", page.evaluate("() => !!document.querySelector('.combo-badge.burst')"),
          "banner", page.evaluate("() => { const b=document.querySelector('.fx-banner'); return b ? b.textContent : 'none'; }"),
          "dots lit", page.evaluate("() => document.querySelectorAll('.chain-dot.lit').length"))
    page.screenshot(path=OUT + "/fx_combo3.png")
    print("errors", errors[:3])
    b.close()
