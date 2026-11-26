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
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(350)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(400)
    # force reward screen
    page.evaluate("""() => { const g=DC.Game; const c=g.state.combat; c.enemies.forEach(e=>e.hp=0); g.state.ui.busy=false; g.combatWon(); }""")
    page.wait_for_timeout(600)
    print(page.evaluate("""() => {
      const card=document.querySelector('.rw-card'); if(!card) return 'no card';
      const cs=getComputedStyle(card), r=card.getBoundingClientRect();
      const rows={}; ['kind','ic','name','desc','faces'].forEach(a=>{const e=document.querySelector('.rw-'+a); if(e) rows[a]=[Math.round(e.getBoundingClientRect().height)];});
      return {h:Math.round(r.height), w:Math.round(r.width), rows:cs.gridTemplateRows, areas:cs.gridTemplateAreas, alignContent:cs.alignContent, rows2:rows, listH: Math.round(document.querySelector('.rw-list').getBoundingClientRect().height)};
    }"""))
    shot(page,'v71_reward_probe')
    b.close()
