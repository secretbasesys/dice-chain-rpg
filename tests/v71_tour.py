"""v7.1 state tour: idle / die selected / slot armed / target, at 2x for detail."""
import sys, os
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *

serve()
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
    ctx = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page()
    errs = []
    page.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(500)
    page.click('[data-act="newrun"]'); page.wait_for_timeout(350)
    page.click('[data-act="pickclass"][data-id="warrior"]'); page.wait_for_timeout(500)
    if page.locator('[data-act="gift"]').count():
        page.click('[data-act="gift"][data-i="0"]'); page.wait_for_timeout(450)
    if page.locator('[data-act="closetut"]').count():
        page.click('[data-act="closetut"]'); page.wait_for_timeout(300)
    page.wait_for_timeout(400)
    if page.evaluate("() => DC.Game.state.screen") == 'map':
        page.locator('.node.avail').first.click(); page.wait_for_timeout(600)
    shot(page, "v71_idle")
    # first unused die
    page.locator('[data-act="hand"]:not(.used)').first.click(); page.wait_for_timeout(300)
    shot(page, "v71_die")
    # tap a slot that accepts it
    if page.locator('.slot.st-can').count():
        page.locator('.slot.st-can').first.click(); page.wait_for_timeout(500)
    shot(page, "v71_slot")
    # find an unfillable slot: arm it
    page.evaluate("() => { DC.Game.state.ui.sel = null; }")
    page.evaluate("() => { DC.Game.state.ui.arm = 2; DC.UI.render(); }"); page.wait_for_timeout(300)
    shot(page, "v71_arm")
    print("errors:", errs[:6])
    print(page.evaluate("""() => ({
      hint: (document.querySelector('.hintbar')||{}).textContent,
      slot: getComputedStyle(document.querySelector('.slot')).borderColor,
      foot: getComputedStyle(document.querySelector('.sk-foot')).backgroundColor,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      h: document.documentElement.scrollHeight, ih: innerHeight,
      combatChildren: [...document.querySelectorAll('.combat > *')].map(e => e.className + ':' + Math.round(e.getBoundingClientRect().height))
    })"""))
    b.close()
