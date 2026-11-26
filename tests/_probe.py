import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,1280,800,False)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(400)
    for _ in range(3):
        if page.locator('[data-act="gift"]').count():
            page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(350)
        if page.locator('[data-act="closetut"]').count():
            page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(450)
    print(page.evaluate("""() => {
      const s=document.querySelector('.slot'), f=s.querySelector('.sk-foot'), n=s.querySelector('.sk-name');
      const cs=getComputedStyle(s), cf=getComputedStyle(f);
      return {display:cs.display, flexDir:cs.flexDirection, rect:[s.getBoundingClientRect().width,s.getBoundingClientRect().height],
              footPos:cf.position, footOrder:cf.order, nameOrder:getComputedStyle(n).order};
    }"""))
    shot(page,'v71_desk_idle')
    b.close()
