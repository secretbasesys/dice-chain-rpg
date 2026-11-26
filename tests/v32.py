import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      const res = {};
      // act 4 boss -> abyssEye
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      let r = DC.Game.state.run; r.act = 4;
      DC.Game.spawnsFor = DC.Game.spawnsFor.bind(DC.Game);
      DC.Game.startCombat('boss');
      let c = DC.Game.state.combat;
      res.act4boss = c.enemies[0].name;
      c.turn = 2;
      DC.Combat.endTurn(c);
      res.gaze = {weak: c.statuses.weak, vuln: c.statuses.vuln};
      // act 5 boss -> devourer
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 5;
      DC.Game.startCombat('boss');
      c = DC.Game.state.combat;
      res.act5boss = c.enemies[0].name;
      c.turn = 3;
      DC.Combat.endTurn(c);
      res.devour = {locked: c.hand.filter(h=>h.locked).length, turn: c.turn};
      return res;
    }""")
    print(json.dumps(out, ensure_ascii=False))
    page.screenshot(path=OUT + "/v32_boss.png")
    print("ERRORS", json.dumps(errors[:3], ensure_ascii=False))
    b.close()
