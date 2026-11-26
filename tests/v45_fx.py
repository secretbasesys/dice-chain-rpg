"""v4.5 FX check: boss cinematic banner, hit flash + ring, combo burst."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("""() => { localStorage.clear(); DC.Meta.setTut(); DC.Game.newRun(); DC.Game.pickClass('warrior');
      DC.Game.state.ui.modal=null; DC.Game.takeGift(0); DC.Game.state.ui.modal=null; }""")
    # boss fight -> cinematic banner
    page.evaluate("""() => { const s = DC.Game.state; s.run.act = 1;
      DC.Game.travel ? null : null;
      s.run.map = DC.MapGen.gen(DC.rng, 1);
      DC.Game.startCombat('boss'); }""")
    page.wait_for_timeout(420)
    print("boss banner:", page.evaluate("() => { const b=document.querySelector('.fx-banner'); return b ? b.className + '|' + b.textContent : 'none'; }"))
    shot(page, "fx_boss_cinematic")
    page.wait_for_timeout(1600)
    print("boss line banner:", page.evaluate("() => { const b=document.querySelector('.fx-banner'); return b ? b.className + '|' + b.textContent.slice(0,24) : 'none'; }"))
    shot(page, "fx_boss_line")

    # normal fight: land hits and build combo, capture mid-animation
    page.evaluate("""() => { const s = DC.Game.state;
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(200)
    page.evaluate("""() => { const c = DC.Game.state.combat;
      // make a clean hand so every slot can be played with 3+ chain
      c.hand = [
        {uid:'a',dieIdx:0,fi:0,k:'slash',v:6,baseV:6,used:false,locked:false,phantom:false},
        {uid:'b',dieIdx:1,fi:0,k:'slash',v:6,baseV:6,used:false,locked:false,phantom:false},
        {uid:'c',dieIdx:2,fi:0,k:'slash',v:5,baseV:5,used:false,locked:false,phantom:false},
        {uid:'d',dieIdx:3,fi:0,k:'fire',v:4,baseV:4,used:false,locked:false,phantom:false}
      ];
      c.slots.forEach(s => { s.handIdx = null; s.resolved = false; });
      c.enemies[0].hp = 999; c.enemies[0].maxHp = 999;
      DC.UI.render(); }""")
    page.wait_for_timeout(120)
    page.evaluate("() => { DC.Game.play(0, 0, false); }")
    page.wait_for_timeout(90)
    print("hurt class:", page.evaluate("() => !!document.querySelector('.enemy.hurt')"),
          "ring:", page.evaluate("() => document.querySelectorAll('.fx-ring').length"),
          "flash:", page.evaluate("() => document.querySelectorAll('.fx-flash').length"))
    shot(page, "fx_hit")
    # fast-forward, then combo 3
    page.wait_for_timeout(1400)
    page.evaluate("() => { DC.Game.play(1, 1, false); }")
    page.wait_for_timeout(1400)
    page.evaluate("() => { DC.Game.play(2, 2, false); }")
    page.wait_for_timeout(160)
    print("combo burst:", page.evaluate("() => !!document.querySelector('.combo-badge.burst')"),
          "banner:", page.evaluate("() => { const b=document.querySelector('.fx-banner'); return b ? b.textContent : 'none'; }"))
    shot(page, "fx_combo3")
    print("errors", errors[:4])
    b.close()
