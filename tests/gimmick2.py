import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      const res = {};
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      let r = DC.Game.state.run; r.act = 1; DC.Game.spawnsFor = () => [DC.BOSSES[1]];
      DC.Game.startCombat('boss');
      let c = DC.Game.state.combat;
      const q = c.enemies[0];
      const ev = [];
      DC.Combat.hitEnemyTest ? null : null;
      q.hp = Math.floor(q.maxHp * 0.55);
      // deal damage through play
      c.hand.forEach(h => { h.k='slash'; h.v=6; });
      DC.Combat.play(c, 0, 0);
      res.split = {enemies: c.enemies.length, queenHp: q.hp, flags: !!q.gSplit};
      // seal at turn 3
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 3; DC.Game.spawnsFor = () => [DC.BOSSES[3]];
      DC.Game.startCombat('boss');
      c = DC.Game.state.combat;
      c.turn = 2;
      DC.Combat.endTurn(c);
      res.seal = {locked: c.hand.filter(h=>h.locked).length, turn: c.turn};
      return res;
    }""")
    print(json.dumps(out))
    print("ERRORS", json.dumps(errors[:3], ensure_ascii=False))
    b.close()
