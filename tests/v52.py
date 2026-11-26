"""v5.2 — relic synergies: activation, effects, deck list."""
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

    print("synergies:", page.evaluate("() => DC.SYNERGIES.length"),
          "active with set:", page.evaluate("() => DC.synergiesFor(['wrist','thornMail']).map(s=>s.id)"))

    eff = page.evaluate("""() => {
      const s = DC.Game.state; const out = {};
      const mk = (relics) => { s.run.relics = relics.slice();
        s.run.dice = DC.CLASSES.warrior.startDice.map(d => DC.Dice.make(d));
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat'); return s.combat; };
      // ironWall: +3 block at turn start
      let c = mk(['wrist','thornMail']);
      out.ironWallBlock = c.block;
      // gambit: +1 spark
      c = mk(['luckyCoin','gamblersHand']);
      out.gambitSparks = c.sparks;
      c = mk([]);
      out.baseSparks = c.sparks; out.baseBlock = c.block;
      // storm: fire die damage compare
      const fireDmg = (relics) => { const cc = mk(relics); cc.combo = 0;
        cc.enemies[0].hp = 300; cc.enemies[0].maxHp = 300;
        cc.hand = [{uid:'a',dieIdx:0,fi:0,k:'bolt',v:5,baseV:5,used:false,locked:false,phantom:false}];
        cc.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
        const before = cc.enemies[0].hp; DC.Combat.play(cc, 0, 0); return before - cc.enemies[0].hp; };
      out.boltNoSyn = fireDmg([]);
      out.boltStorm = fireDmg(['flameHeart','conductor']);
      // bloodMoon heal 50%
      c = mk(['vampireFang','grail']);
      c.hp = 30; c.maxHp = 100;
      c.hand = [{uid:'a',dieIdx:0,fi:0,k:'leech',v:4,baseV:4,used:false,locked:false,phantom:false}];
      c.slots.forEach(x => { x.handIdx=null; x.resolved=false; });
      DC.Combat.play(c, 0, 0);
      out.bloodMoonHp = c.hp;
      return out;
    }""")
    print("effects:", json.dumps(eff))

    # deck modal shows synergy list
    page.evaluate("() => { const s = DC.Game.state; s.run.relics = ['wrist','thornMail','flameHeart','conductor']; s.ui.modal='deck'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    print("syn rows:", page.evaluate("() => document.querySelectorAll('.syn-row').length"),
          "active:", page.evaluate("() => document.querySelectorAll('.syn-row.on').length"))
    shot(page, "syn_deck")
    print("errors:", errors[:4])
    b.close()
