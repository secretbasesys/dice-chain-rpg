import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    out = page.evaluate("""() => {
      const results = [];
      DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
      DC.EVENTS.forEach(function(ev){
        ev.choices.forEach(function(ch, ci){
          // reset run each time
          DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.state.ui.modal=null;
          const r = DC.Game.state.run;
          r.gold = 500; r.hp = 40; r.relics = []; r.dice = r.dice.slice(0,2);
          try {
            DC.Game.openEvent({});
            DC.Game.state.ui.event = { def: ev, text: ev.text, node: {}, result: null, after: null };
            DC.Game.state.screen = 'event';
            DC.Game.choice(ci);
            const st = DC.Game.state.ui.event;
            results.push([ev.id, ci, ch.label, !!st && !!st.result, r.gold, r.hp, r.relics.length, r.dice.length, st && st.after ? 'after' : '']);
          } catch (e) {
            results.push([ev.id, ci, ch.label, 'ERR:'+e.message]);
          }
        });
      });
      return results;
    }""")
    bad = [r for r in out if len(r) < 4 or r[3] is False or (isinstance(r[3], str) and r[3].startswith('ERR'))]
    print("total choice runs:", len(out), "bad:", len(bad))
    for r in bad[:10]: print(json.dumps(r, ensure_ascii=False))
    print("sample:", json.dumps(out[:3], ensure_ascii=False))
    print("ERRORS", json.dumps(errors[:5], ensure_ascii=False))
    b.close()
