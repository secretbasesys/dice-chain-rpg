import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(250)
    out = page.evaluate("""() => DC.EVENTS.map(ev => {
      const free = ev.choices.filter(c => !c.need || !c.need.gold).length;
      return [ev.id, ev.choices.length, free];
    }).filter(x => x[2] === 0)""")
    print("events with all gold-gated choices:", json.dumps(out, ensure_ascii=False))
    b.close()
