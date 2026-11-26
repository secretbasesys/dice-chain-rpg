import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    out = page.evaluate("""() => {
      function multAt(relics, combo) {
        DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
        const r = DC.Game.state.run; r.relics = relics.slice();
        DC.Game.spawnsFor = () => [DC.ENEMIES[1][0]]; DC.Game.startCombat('combat');
        const c = DC.Game.state.combat; c.combo = combo;
        return DC.Combat.nextMult(c);
      }
      return {base2: multAt([],2), mask2: multAt(['mask'],2), base5: multAt([],5), mask5: multAt(['mask'],5)};
    }""")
    print(json.dumps(out))
    b.close()
