import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
classes = sys.argv[1].split(',') if len(sys.argv)>1 else ['warrior','mage','gambler','alchemist']
asc = int(sys.argv[2]) if len(sys.argv)>2 else 0
total = int(sys.argv[3]) if len(sys.argv)>3 else 60
batch = 20
out = {}
for cls in classes:
    wins = 0; runs = 0; acts = {}
    while runs < total:
        with sync_playwright() as p:
            b, ctx, page, errors = launch(p, 390, 844, True)
            page.goto(BASE); page.wait_for_timeout(200)
            try:
                r = page.evaluate("""([cls,asc,n]) => {
                  localStorage.clear(); DC.Game.state.ui.asc = asc;
                  const r = DC.test.sim(n, cls);
                  return {wins:r.wins, runs:r.runs, acts:r.acts};
                }""", [cls, asc, min(batch, total-runs)])
                wins += r['wins']; runs += r['runs']
                for k,v in r['acts'].items(): acts[k] = acts.get(k,0)+v
            except Exception as e:
                print(cls, "batch failed", str(e)[:60], flush=True)
            b.close()
    out[cls] = round(100*wins/max(1,runs))
    print(cls, asc, out[cls], '%', acts, flush=True)
print("RESULT", json.dumps(out))
