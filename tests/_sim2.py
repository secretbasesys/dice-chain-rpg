import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(400)
    for cls in ['warrior', 'mage', 'gambler']:
        res = page.evaluate("""(cls) => {
          let wins=0, acts={}, N=20;
          for (let i=0;i<N;i++) {
            const r = DC.test.autoRun(cls, 900);
            if (r.screen === 'win') wins++;
            acts[r.act] = (acts[r.act]||0)+1;
          }
          return JSON.stringify({cls, wins, N, acts});
        }""", cls)
        print(res)
    print("errors", errors[:4])
    b.close()
