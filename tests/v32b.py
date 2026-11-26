import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    out = page.evaluate("""() => {
      const res = {};
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      let r = DC.Game.state.run; r.act = 4;
      DC.Game.startCombat('boss');
      let c = DC.Game.state.combat;
      c.turn = 3;
      DC.Combat.endTurn(c);
      res.gaze = {weak: c.statuses.weak, vuln: c.statuses.vuln, turn: c.turn};
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      r = DC.Game.state.run; r.act = 5;
      DC.Game.startCombat('boss');
      c = DC.Game.state.combat;
      c.turn = 4;
      DC.Combat.endTurn(c);
      res.devour = {turn: c.turn, locked: c.hand.filter(h=>h.locked).length, hand: c.hand.length};
      return res;
    }""")
    print(json.dumps(out, ensure_ascii=False))
    print("ERRORS", errors[:3])
    b.close()
