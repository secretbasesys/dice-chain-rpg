"""v6.8 — patch notes modal."""
import sys, json; sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); DC.Game.state.ui.modal='settings'; DC.UI.render(); }")
    page.wait_for_timeout(250)
    print("button:", page.evaluate("() => { const b=document.querySelector('[data-act=\"patchnotes\"]'); return b ? b.textContent.trim() : 'none'; }"))
    page.click('[data-act="patchnotes"]'); page.wait_for_timeout(300)
    print("rows:", page.evaluate("() => document.querySelectorAll('.pn-row').length"),
          "first:", page.evaluate("() => { const r=document.querySelector('.pn-row'); return r ? r.textContent.replace(/\\s+/g,' ').slice(0,50) : 'none'; }"))
    shot(page, "patchnotes")
    page.click('[data-act="closepatch"]'); page.wait_for_timeout(250)
    print("back to settings:", page.evaluate("() => DC.Game.state.ui.modal"))
    print("errors:", errors[:3])
    b.close()
