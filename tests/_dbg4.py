import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(400)
    print(page.evaluate("() => typeof DC.Meta + ' ' + DC.VERSION"))
    print(page.evaluate("() => JSON.stringify(DC.Meta.get())"))
    r = page.evaluate("() => { const out=[]; try { const res=DC.test.autoRun('warrior', 900); return JSON.stringify(res); } catch(e){ return 'ERR '+e.message; } }")
    print("run:", r)
    print("errors", errors[:6])
    b.close()
