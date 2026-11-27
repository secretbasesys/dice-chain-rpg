import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
serve()
with sync_playwright() as p:
    b,ctx,page,errors = launch(p,360,640,True)
    page.goto(BASE); page.wait_for_timeout(400)
    page.evaluate("() => localStorage.clear()"); page.reload(); page.wait_for_timeout(500)
    shot(page,'v75_title360')
    print(page.evaluate("() => ({ov: document.documentElement.scrollWidth>innerWidth+1, h: document.documentElement.scrollHeight, ih: innerHeight})"))
    b.close()
