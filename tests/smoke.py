"""Prueba de humo de Anagrama: juega un nivel completo y un duelo entre dos jugadores."""
import subprocess, sys, time
from playwright.sync_api import sync_playwright

PORT = 8771
URL = f"http://localhost:{PORT}/"
SOLVE = """()=>{const u=new Set();for(const ch of G.target){const t=G.tiles.find(x=>x.ch===ch&&!u.has(x.id));u.add(t.id);document.querySelector('[data-tile="'+t.id+'"]').click();}}"""

def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        sys.exit(1)

srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        errs = []
        ctx = b.new_context(viewport={"width": 390, "height": 780})
        pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL); pg.wait_for_timeout(400)
        check(pg.title() == "Anagrama", "título Anagrama")
        pg.click("#btnPlay")
        for _ in range(10):
            pg.evaluate(SOLVE); pg.wait_for_timeout(1000)
        check(pg.evaluate("SV.level") == 2, "nivel 1 superado y se pasa al 2")
        pg.click("#nextLv"); pg.evaluate("G.left=0.05"); pg.wait_for_timeout(2000)
        check(pg.evaluate("G.lives") == 2, "perder tiempo resta una vida")

        # duelo: dos jugadores ven las mismas palabras
        def duel(page, n_ok):
            words = []
            for i in range(10):
                words.append(page.evaluate("G.target"))
                if i < n_ok: page.evaluate(SOLVE)
                else: page.click("#tSkip")
                page.wait_for_timeout(2000)
            return words
        a = b.new_context(viewport={"width": 390, "height": 780}).new_page()
        a.on("pageerror", lambda e: errs.append(str(e)))
        a.goto(URL); a.click("#btnDuel"); a.fill("#nameIn", "Ana"); a.click("#nameOk"); a.wait_for_timeout(300)
        w1 = duel(a, 10)
        link = a.evaluate("duelLink(G.duel.seed, G.duel.pts)")
        c = b.new_context(viewport={"width": 390, "height": 780}).new_page()
        c.on("pageerror", lambda e: errs.append(str(e)))
        c.goto(link); c.wait_for_timeout(400)
        check("te desafió" in c.inner_text("#box"), "el link muestra la invitación")
        c.click("#accept"); c.fill("#nameIn", "Beto"); c.click("#nameOk"); c.wait_for_timeout(300)
        w2 = duel(c, 3)
        check(w1 == w2, "ambos jugadores reciben las mismas palabras")
        check("Perdiste" in c.inner_text("#box"), "se compara el resultado")
        check(not errs, f"sin errores de JavaScript {errs}")
        b.close()
finally:
    srv.terminate()
print("Todo en verde")
