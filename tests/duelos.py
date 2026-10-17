"""Pruebas de Tuti Frutti y de los duelos de Adivina / Frases / ¿Qué ves? (PeerJS simulado)."""
import os, subprocess, sys, time
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__)); PORT = 8772; URL = f"http://localhost:{PORT}/"
def check(c, m):
    print(("OK   " if c else "FAIL ") + m)
    if not c: sys.exit(1)
srv = subprocess.Popen([sys.executable, "-m", "http.server", str(PORT)], cwd=os.path.dirname(HERE), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []; V = {"width": 390, "height": 780}
        def np(ctx):
            pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); return pg
        pg = np(b.new_context(viewport=V)); pg.goto(URL); pg.wait_for_timeout(300)
        # corrector de Adivina
        check(pg.evaluate("spellOk('elefnate','elefante') && !spellOk('gato','pato')"), "corrector: acepta errores de tipeo")
        # puntaje de Tuti Frutti
        r = pg.evaluate("""(()=>{
          const L='A', cats=['anim','colo','fruta'];
          const me={ans:['Aguila','Azul','Anana'],time:30}, op={ans:['aguila','Amarilo','Arbol'],time:50};
          const s=tfScore(cats,L,me,op); return {rows:s.rows.map(r=>[r.a.st,r.pts,r.rep,r.opts,r.b.st]),total:s.total,opp:s.totalOpp,bonus:s.bonus};})()""")
        check(r["rows"][0][2] and r["rows"][0][1] == 5 and r["rows"][0][3] == 5, "Tuti: palabra repetida con el rival suma 5 a cada uno")
        check(r["rows"][1][0] == "ok" and r["rows"][1][1] == 10 and r["rows"][1][4] == "mal" and r["rows"][1][3] == 5, "Tuti: bien escrita 10, mal escrita 5")
        check(r["rows"][2][4] == "no" and r["rows"][2][3] == 0, "Tuti: palabra inexistente 0")
        check(r["rows"][2][0] == "ok" and r["bonus"] == 10 and r["total"] == 5 + 10 + 10 + 10, "Tuti: bonus por menor tiempo")
        check(pg.evaluate("tfCheck('anim','Zorro','A').st") == "letra", "Tuti: debe empezar con la letra")
        check(pg.evaluate("tfCheck('cuer','Pene','P').st") == "ok" and pg.evaluate("tfCheck('cielo','Planetas','P').st") == "ok" and pg.evaluate("tfCheck('cielo','planeta','P').st") == "ok", "Tuti: pene, planeta y planetas son válidas (plurales incluidos)")
        FIND = "(L)=>TF.cats.map(id=>{const m=tfIndex(id);for(const [k,w] of m) if(k[0]===L.toLowerCase()) return w;return '';})"
        def ronda(pg, texto=None):
            L = pg.evaluate("TF.letter"); words = pg.evaluate(FIND, L)
            for i, w in enumerate(words): pg.fill(f'[data-tfi="{i}"]', texto if texto and i == 0 else (w if not texto else ""))
            pg.evaluate("tfBastaClick()"); pg.wait_for_timeout(400)
            return words
        def siguiente(pg):
            pg.evaluate("(document.getElementById('tfNext')||document.getElementById('tfFinalBtn')).click()")
        # duelo por link (5 partidas acumuladas)
        a = np(b.new_context(viewport=V)); a.goto(URL); a.evaluate("SV.name='Ana';SV.tfCats=['anim','colo','fruta'];save()")
        a.click('[data-game="tf"]'); a.wait_for_timeout(200)
        check(a.is_visible("#tfHome") and a.locator("#tfCats .chip").count() >= 20 and a.locator("#tfRounds .chip").count() == 4, "Tuti: elegir categorías y cantidad de partidas")
        a.click('[data-tfr="10"]'); a.click('[data-tfr="5"]')
        a.click('[data-tf="link"]'); a.wait_for_timeout(300)
        check(a.locator("#tfRows input").count() == 3, "Tuti: una casilla por categoría")
        allw = []; letters = []
        for r in range(5):
            letters.append(a.evaluate("TF.letter")); allw.append(ronda(a)); check("Partida %d de 5" % (r + 1) in a.inner_text("#box"), f"Tuti: resultado de la partida {r+1}")
            siguiente(a); a.wait_for_timeout(300)
        check(len(set(letters)) == 5, "Tuti: cada partida tiene otra letra")
        check("Invitar a un amigo" in a.inner_text("#box") and a.evaluate("TF.tot") > 0, "Tuti: el que desafía ve el total acumulado y el link")
        link = a.evaluate("tfLink()")
        c = np(b.new_context(viewport=V)); c.goto(link); c.wait_for_timeout(400)
        check("te desafió" in c.inner_text("#box") and "5 partidas" in c.inner_text("#box"), "Tuti: link de desafío")
        c.click("#tfAccept"); c.fill("#nameIn", "Beto"); c.click("#nameOk"); c.wait_for_timeout(300)
        for r in range(5):
            check(c.evaluate("TF.letter") == letters[r], f"Tuti: misma letra en la partida {r+1}")
            ronda(c); siguiente(c); c.wait_for_timeout(300)
        check("vs" in c.inner_text("#box") and c.evaluate("TF.log.length") == 5 and "Desafiar de vuelta" in c.inner_text("#box"), "Tuti: resultado final acumulado contra el desafiante")
        # en vivo
        ctx = b.new_context(viewport=V); ctx.add_init_script(path=os.path.join(HERE, "peer-shim.js"))
        h = np(ctx); g = np(ctx); h.goto(URL); g.goto(URL); h.wait_for_timeout(300)
        h.evaluate("SV.name='Ana';SV.tfCats=['anim','colo','fruta'];SV.tfRounds=5;save()"); h.click('[data-game="tf"]'); h.click('[data-tf="live"]'); h.wait_for_timeout(600)
        code = h.evaluate("LIVE.code"); g.goto(URL + f"#r={code}.tf"); g.wait_for_timeout(400)
        g.evaluate("SV.name='Beto';save()"); g.click("#liveEnter"); h.wait_for_timeout(5000)
        check(h.evaluate("!!TF && TF.live") and g.evaluate("!!TF && TF.live") and h.evaluate("TF.letter") == g.evaluate("TF.letter") and g.evaluate("TF.cats.length") == 3 and g.evaluate("TF.rounds") == 5, "Tuti en vivo: arrancan con la misma letra, categorías y partidas")
        for r in range(5):
            L = h.evaluate("TF.letter"); wl = h.evaluate(FIND, L)
            h.fill('[data-tfi="0"]', wl[0]); g.wait_for_timeout(300)
            if r == 0: check("1/3" in g.inner_text("#tfRival"), "Tuti en vivo: se ve el avance del rival")
            for i, w in enumerate(wl): h.fill(f'[data-tfi="{i}"]', w)
            h.evaluate("tfBastaClick()"); g.wait_for_timeout(400)
            if r == 0: check(g.evaluate("TF.endAt") > 0 and "Esperando" in h.inner_text("#box"), "Tuti en vivo: el otro tiene tiempo límite al terminar el primero")
            g.fill('[data-tfi="0"]', "xxxx"); g.evaluate("tfBastaClick()"); g.wait_for_timeout(500)
            check("vs" in h.inner_text("#box") and "vs" in g.inner_text("#box"), f"Tuti en vivo: resultado de la partida {r+1}")
            h.evaluate("(document.getElementById('tfNext')||document.getElementById('tfFinalBtn')).click()"); g.evaluate("(document.getElementById('tfNext')||document.getElementById('tfFinalBtn')).click()")
            if r < 4: h.wait_for_timeout(4500)
        h.wait_for_timeout(600)
        check("Ganaste el duelo" in h.inner_text("#box") and "Perdiste el duelo" in g.inner_text("#box"), "Tuti en vivo: gana quien acumula más en las 5 partidas")
        # duelos de otros juegos (en vivo)
        for kind, scr in (("adi", "adGame"), ("cri", "crGame"), ("qv", "qvGame")):
            ctx = b.new_context(viewport=V); ctx.add_init_script(path=os.path.join(HERE, "peer-shim.js"))
            h = np(ctx); g = np(ctx); h.goto(URL); g.goto(URL); h.evaluate("SV.name='Ana';save()"); h.wait_for_timeout(300)
            h.evaluate(f"liveHost('{kind}')"); h.wait_for_timeout(600); code = h.evaluate("LIVE.code")
            g.goto(URL + f"#r={code}.{kind}"); g.wait_for_timeout(400); g.evaluate("SV.name='Beto';save()"); g.click("#liveEnter"); h.wait_for_timeout(5500)
            check(h.is_visible("#" + scr) and g.is_visible("#" + scr) and h.evaluate("!!D && D.live"), f"{kind} en vivo: arrancan los dos")
            check("Beto" in h.inner_text("#" + scr), f"{kind} en vivo: barra del rival")
            h.evaluate("dxFinish(40)"); g.wait_for_timeout(300); g.evaluate("dxFinish(10)"); g.wait_for_timeout(500)
            check("Ganaste" in h.inner_text("#box") and "Perdiste" in g.inner_text("#box"), f"{kind} en vivo: resultado")
        check(not errs, f"sin errores de JavaScript {errs}")
        b.close()
finally:
    srv.terminate()
print("Todo en verde")
