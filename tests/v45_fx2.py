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
    page.evaluate("""() => { const c = DC.Game.state.combat;
      c.hand = [
        {uid:'a',dieIdx:0,fi:0,k:'slash',v:6,baseV:6,used:false,locked:false,phantom:false},
        {uid:'b',dieIdx:1,fi:0,k:'slash',v:6,baseV:6,used:false,locked:false,phantom:false},
        {uid:'c',dieIdx:2,fi:0,k:'slash',v:5,baseV:5,used:false,locked:false,phantom:false}
      ];
      c.slots.forEach(s => { s.handIdx = null; s.resolved = false; });
      c.enemies[0].hp = 999; c.enemies[0].maxHp = 999; DC.UI.render(); }""")
    for i in range(3):
        r = page.evaluate("(i) => DC.Game.play(i, i, false)", i)
        page.wait_for_timeout(250)
        print(i, "ok", r, "combo", page.evaluate("() => DC.Game.state.combat.combo"),
              "burst", page.evaluate("() => !!document.querySelector('.combo-badge.burst')"),
              "banner", page.evaluate("() => { const b=document.querySelector('.fx-banner'); return b ? b.textContent : 'none'; }"))
        if i == 2:
            page.screenshot(path=OUT + "/fx_combo3.png")
    print("errors", errors[:3])
    b.close()
