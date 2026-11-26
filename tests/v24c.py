import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      const r=DC.Game.state.run; r.act=3; const bossId=r.map.grid[r.map.rows-1][0];
      r.map.current=bossId; r.cleared.push(bossId); DC.Game.state.screen='map'; DC.UI.render(); }""")
    page.wait_for_timeout(300)
    print("deadend shown:", page.evaluate("() => !!document.querySelector('.map-deadend')"))
    page.screenshot(path=OUT + "/v24_deadend.png")
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
