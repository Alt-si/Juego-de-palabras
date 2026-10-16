"""Pruebas de humo de Anagrama: menú, los dos juegos, desafío por link y duelo en vivo (con PeerJS simulado)."""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = 8771
URL = f"http://localhost:{PORT}/"
SOLVE = """()=>{const u=new Set();for(const ch of G.target){const t=G.tiles.find(x=>x.ch===ch&&!u.has(x.id));u.add(t.id);document.querySelector('[data-tile="'+t.id+'"]').click();}}"""

def check(cond, msg):
    print(("OK   " if cond else "FAIL ") + msg)
    if not cond:
        sys.exit(1)

def play(page, n_ok, wait=1100):
    words = []
    for i in range(10):
        words.append(page.evaluate("G.target"))
        if i < n_ok: page.evaluate(SOLVE); page.wait_for_timeout(wait)
        else: page.click("#tSkip"); page.wait_for_timeout(1900)
    return words

srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=os.path.dirname(HERE), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []
        def newpage(ctx):
            pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); return pg
        V = {"width": 390, "height": 780}

        # --- menú + Anagrama ---
        pg = newpage(b.new_context(viewport=V)); pg.goto(URL); pg.wait_for_timeout(400)
        check(pg.title() == "Anagrama", "título Anagrama")
        check(pg.is_visible("#menu") and pg.is_visible('[data-game="hid"]'), "menú con los dos juegos")
        pg.click('[data-game="ana"]'); pg.click("#btnPlay")
        play(pg, 10)
        check(pg.evaluate("SV.level") == 2, "Anagrama: nivel 1 superado")
        pg.click("#nextLv"); pg.evaluate("G.left=0.05"); pg.wait_for_timeout(2000)
        check(pg.evaluate("G.lives") == 2, "Anagrama: perder tiempo resta una vida")

        # --- Palabras escondidas ---
        pg = newpage(b.new_context(viewport=V)); pg.goto(URL); pg.wait_for_timeout(400)
        pg.click('[data-game="hid"]'); pg.click("#btnPlay")
        check(pg.evaluate("G.kind") == "hid" and pg.evaluate("G.tiles.length - G.len") >= 3, "Escondidas: hay letras de más")
        pg.evaluate("G.left=10.2"); pg.wait_for_timeout(600)
        check(pg.evaluate("G.hl && G.hl.size") == pg.evaluate("G.len") and pg.locator(".tile.hl").count() == pg.evaluate("G.len"), "Escondidas: a los 10 s se marcan las letras de la palabra")
        play(pg, 10)
        check(pg.evaluate("SV.lvH") == 2 and pg.evaluate("SV.level") == 1, "Escondidas: nivel 1 superado (progreso aparte)")

        # --- desafío por link ---
        a = newpage(b.new_context(viewport=V)); a.goto(URL); a.click('[data-game="hid"]'); a.click("#btnDuel")
        a.fill("#nameIn", "Ana"); a.click("#nameOk"); a.wait_for_timeout(300)
        w1 = play(a, 10)
        link = a.evaluate("duelLink(G.duel.seed, G.duel.pts, G.duel.kind)")
        c = newpage(b.new_context(viewport=V)); c.goto(link); c.wait_for_timeout(400)
        check("te desafió" in c.inner_text("#box") and "Palabras escondidas" in c.inner_text("#box"), "link de desafío indica el juego")
        c.click("#accept"); c.fill("#nameIn", "Beto"); c.click("#nameOk"); c.wait_for_timeout(300)
        w2 = play(c, 3)
        check(w1 == w2, "desafío por link: mismas palabras")
        check("Perdiste" in c.inner_text("#box"), "desafío por link: se compara el resultado")

        # --- duelo en vivo ---
        ctx = b.new_context(viewport=V); ctx.add_init_script(path=os.path.join(HERE, "peer-shim.js"))
        h = newpage(ctx); g = newpage(ctx)
        h.goto(URL); g.goto(URL); h.wait_for_timeout(300)
        h.evaluate("SV.name='Ana';save()"); h.click('[data-game="ana"]'); h.click("#btnLive"); h.wait_for_timeout(500)
        check("Mandale este link" in h.inner_text("#box"), "en vivo: la sala muestra el código")
        code = h.evaluate("LIVE.code")
        g.goto(URL + f"#r={code}.ana"); g.wait_for_timeout(400)
        g.evaluate("SV.name='Beto';save()"); g.click("#liveEnter")
        h.wait_for_timeout(5000)
        check(h.evaluate("!!G && G.duel.live") and g.evaluate("!!G && G.duel.live"), "en vivo: arrancan los dos solos")
        words_h = h.evaluate("G.queue.map(x=>x.L).concat([G.target])"); words_g = g.evaluate("G.queue.map(x=>x.L).concat([G.target])")
        check(sorted(words_h) == sorted(words_g), "en vivo: mismas palabras")
        for _ in range(3):
            g.evaluate(SOLVE); g.wait_for_timeout(1100)
        h.wait_for_timeout(300)
        check("Beto" in h.inner_text("#gRival") and "3/10" in h.inner_text("#gRival"), "en vivo: se ve el avance del rival")
        play(g, 0) if False else None
        # Ana termina todo; Beto termina salteando
        play(h, 10)
        check("Esperando" in h.inner_text("#box"), "en vivo: espera al rival")
        for _ in range(7):
            g.click("#tSkip"); g.wait_for_timeout(1900)
        g.wait_for_timeout(500)
        check("Perdiste" in g.inner_text("#box") and "Ganaste" in h.inner_text("#box"), "en vivo: resultado para los dos")
        # revancha
        g.click("#lvRe"); g.wait_for_timeout(5000)
        check(g.evaluate("!!G && !G.over && G.duel.live") and h.evaluate("!!G && !G.over"), "en vivo: revancha")
        check(not errs, f"sin errores de JavaScript {errs}")
        b.close()
finally:
    srv.terminate()
print("Todo en verde")
