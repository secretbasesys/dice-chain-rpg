import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(400)
    res = page.evaluate("""() => {
      const out = {};
      for (const cls of DC.CLASS_IDS) {
        let wins = 0, acts = {};
        for (let i=0;i<24;i++) {
          const r = DC.test.autoRun(cls, 900);
          if (r.screen === 'win') wins++;
          acts[r.act] = (acts[r.act]||0)+1;
        }
        out[cls] = {wins: wins, runs: 40, acts: acts};
      }
      return out;
    }""")
    print(json.dumps(res, ensure_ascii=False))
    print("errors", errors[:5])
    b.close()
