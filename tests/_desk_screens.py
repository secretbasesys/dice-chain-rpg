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
        if page.locator('[data-act="gift"]').count(): page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(300)
        if page.locator('[data-act="closetut"]').count(): page.click('[data-act="closetut"]'); page.wait_for_timeout(200)
    if page.evaluate("() => DC.Game.state.screen")=='map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(400)
    page.evaluate("""() => { const g=DC.Game; const c=g.state.combat; c.enemies.forEach(e=>e.hp=0); g.state.ui.busy=false; g.combatWon(); }""")
    page.wait_for_timeout(500); shot(page,'v72_desk_reward')
    page.evaluate("() => { DC.Game.state.screen='shop'; DC.Game.state.ui.shop={items:[{kind:'die',name:'방벽 주사위',desc:'수비 주사위',price:55,c:'#6bc7ff',ic:'shield',faces:[{k:'guard',v:3},{k:'guard',v:4},{k:'slash',v:2},{k:'guard',v:5},{k:'guard',v:6},{k:'slash',v:3}]},{kind:'relic',id:'flameHeart',name:'화염 심장',desc:'화염 면 피해 1.6배',price:110,c:'#ff9f43'},{kind:'forge',name:'단조 도구',desc:'면 1회 변경',price:40,c:'#fb923c',ic:'anvil'},{kind:'heal',name:'회복의 물약',desc:'체력 25% 회복',price:35,c:'#4ade80',ic:'heart'}],free:0,rerolls:0}; DC.UI.render(); }""")
    page.wait_for_timeout(400); shot(page,'v72_desk_shop')
    print('errors', errors[:3])
    b.close()
