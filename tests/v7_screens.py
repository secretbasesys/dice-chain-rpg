"""v7.0 전 화면 캡처 — 실제 클릭으로 한 판을 진행하며 처음 만나는 화면마다 촬영."""
import sys, os
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

CFG = {'360': (360, 640, True), '390': (390, 844, True), '1280': (1280, 800, False)}
key = sys.argv[1] if len(sys.argv) > 1 else '390'
cls = sys.argv[2] if len(sys.argv) > 2 else 'warrior'
w, h, mob = CFG[key]
TAG = 'v7_%s' % key
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, w, h, mob)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(500)
    shot(page, TAG + '_title')
    page.click('[data-act="newrun"]'); page.wait_for_timeout(400)
    shot(page, TAG + '_class')
    page.click('[data-act="pickclass"][data-id="%s"]' % cls); page.wait_for_timeout(600)
    if page.locator('[data-act="closetut"]').count():
        shot(page, TAG + '_tutorial')
        page.click('[data-act="closetut"]'); page.wait_for_timeout(300)
    seen = set()
    overlays_done = False
    for step in range(120):
        scr = page.evaluate("() => DC.Game.state.screen")
        modal = page.evaluate("() => DC.Game.state.ui.modal")
        k = scr + ('/' + modal if modal else '')
        if not modal and (scr not in seen):
            seen.add(scr)
            try:
                shot(page, TAG + '_' + scr)
            except Exception:
                pass
        if scr in ('win', 'gameover'):
            break
        # 한 번은 전투 중 오버레이(덱/기록/설정)를 찍는다
        if scr == 'combat' and not overlays_done and not page.evaluate("() => DC.Game.state.ui.busy"):
            overlays_done = True
            page.evaluate("() => { DC.Game.state.ui.logOpen = true; DC.UI.render(); }")
            page.wait_for_timeout(350); shot(page, TAG + '_log')
            page.evaluate("() => { DC.Game.state.ui.logOpen = false; DC.Game.state.ui.modal = 'deck'; DC.UI.render(); }")
            page.wait_for_timeout(350); shot(page, TAG + '_deck')
            page.evaluate("() => { DC.Game.state.ui.modal = 'settings'; DC.UI.render(); }")
            page.wait_for_timeout(300); shot(page, TAG + '_settings')
            page.evaluate("() => { DC.Game.state.ui.modal = null; DC.UI.render(); }")
            page.wait_for_timeout(200)
        if modal == 'draft':
            if page.locator('[data-act="draftskill"]').count():
                page.click('[data-act="draftskill"][data-i="0"]')
            elif page.locator('[data-act="draftslot"]').count():
                page.click('[data-act="draftslot"][data-i="2"]')
            page.wait_for_timeout(350); continue
        if modal in ('deck', 'settings', 'help', 'codex', 'history', 'challenge', 'remove', 'tut', 'patch', 'skills'):
            sel = {'deck': 'closedeck', 'settings': 'closesettings', 'help': 'closehelp', 'codex': 'closecodex',
                   'history': 'closehistory', 'challenge': 'closechallenge', 'remove': 'closeremove',
                   'tut': 'closetut', 'patch': 'closepatch', 'skills': 'closeskills'}[modal]
            if page.locator('[data-act="%s"]' % sel).count():
                page.click('[data-act="%s"]' % sel)
            page.wait_for_timeout(220); continue
        if scr == 'gift':
            page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(400)
        elif scr == 'map':
            if page.locator('.node.avail').count() == 0:
                print('deadend at step', step); break
            page.locator('.node.avail').first.click(); page.wait_for_timeout(500)
        elif scr == 'combat':
            for _ in range(10):
                if page.evaluate("() => DC.Game.state.screen") != 'combat': break
                if page.evaluate("() => DC.Game.state.ui.busy"):
                    page.wait_for_timeout(350); continue
                done = False
                for i in range(8):
                    if not page.locator('[data-act="hand"]:not(.used)').count():
                        break
                    try:
                        page.locator('[data-act="hand"]:not(.used)').nth(i).click(timeout=1200)
                    except Exception:
                        break
                    page.wait_for_timeout(100)
                    if page.locator('.slot.st-can').count():
                        try:
                            page.locator('.slot.st-can').first.click(timeout=1200)
                            page.wait_for_timeout(380); done = True
                        except Exception:
                            pass
                        break
                    if page.locator('[data-act="hand"].sel').count():
                        page.locator('[data-act="hand"].sel').first.click(); page.wait_for_timeout(100)
                if not done: break
            if page.evaluate("() => DC.Game.state.screen") == 'combat' and not page.evaluate("() => DC.Game.state.ui.busy"):
                if page.locator('[data-act="endturn"]:not([disabled])').count():
                    page.click('[data-act="endturn"]'); page.wait_for_timeout(900)
        elif scr == 'reward':
            if page.locator('[data-act="reward"]').count():
                page.click('[data-act="reward"][data-i="0"]')
            else:
                page.click('[data-act="skipreward"]')
            page.wait_for_timeout(450)
        elif scr == 'bossrelic':
            page.click('[data-act="pickbossrelic"][data-i="0"]'); page.wait_for_timeout(500)
        elif scr == 'rest':
            page.click('[data-act="rest"][data-i="0"]'); page.wait_for_timeout(400)
        elif scr == 'event':
            if page.locator('.ev-cont').count():
                page.locator('.ev-cont').first.click()
            elif page.locator('[data-act="choice"]:not([disabled])').count():
                page.locator('[data-act="choice"]:not([disabled])').first.click()
            else:
                page.locator('.ev-skip, [data-act="leave"]').first.click()
            page.wait_for_timeout(400)
        elif scr in ('shop', 'forge'):
            if scr == 'shop' and page.locator('[data-act="buy"]:not([disabled])').count():
                page.locator('[data-act="buy"]:not([disabled])').first.click(); page.wait_for_timeout(300)
            if page.evaluate("() => DC.Game.state.screen") == 'forge':
                page.click('[data-act="forgeexit"]'); page.wait_for_timeout(350)
            else:
                page.click('[data-act="leave"]'); page.wait_for_timeout(350)
        elif scr == 'deep':
            page.click('[data-act="deeper"]'); page.wait_for_timeout(400)
        else:
            print('unknown screen', scr); break
    print(key, cls, 'final:', page.evaluate("() => DC.Game.state.screen"), 'seen:', sorted(seen))
    print('errors', errors[:6])
    b.close()
