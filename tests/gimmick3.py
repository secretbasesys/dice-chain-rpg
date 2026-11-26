import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    page.evaluate("() => localStorage.clear()")
    out = page.evaluate("""() => {
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      const r = DC.Game.state.run; r.act = 3; DC.Game.spawnsFor = () => [DC.BOSSES[3]];
      DC.Game.startCombat('boss');
      const c = DC.Game.state.combat;
      const g0 = JSON.stringify(c.enemies[0].gimmick);
      c.turn = 2;
      const res = DC.Combat.endTurn(c);
      return {g:g0, turn:c.turn, hand:c.hand.map(h=>[h.v,h.locked]), events: res.events.filter(e=>e.t==='curse'||e.t==='msg').map(e=>e.t+':'+(e.n||e.text))};
    }""")
    print(json.dumps(out, ensure_ascii=False))
    print("ERRORS", errors[:3])
    b.close()
