import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      const R = {};
      function combat(relics, cls, kind) {
        DC.Game.newRun(); DC.Game.pickClass(cls||'warrior'); DC.Game.state.ui.modal=null;
        const r = DC.Game.state.run; r.relics = relics.slice(); r.act = 2;
        DC.Game.spawnsFor = () => kind==='elite' ? [DC.ELITES[2][0]] : [DC.ENEMIES[2][0]];
        DC.Game.startCombat(kind||'combat', );
        return DC.Game.state.combat;
      }
      // mask: mult step
      let c = combat(['mask']);
      R.maskStep = +(DC.Combat.nextMult(c) - DC.Combat.mult(c)).toFixed(2);
      // karma: combo>=4 double hit
      c = combat(['karma']);
      c.combo = 4; c.hand.forEach(h=>{h.k='slash';h.v=5;});
      const hpBefore = c.enemies[0].hp;
      DC.Combat.play(c,0,0);
      R.karmaDmg = hpBefore - c.enemies[0].hp;
      // conductor: chain extra target (need 2 enemies)
      DC.Game.newRun(); DC.Game.pickClass('mage'); DC.Game.state.ui.modal=null;
      let r = DC.Game.state.run; r.relics=['conductor']; r.act=2;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][0], DC.ENEMIES[2][1]];
      DC.Game.startCombat('combat');
      c = DC.Game.state.combat;
      c.hand.forEach(h=>{h.k='bolt';h.v=5;});
      const hp0 = c.enemies.map(e=>e.hp);
      DC.Combat.play(c,2,2); // chain slot
      R.chainDamaged = hp0.map((h,i)=>h - c.enemies[i].hp);
      // echo: sparks + unused at end turn
      c = combat(['echo']);
      c.sparks = 0;
      const before = c.sparks;
      DC.Combat.enemyPhase(c);
      R.echoSparks = c.sparks - before;
      // wrist: block ratio
      c = combat(['wrist']);
      c.hand.forEach(h=>{h.k='guard';h.v=4;});
      DC.Combat.play(c,0,1);
      R.wristBlock = c.block;
      c = combat([]);
      c.hand.forEach(h=>{h.k='guard';h.v=4;});
      DC.Combat.play(c,0,1);
      R.baseBlock = c.block;
      // hourglass: a die +1
      c = combat(['hourglass']);
      R.hourglassBonus = c.hand.some(h=>h.bonusV);
      // gamblersHand maxSparks
      c = combat(['gamblersHand']);
      R.sparksMax = c.maxSparks;
      // contract maxHp
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      const beforeHp = DC.Game.state.run.maxHp; DC.Game.addRelic('contract');
      R.contractHp = beforeHp - DC.Game.state.run.maxHp;
      // merchant discount
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.state.run.relics=['merchant']; DC.Game.state.run.gold=999;
      DC.Game.openShop({});
      const p1 = DC.Game.state.ui.shop.items[0].price;
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.Game.state.run.gold=999; DC.Game.openShop({});
      const p0 = DC.Game.state.ui.shop.items[0].price;
      R.merchantRatioFull = [p0, p1];
      return R;
    }""")
    print(json.dumps(out))
    print("ERRORS", json.dumps(errors[:3], ensure_ascii=False))
    b.close()
