"""v5.9 — end-to-end click-through at 360/390/1280: every screen via real clicks."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *


def play_run(page, log, shots, limit=60):
    for i in range(limit):
        scr = page.evaluate("() => DC.Game.state.screen")
        modal = page.evaluate("() => DC.Game.state.ui.modal")
        key = scr + ('/' + modal if modal else '')
        if not log or log[-1] != key:
            log.append(key)
            if key in shots:
                try:
                    shot(page, shots[key])
                except Exception:
                    pass
        if scr in ('win', 'gameover'):
            return scr
        if modal == 'draft':
            if page.locator('[data-act="draftskill"]').count():
                page.click('[data-act="draftskill"][data-i="0"]')
            elif page.locator('[data-act="draftslot"]').count():
                page.click('[data-act="draftslot"][data-i="2"]')
            page.wait_for_timeout(350)
            continue
        if modal == 'skills':
            if page.locator('[data-act="upskill"]:not([disabled])').count():
                page.click('[data-act="upskill"]:not([disabled])')
            page.wait_for_timeout(250)
            if page.locator('[data-act="closeskills"]').count():
                page.click('[data-act="closeskills"]')
            page.wait_for_timeout(300)
            continue
        if modal in ('deck', 'codex', 'help', 'settings', 'history', 'challenge', 'remove', 'tut'):
            sel = {'deck': 'closedeck', 'codex': 'closecodex', 'help': 'closehelp', 'settings': 'closesettings',
                   'history': 'closehistory', 'challenge': 'closechallenge', 'remove': 'closeremove', 'tut': 'closetut'}[modal]
            if page.locator('[data-act="%s"]' % sel).count():
                page.click('[data-act="%s"]' % sel)
            page.wait_for_timeout(200)
            continue
        if scr == 'gift':
            page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(400)
        elif scr == 'map':
            if page.locator('.node.avail').count() == 0:
                log.append('NO-AVAILABLE-NODE')
                return 'deadend'
            page.locator('.node.avail').first.click(); page.wait_for_timeout(450)
        elif scr == 'combat':
            for _ in range(8):
                if page.evaluate("() => DC.Game.state.screen") != 'combat': break
                if page.evaluate("() => DC.Game.state.ui.busy"):
                    page.wait_for_timeout(400); continue
                done = False
                for i in range(8):
                    if not page.locator('[data-act="hand"]:not(.used)').count():
                        break
                    try:
                        page.locator('[data-act="hand"]:not(.used)').nth(i).click(timeout=1500)
                    except Exception:
                        break
                    page.wait_for_timeout(120)
                    if page.locator('.slot.st-can').count():
                        try:
                            page.locator('.slot.st-can').first.click(timeout=1500)
                            page.wait_for_timeout(430)
                            done = True
                        except Exception:
                            pass
                        break
                    if page.locator('[data-act="hand"].sel').count():
                        page.locator('[data-act="hand"].sel').first.click()
                        page.wait_for_timeout(120)
                if not done: break
            if page.evaluate("() => DC.Game.state.screen") == 'combat' and not page.evaluate("() => DC.Game.state.ui.busy"):
                if page.locator('[data-act="endturn"]:not([disabled])').count():
                    page.click('[data-act="endturn"]'); page.wait_for_timeout(1100)
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
            if page.locator('[data-act="leave"].ev-cont').count() or page.locator('.ev-cont').count():
                page.locator('.ev-cont').first.click()
            elif page.locator('[data-act="choice"]:not([disabled])').count():
                page.locator('[data-act="choice"]:not([disabled])').first.click()
            else:
                page.locator('.ev-skip, [data-act="leave"]').first.click()
            page.wait_for_timeout(400)
        elif scr in ('shop', 'forge'):
            if page.locator('[data-act="buy"]:not([disabled])').count() and scr == 'shop':
                page.locator('[data-act="buy"]:not([disabled])').first.click(); page.wait_for_timeout(300)
            if scr == 'forge' or page.evaluate("() => DC.Game.state.screen") == 'forge':
                page.click('[data-act="forgeexit"]'); page.wait_for_timeout(350)
            else:
                page.click('[data-act="leave"]'); page.wait_for_timeout(350)
        else:
            log.append('UNKNOWN:' + scr)
            return scr
    return page.evaluate("() => DC.Game.state.screen")


serve()
# usage: python3 e2e.py [360|390|1280] [class]
import sys as _sys
_CFG = {'360': (360, 640, True), '390': (390, 844, True), '1280': (1280, 800, False)}
_KEY = _sys.argv[1] if len(_sys.argv) > 1 else '390'
_CLS = _sys.argv[2] if len(_sys.argv) > 2 else 'paladin'
with sync_playwright() as p:
    for (w, h, mob, cls) in [(_CFG[_KEY][0], _CFG[_KEY][1], _CFG[_KEY][2], _CLS)]:
        b, ctx, page, errors = launch(p, w, h, mob)
        page.goto(BASE); page.wait_for_timeout(350)
        page.evaluate("() => localStorage.clear()")
        page.reload(); page.wait_for_timeout(300)
        page.click('[data-act="newrun"]'); page.wait_for_timeout(250)
        page.click('[data-act="pickclass"][data-id="%s"]' % cls); page.wait_for_timeout(400)
        if page.locator('[data-act="closetut"]').count():
            page.click('[data-act="closetut"]'); page.wait_for_timeout(250)
        log = []
        shots = {'combat': 'e2e_%d_combat' % w, 'map': 'e2e_%d_map' % w, 'reward': 'e2e_%d_reward' % w,
                 'shop': 'e2e_%d_shop' % w, 'bossrelic': 'e2e_%d_bossrelic' % w,
                 'map/draft': 'e2e_%d_draft' % w, 'win': 'e2e_%d_win' % w, 'gameover': 'e2e_%d_over' % w}
        final = play_run(page, log, shots)
        print(w, cls, "final:", final, "screens:", '>'.join(log)[:400], flush=True)
        print("  errors:", errors[:3])
        b.close()
