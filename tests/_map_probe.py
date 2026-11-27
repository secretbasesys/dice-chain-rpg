import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(250)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    page.wait_for_timeout(300)
    print(page.evaluate("""() => {
      const r=(s)=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); const c=getComputedStyle(e); return [s, Math.round(b.top), Math.round(b.height), c.position, c.marginTop, c.transform];};
      return [r('.map-screen'), r('.map-head'), r('.boss-preview'), r('.map-wrap'), r('.map-legend'), r('#toast')];
    }"""))
    shot(page,'v73_map')
    b.close()
