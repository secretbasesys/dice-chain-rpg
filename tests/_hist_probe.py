import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="history"]'); page.wait_for_timeout(400)
    print(page.evaluate("""() => {
      const s=document.querySelector('.hist-sum'), b=document.querySelector('.hs-grid b'), sp=document.querySelector('.hs-grid span');
      const cs=getComputedStyle(s), cb=getComputedStyle(b), cp=getComputedStyle(sp);
      return {bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0,60), num: cb.color, label: cp.color};
    }"""))
    shot(page,'v74_history2')
    b.close()
