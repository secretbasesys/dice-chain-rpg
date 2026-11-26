import sys, json; sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors=launch(p,390,844,True)
    page.goto(BASE); page.wait_for_timeout(300)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(300)
    page.click('[data-act="help"]'); page.wait_for_timeout(300)
    page.screenshot(path=OUT + "/v22_help1.png")
    for t in ['combat','grow','meta']:
        page.click(f'[data-act="helptab"][data-tab="{t}"]'); page.wait_for_timeout(200)
        print(t, "rows:", page.evaluate("() => document.querySelectorAll('.help-row').length"))
    page.screenshot(path=OUT + "/v22_help4.png")
    # achievements
    print("ach total:", page.evaluate("() => DC.ACHIEVEMENTS.length"))
    print("LAYOUT", json.dumps(layout_report(page)))
    print("ERRORS", json.dumps(errors, ensure_ascii=False))
    b.close()
