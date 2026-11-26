import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      const res = {};
      // 1) queen split at 50%
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      let r = DC.Game.state.run; r.act = 1;
      DC.Game.spawnsFor = () => [DC.BOSSES[1]];
      DC.Game.startCombat('boss');
      let c = DC.Game.state.combat;
      c.enemies[0].hp = Math.floor(c.enemies[0].maxHp * 0.45);
      DC.Combat.endTurn(c);
      res.queen = {enemies: c.enemies.length, alive: DC.Combat.alive(c).length};
      // 2) lich revive
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 2;
      DC.Game.spawnsFor = () => [DC.BOSSES[2]];
      DC.Game.startCombat('boss');
      c = DC.Game.state.combat;
      c.enemies[0].hp = 1;
      c.hand.forEach((h)=>{h.k='slash'; h.v=6;});
      DC.Combat.play(c, 0, 0);
      res.lich = {phase: c.phase, hp: c.enemies[0].hp, revived: c.enemies[0].gUsed === true, block: c.enemies[0].block};
      // 3) dicelord seal on turn 3
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 3;
      DC.Game.spawnsFor = () => [DC.BOSSES[3]];
      DC.Game.startCombat('boss');
      c = DC.Game.state.combat;
      c.turn = 2;
      DC.Combat.endTurn(c);
      res.lord = {turn: c.turn, locked: c.hand.filter(h=>h.locked).length};
      // 4) thornMail lethal reflect
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.relics=['thornMail'];
      DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]];
      DC.Game.startCombat('combat');
      c = DC.Game.state.combat;
      c.enemies[0].hp = 3;
      DC.Combat.endTurn(c);
      res.thorns = {phase: c.phase, enemyHp: c.enemies[0].hp};
      return res;
    }""")
    print(json.dumps(out))
    print("ERRORS", json.dumps(errors[:4], ensure_ascii=False))
    b.close()
