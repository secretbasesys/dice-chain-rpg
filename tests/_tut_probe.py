import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(450)
    if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(350)
    print(page.evaluate("""() => {
      const n=document.querySelector('.tut-n'), r=document.querySelector('.tn-row');
      const cn=n?getComputedStyle(n):null, cr=r?getComputedStyle(r):null;
      return {n: cn?[cn.backgroundColor, cn.backgroundImage.slice(0,40), cn.color]:'none',
              row: cr?[cr.backgroundColor, cr.backgroundImage.slice(0,40), cr.borderColor]:'none'};
    }"""))
    b.close()
