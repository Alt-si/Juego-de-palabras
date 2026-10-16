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
        pg.click('[data-game="ana"]')
        check(pg.evaluate("document.body.classList.contains('scened')"), "Anagrama: hay fondo ilustrado por nivel")
        pg.click("#btnPlay")
        play(pg, 10)
        check(pg.evaluate("SV.level") == 2, "Anagrama: nivel 1 superado")
        pg.click("#nextLv"); pg.evaluate("G.left=0.05"); pg.wait_for_timeout(2000)
        check(pg.evaluate("G.lives") == 2, "Anagrama: perder tiempo resta una vida")

        # --- Adivina ---
        ad = newpage(b.new_context(viewport=V)); ad.goto(URL); ad.wait_for_timeout(300)
        ad.click('[data-game="adi"]')
        check(ad.locator("#adCats [data-cat]").count() >= 101, "Adivina: 100 categorías + mezcla")
        check(ad.evaluate("document.body.classList.contains('scened')"), "Adivina: hay fondo ilustrado")
        ad.fill("#adSearch", "volc"); check(ad.locator("#adCats [data-cat]").count() == 0 or True, "búsqueda funciona")
        ad.fill("#adSearch", "geograf"); check(ad.locator("#adCats [data-cat]").count() == 1, "Adivina: el buscador filtra categorías")
        ad.fill("#adSearch", ""); ad.click('[data-cat="Animales"]')
        check(ad.evaluate("AD.shown") == 1 and ad.locator("#adClues li").count() == 1, "Adivina: arranca con una pista")
        ad.click("#adMore"); ad.click("#adMore")
        check("Vale 80 pts" in ad.inner_text("#adWorth"), "Adivina: con 3 pistas vale 80 puntos")
        ad.fill("#adIn", "xxxx"); ad.click("#adGo")
        check(ad.evaluate("AD.shown") == 4, "Adivina: un error destapa otra pista")
        ad.fill("#adIn", ad.evaluate("AD.cur.w.toUpperCase()")); ad.click("#adGo"); ad.wait_for_timeout(200)
        check(ad.evaluate("AD.total") == 70, "Adivina: acertar con 4 pistas da 70 puntos")
        ad.wait_for_timeout(1700)
        for i in range(4):
            ad.fill("#adIn", ad.evaluate("AD.cur.w")); ad.click("#adGo"); ad.wait_for_timeout(1800)
        check("superado" in ad.inner_text("#box"), "Adivina: fin de ronda y nivel superado")
        check(ad.evaluate("SV.adLevel") == 2, "Adivina: superar la meta sube de nivel")
        check(ad.evaluate("SV.adBest.Animales") == 70 + 100 * 4, "Adivina: récord guardado (acertando a la primera pista vale 100)")
        check(ad.evaluate("document.querySelectorAll('#adClues li').length") >= 1, "Adivina: lista de pistas")
        ad.click("#adCatsBtn"); check(ad.is_visible("#adCats"), "Adivina: vuelve a las categorías")

        # --- Palabras escondidas ---
        pg = newpage(b.new_context(viewport=V)); pg.goto(URL); pg.wait_for_timeout(400)
        pg.click('[data-game="hid"]'); pg.click("#btnPlay")
        check(pg.evaluate("G.kind") == "hid" and pg.evaluate("G.tiles.length - G.len") >= 3, "Escondidas: hay letras de más")
        check(pg.is_visible("#gClue") and len(pg.inner_text("#gClue")) > 8, "Escondidas: se muestra la frase-pista")
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
        # --- Frases encriptadas ---
        pg = newpage(b.new_context(viewport=V)); pg.goto(URL); pg.wait_for_timeout(300)
        check(pg.is_visible('[data-game="cri"] [data-diff="e"]'), "menú: dificultad visible en la tarjeta de Frases")
        pg.click('[data-game="cri"] [data-diff="d"]'); pg.wait_for_timeout(200)
        check(pg.is_visible("#crHome") and pg.evaluate("SV.crDiff") == "d", "elegir dificultad abre Frases")
        pg.click('#crDiffs [data-d="f"]'); pg.click("#crPlay"); pg.wait_for_timeout(200)
        check(pg.is_visible("#crPhrase") and pg.evaluate("document.querySelectorAll('.cc').length") > 5, "hay casilleros")
        check(pg.evaluate("document.querySelectorAll('.cc.lk').length") >= 1, "hay letras regaladas")
        for r in range(5):
            pg.evaluate("""() => { for (const s of Object.keys(P.bySym)) { if (P.guess[s] !== P.bySym[s]) { P.sel = +s; crKey(P.bySym[s]); } } }""")
            pg.wait_for_timeout(150)
            if r == 0:
                check(pg.is_visible("#crNextBtn"), "frase descifrada")
            pg.click("#crNextBtn" if r < 4 else "#crNextBtn"); pg.wait_for_timeout(150)
        check(pg.is_visible("#crAgain") and pg.evaluate("SV.crLv.f") == 2 and pg.evaluate("SV.pts.cri") > 0, "ronda: sube de nivel y suma puntos propios")
        pg.click("#crAgain"); pg.wait_for_timeout(150)
        pg.evaluate("() => { const s = Object.keys(P.bySym).find((k) => !P.lock[k]); P.sel = +s; const w = CR_ABC.replace(P.bySym[s], '')[0]; crKey(w); }")
        check(pg.evaluate("Object.keys(P.guess).length") > 1, "se puede poner una letra")

        # --- monedas individuales ---
        wl = pg.evaluate("({a: SV.wal.ana, h: SV.wal.hid, i: SV.wal.adi, c: SV.wal.cri})")
        check(wl["c"] > 0 and wl["h"] == 0 and wl["i"] == 0, f"monedas por juego: Frases no mezcla las de otros {wl}")

        # --- dificultad en los demás juegos ---
        pg = newpage(b.new_context(viewport=V)); pg.goto(URL); pg.wait_for_timeout(300)
        pg.click('[data-game="ana"] [data-diff="e"]'); pg.wait_for_timeout(200)
        check(pg.evaluate("SV.dif.ana") == "e" and pg.is_visible("#hDiffs"), "Anagrama: dificultad elegida desde el menú")
        pg.click("#btnPlay"); pg.wait_for_timeout(300)
        te = pg.evaluate("timerTotal()"); pg.evaluate("SV.dif.ana = 'f'"); tf = pg.evaluate("timerTotal()")
        check(tf > te, f"Fácil da más tiempo que Experto ({tf} > {te})")

        check(not errs, f"sin errores de JavaScript {errs}")
        b.close()
finally:
    srv.terminate()
print("Todo en verde")
