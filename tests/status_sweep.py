import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      const res = {};
      // debuff intent (shaman: vuln 2)
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      let r = DC.Game.state.run; r.act = 2;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][3]];
      DC.Game.startCombat('combat');
      let c = DC.Game.state.combat;
      c.enemies[0].intentIdx = 0; // debuff vuln
      DC.Combat.endTurn(c);
      res.debuff = {vuln: c.statuses.vuln, weak: c.statuses.weak};
      // drain intent heals enemy
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 2;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][4]]; // wraith: attack, drain, debuff
      DC.Game.startCombat('combat');
      c = DC.Game.state.combat;
      const e = c.enemies[0];
      e.hp = 20; e.intentIdx = 1; // drain
      DC.Combat.endTurn(c);
      res.drain = {enemyHp: e.hp, playerHp: c.hp};
      // player poison on start (spider attack apply poison)
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 2;
      DC.Game.spawnsFor = () => [DC.ENEMIES[2][1]];
      DC.Game.startCombat('combat');
      c = DC.Game.state.combat;
      c.enemies[0].intentIdx = 1; // attack apply poison
      const hp0 = c.hp;
      DC.Combat.endTurn(c);
      const hp1 = c.hp;
      DC.Combat.endTurn(c);
      res.poison = {after1: hp0-hp1, after2: hp1-c.hp, poisonOnPlayer: c.statuses.poisonOnPlayer};
      return res;
    }""")
    print(json.dumps(out))
    print("ERRORS", json.dumps(errors[:3], ensure_ascii=False))
    b.close()
