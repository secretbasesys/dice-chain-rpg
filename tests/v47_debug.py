import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    for cls in ['warrior','mage','gambler','alchemist','paladin','mage','warrior','alchemist']:
        out = page.evaluate("""(cls) => {
          const r = DC.test.autoRun(cls, 900, false);
          const s = DC.Game.state;
          return Object.assign({}, r, {modal: s.ui.modal, reward: !!s.ui.reward, draft: !!s.ui.draft,
            evResult: s.ui.event ? s.ui.event.result : null, evId: s.ui.event && s.ui.event.def ? s.ui.event.def.id : null, evChoices: s.ui.event && s.ui.event.def ? s.ui.event.def.choices.length : null,
            avail: (s.run && s.run.map) ? DC.MapGen.available(s.run.map).length : -1,
            cur: s.run ? JSON.stringify(s.run.current) : null});
        }""", cls)
        print(cls, json.dumps(out))
    print("errors", errors[:4])
    b.close()
