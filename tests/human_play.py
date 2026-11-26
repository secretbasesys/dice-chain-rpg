import sys, json, random
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()

def step(page, wait=160):
    page.wait_for_timeout(wait)

with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(350)
    page.click('[data-act="newrun"]'); step(page, 250)
    page.click('[data-act="pickclass"][data-id="gambler"]'); step(page, 400)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); step(page, 250)
    log = []
    for i in range(8):
        scr = page.evaluate("() => DC.Game.state.screen")
        log.append(scr)
        if scr == 'map':
            nodes = page.query_selector_all('.node.avail')
            if not nodes: 
                log.append('no-avail'); break
            nodes[0].click(); step(page, 500)
        elif scr == 'combat':
            # play up to 6 skill pairs by clicking
            for _ in range(6):
                if page.evaluate("() => DC.Game.state.screen") != 'combat': break
                hand = page.query_selector_all('[data-act="hand"]:not(.used)')
                played = False
                for h in hand:
                    h.click(); step(page, 120)
                    slots = page.query_selector_all('.slot.can')
                    if slots:
                        slots[0].click(); step(page, 500); played = True; break
                if not played: break
                if page.evaluate("() => DC.Game.state.ui.busy"): page.wait_for_timeout(800)
            if page.evaluate("() => DC.Game.state.screen") == 'combat':
                end = page.query_selector('[data-act="endturn"]')
                if end: end.click(); step(page, 1200)
            # resolve reward or map
            if page.evaluate("() => DC.Game.state.screen") == 'reward':
                page.click('[data-act="reward"][data-i="0"]'); step(page, 400)
        elif scr == 'reward':
            page.click('[data-act="reward"][data-i="0"]'); step(page, 400)
        elif scr in ('rest','event'):
            page.click('[data-act="rest"], [data-act="choice"]'); step(page, 400)
            if page.locator('[data-act="leave"]').count(): page.click('[data-act="leave"]'); step(page, 300)
        elif scr == 'shop' or scr == 'forge':
            page.click('[data-act="leave"], [data-act="forgeexit"]'); step(page, 400)
        else:
            break
    print("screens:", log)
    print("final:", page.evaluate("() => DC.Game.state.screen"))
    page.screenshot(path=OUT + "/human_play.png")
    print("ERRORS", json.dumps(errors[:6], ensure_ascii=False))
    b.close()
