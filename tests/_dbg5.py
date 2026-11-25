import sys, json
sys.path.insert(0, '/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()")
    page.reload(); page.wait_for_timeout(300)
    print(page.evaluate("""() => {
      const m = DC.Meta.get(); m.unlockedAsc = 3; DC.Meta.save();
      DC.Game.state.screen='title'; DC.UI.render();
      const btns = [...document.querySelectorAll('.asc-btn')].map(b=>b.outerHTML.slice(0,120));
      return JSON.stringify({btns, asc: DC.Game.state.ui.asc, label: document.querySelector('.asc-label').innerText});
    }"""))
    b.close()
