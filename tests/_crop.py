import sys
sys.path.insert(0,'/workspace/work/dice-rpg/tests')
from harness import *
from PIL import Image
serve()
with sync_playwright() as p:
    b, ctx, page, errors = launch(p, 390, 844, True)
    page.goto(BASE); page.wait_for_timeout(350)
    page.evaluate("""() => { DC.Game.newRun(); DC.Game.pickClass('warrior'); DC.Game.startCombat('combat'); }""")
    page.wait_for_timeout(300)
    page.screenshot(path="/workspace/work/dice-rpg/tests/_shots/crop_full.png")
    b.close()
im = Image.open("/workspace/work/dice-rpg/tests/_shots/crop_full.png")
print(im.size)
# dice tray
im.crop((0, 640, 390, 760)).resize((780, 240)).save("/workspace/work/dice-rpg/tests/_shots/crop_dice.png")
# arena top
im.crop((0, 95, 390, 300)).resize((780, 410)).save("/workspace/work/dice-rpg/tests/_shots/crop_arena.png")
