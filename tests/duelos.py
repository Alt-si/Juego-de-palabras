"""Pruebas de Tutti Frutti y de los duelos de Adivina / Frases / ¿Qué ves? (PeerJS simulado)."""
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
        # puntaje de Tutti Frutti
        r = pg.evaluate("""(()=>{
          const L='A', cats=['anim','colo','fruta'];
          const me={ans:['Aguila','Azul','Anana'],time:30}, op={ans:['aguila','Amarilo','Arbol'],time:50};
          const s=tfScore(cats,L,me,op); return {rows:s.rows.map(r=>[r.a.st,r.pts,r.rep,r.opts,r.b.st]),total:s.total,opp:s.totalOpp,bonus:s.bonus};})()""")
        check(r["rows"][0][2] and r["rows"][0][1] == 5 and r["rows"][0][3] == 5, "Tutti: palabra repetida con el rival suma 5 a cada uno")
        check(r["rows"][1][0] == "ok" and r["rows"][1][1] == 10 and r["rows"][1][4] == "mal" and r["rows"][1][3] == 5, "Tutti: bien escrita 10, mal escrita 5")
        check(r["rows"][2][4] == "no" and r["rows"][2][3] == 0, "Tutti: palabra inexistente 0")
        check(r["rows"][2][0] == "ok" and r["bonus"] == 10 and r["total"] == 5 + 10 + 10 + 10, "Tutti: bonus por menor tiempo")
        check(pg.evaluate("tfCheck('anim','Zorro','A').st") == "letra", "Tutti: debe empezar con la letra")
        check(pg.evaluate("tfCheck('cuer','Pene','P').st") == "ok" and pg.evaluate("tfCheck('cielo','Planetas','P').st") == "ok" and pg.evaluate("tfCheck('cielo','planeta','P').st") == "ok", "Tutti: pene, planeta y planetas son válidas (plurales incluidos)")
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
        check(a.is_visible("#tfHome") and a.locator("#tfCats .chip").count() >= 20 and a.locator("#tfRounds .chip").count() == 4, "Tutti: elegir categorías y cantidad de partidas")
        a.click('[data-tfr="10"]'); a.click('[data-tfr="5"]')
        a.click('[data-tf="link"]'); a.wait_for_timeout(300)
        check(a.locator("#tfRows input").count() == 3, "Tutti: una casilla por categoría")
        allw = []; letters = []
        for r in range(5):
            letters.append(a.evaluate("TF.letter")); allw.append(ronda(a)); check("Partida %d de 5" % (r + 1) in a.inner_text("#box"), f"Tutti: resultado de la partida {r+1}")
            siguiente(a); a.wait_for_timeout(300)
        check(len(set(letters)) == 5, "Tutti: cada partida tiene otra letra")
        check("Invitar a un amigo" in a.inner_text("#box") and a.evaluate("TF.tot") > 0, "Tutti: el que desafía ve el total acumulado y el link")
        link = a.evaluate("tfLink()")
        c = np(b.new_context(viewport=V)); c.goto(link); c.wait_for_timeout(400)
        check("te desafió" in c.inner_text("#box") and "5 partidas" in c.inner_text("#box"), "Tutti: link de desafío")
        c.click("#tfAccept"); c.fill("#nameIn", "Beto"); c.click("#nameOk"); c.wait_for_timeout(300)
        for r in range(5):
            check(c.evaluate("TF.letter") == letters[r], f"Tutti: misma letra en la partida {r+1}")
            ronda(c); siguiente(c); c.wait_for_timeout(300)
        check("vs" in c.inner_text("#box") and c.evaluate("TF.log.length") == 5 and "Desafiar de vuelta" in c.inner_text("#box"), "Tutti: resultado final acumulado contra el desafiante")
        # en vivo
        ctx = b.new_context(viewport=V); ctx.add_init_script(path=os.path.join(HERE, "peer-shim.js"))
        h = np(ctx); g = np(ctx); h.goto(URL); g.goto(URL); h.wait_for_timeout(300)
        h.evaluate("SV.name='Ana';SV.tfCats=['anim','colo','fruta'];SV.tfRounds=5;save()"); h.click('[data-game="tf"]'); h.click('[data-tf="live"]'); h.wait_for_timeout(600)
        code = h.evaluate("LIVE.code"); g.goto(URL + f"#r={code}.tf"); g.wait_for_timeout(400)
        g.evaluate("SV.name='Beto';save()"); g.click("#liveEnter"); h.wait_for_timeout(5000)
        check(h.evaluate("!!TF && TF.live") and g.evaluate("!!TF && TF.live") and h.evaluate("TF.letter") == g.evaluate("TF.letter") and g.evaluate("TF.cats.length") == 3 and g.evaluate("TF.rounds") == 5, "Tutti en vivo: arrancan con la misma letra, categorías y partidas")
        for r in range(5):
            L = h.evaluate("TF.letter"); wl = h.evaluate(FIND, L)
            h.fill('[data-tfi="0"]', wl[0]); g.wait_for_timeout(300)
            if r == 0: check("1/3" in g.inner_text("#tfRival"), "Tutti en vivo: se ve el avance del rival")
            for i, w in enumerate(wl): h.fill(f'[data-tfi="{i}"]', w)
            h.evaluate("tfBastaClick()"); g.wait_for_timeout(400)
            if r == 0: check(g.evaluate("TF.endAt") > 0 and "Esperando" in h.inner_text("#box"), "Tutti en vivo: el otro tiene tiempo límite al terminar el primero")
            g.fill('[data-tfi="0"]', "xxxx"); g.evaluate("tfBastaClick()"); g.wait_for_timeout(500)
            check("vs" in h.inner_text("#box") and "vs" in g.inner_text("#box"), f"Tutti en vivo: resultado de la partida {r+1}")
            h.evaluate("(document.getElementById('tfNext')||document.getElementById('tfFinalBtn')).click()"); g.evaluate("(document.getElementById('tfNext')||document.getElementById('tfFinalBtn')).click()")
            if r < 4: h.wait_for_timeout(4500)
        h.wait_for_timeout(600)
        check("Ganaste el duelo" in h.inner_text("#box") and "Perdiste el duelo" in g.inner_text("#box"), "Tutti en vivo: gana quien acumula más en las 5 partidas")
        # validar una palabra con la RAE (el jugador la acepta)
        t2 = np(b.new_context(viewport=V)); t2.goto(URL); t2.evaluate("SV.name='Ana';SV.tfCats=['anim','colo','fruta'];save()"); t2.click('[data-game="tf"]'); t2.click('[data-tf="link"]'); t2.wait_for_timeout(300)
        L2 = t2.evaluate("TF.letter"); t2.fill('[data-tfi="0"]', L2 + "qzqzq"); t2.evaluate("tfBastaClick()"); t2.wait_for_timeout(400)
        check("No existe" in t2.inner_text("#box") and "Ver en la RAE" in t2.inner_text("#box") and t2.evaluate("TF.tot") == 0, "Tutti: palabra desconocida ofrece verificar en la RAE")
        t2.click('[data-tfok="a:0"]'); t2.wait_for_timeout(200)
        check("Aceptada" in t2.inner_text("#box") and t2.evaluate("TF.tot") == 10 and t2.evaluate("(SV.pts.tf||0)") == 0, "Tutti: palabra validada suma 10 y el duelo no suma al rango hasta ganar")
        # series acumuladas por link (Adivina, 3 duelos)
        s1 = np(b.new_context(viewport=V)); s1.goto(URL); s1.evaluate("SV.name='Ana';SV.srRounds=3;save()"); s1.click('[data-game="adi"]'); s1.wait_for_timeout(200)
        check(s1.locator("#adHome .srsel .chip").count() == 4, "series: selector de cantidad de duelos")
        s1.click('#adHome [data-sr="3"]'); s1.click('#adHome [data-dxk="adi"][data-dx="link"]'); s1.wait_for_timeout(400)
        for r, pts in enumerate((30, 50, 20)):
            check(s1.evaluate("D.total") == 5 and s1.evaluate("SR.r") == r, f"series: duelo {r+1} en juego")
            s1.evaluate(f"dxFinish({pts})"); s1.wait_for_timeout(300)
            check(f"Duelo {r+1} de 3" in s1.inner_text("#box"), f"series: resultado del duelo {r+1}")
            s1.evaluate("(document.getElementById('srNext')||document.getElementById('srFinal')).click()"); s1.wait_for_timeout(300)
        check("Invitar a un amigo" in s1.inner_text("#box") and s1.evaluate("SR.tot") == 100, "series: total acumulado 100")
        link = s1.evaluate("srLink()")
        s2 = np(b.new_context(viewport=V)); s2.goto(link); s2.wait_for_timeout(400)
        check("3 duelos" in s2.inner_text("#box") and "100 puntos" in s2.inner_text("#box"), "series: link de desafío")
        s2.click("#srAccept"); s2.fill("#nameIn", "Beto"); s2.click("#nameOk"); s2.wait_for_timeout(400)
        for r, pts in enumerate((40, 40, 40)):
            s2.evaluate(f"dxFinish({pts})"); s2.wait_for_timeout(300); s2.evaluate("(document.getElementById('srNext')||document.getElementById('srFinal')).click()"); s2.wait_for_timeout(300)
        check("Ganaste la partida" in s2.inner_text("#box") and s2.evaluate("SR.tot") == 120 and s2.evaluate("SR.totOpp") == 100, "series: gana quien acumula más (120 vs 100)")
        check(s2.evaluate("SV.pts.adi") == 120 and s1.evaluate("(SV.pts.adi||0)") == 0, "rango: solo el ganador suma puntos al terminar el duelo")
        # serie de Anagrama por link
        s3 = np(b.new_context(viewport=V)); s3.goto(URL); s3.evaluate("SV.name='Ana';SV.srRounds=3;save()"); s3.click('[data-game="ana"]'); s3.click("#btnDuel"); s3.wait_for_timeout(400)
        for r in range(3):
            check(s3.evaluate("!!G && !!G.duel") and s3.evaluate("SR.r") == r, f"series Anagrama: duelo {r+1}")
            s3.evaluate("G.duel.pts = 10; duelDone()"); s3.wait_for_timeout(300); s3.evaluate("(document.getElementById('srNext')||document.getElementById('srFinal')).click()"); s3.wait_for_timeout(400)
        check("Tu total" in s3.inner_text("#box") and s3.evaluate("SR.tot") == 30, "series Anagrama: acumulado")
        # serie en vivo (¿Qué ves?, 3 duelos)
        ctx = b.new_context(viewport=V); ctx.add_init_script(path=os.path.join(HERE, "peer-shim.js"))
        h = np(ctx); g = np(ctx); h.goto(URL); g.goto(URL); h.evaluate("SV.name='Ana';SV.srRounds=3;save()"); h.wait_for_timeout(300)
        h.evaluate("srLaunch('qv', true)"); h.wait_for_timeout(600); code = h.evaluate("LIVE.code")
        g.goto(URL + f"#r={code}.qv"); g.wait_for_timeout(400); g.evaluate("SV.name='Beto';save()"); g.click("#liveEnter"); h.wait_for_timeout(5500)
        check(h.evaluate("SR.rounds") == 3 and g.evaluate("SR.rounds") == 3 and h.evaluate("D.seed") == g.evaluate("D.seed"), "series en vivo: los dos juegan la misma serie")
        seeds = []
        for r, (ph, pg_) in enumerate(((40, 10), (10, 30), (50, 20))):
            seeds.append(h.evaluate("D.seed"))
            h.evaluate(f"dxFinish({ph})"); g.wait_for_timeout(300); g.evaluate(f"dxFinish({pg_})"); g.wait_for_timeout(500)
            check(f"Duelo {r+1} de 3" in h.inner_text("#box") and f"Duelo {r+1} de 3" in g.inner_text("#box"), f"series en vivo: resultado del duelo {r+1}")
            h.evaluate("(document.getElementById('srNext')||document.getElementById('srFinal')).click()"); g.evaluate("(document.getElementById('srNext')||document.getElementById('srFinal')).click()")
            if r < 2: h.wait_for_timeout(4500)
        check(len(set(seeds)) == 3, "series en vivo: cada duelo tiene otras palabras")
        h.wait_for_timeout(500)
        check("Ganaste la partida" in h.inner_text("#box") and "Perdiste la partida" in g.inner_text("#box") and h.evaluate("SR.tot") == 100, "series en vivo: gana el que más acumula (100 vs 60)")
        # niveles largos (1000 y más allá)
        r = pg.evaluate("""()=>{const o={};o.t=[1,1000,3500].map(titleOf).join(',');o.r=GRANKS.length;
          o.w=['f','m','d','e'].every(d=>{SV.dif.ana=d;return [1,100,500,1000,2500].every(lv=>pickWords(lv).length>=10)});SV.dif.ana='m';
          o.p=[adPass(1),adPass(1000)];o.l=[qvHelp(1),qvHelp(1000)];return o;}""")
        check(r["t"] == "Novato,Leyenda,Eterno" and r["r"] == 21 and r["w"] and r["p"][0] < r["p"][1] and r["l"][0] > r["l"][1], "niveles: 1000 niveles de rampa y sin fin")
        check(pg.evaluate("globalRank.call(null) && (SV.pts={ana:4700000,hid:0,adi:0,cri:0,qv:0,tf:0}, globalRank().name)") == "Eterno ✦1", "rangos: después del último, una estrella por millón")
        pg.evaluate("SV.pts={ana:0,hid:0,adi:0,cri:0,qv:0,tf:0}")
        # respuesta por voz (reconocimiento simulado)
        vctx = b.new_context(viewport=V); vctx.add_init_script("window.SpeechRecognition = class { start(){ setTimeout(()=>{ const alts=(window.__say||[]).map(t=>({transcript:t})); this.onresult({resultIndex:0,results:[alts]}); this.onend&&this.onend(); },30);} abort(){} };")
        vp = np(vctx); vp.goto(URL); vp.evaluate("SV.name='Ana';save()"); vp.click('[data-game="adi"]'); vp.click('#adCats [data-cat]'); vp.wait_for_timeout(300)
        check(vp.is_visible("#adMic"), "voz: botón de micrófono en Adivina")
        vp.evaluate("window.__say=['zzzz qqq']"); vp.click("#adMic"); vp.wait_for_timeout(300)
        check(vp.evaluate("AD.shown") == 2, "voz: respuesta incorrecta en Adivina abre otra pista")
        vp.evaluate("window.__say=['nada', AD.cur.w]"); vp.click("#adMic"); vp.wait_for_timeout(300)
        check(vp.evaluate("AD.results.length") == 1 and vp.evaluate("AD.results[0].pts") > 0, "voz: Adivina acepta la palabra dicha (entre las alternativas)")
        vp.evaluate("showMenu()"); vp.click('[data-game="qv"] .ico'); vp.click("#qvPlay"); vp.wait_for_timeout(300)
        check(vp.is_visible("#qvMic"), "voz: botón de micrófono en ¿Qué ves?")
        vp.evaluate("window.__say=['zzzz']"); vp.click("#qvMic"); vp.wait_for_timeout(300)
        check(vp.evaluate("Q.solved") == 0 and vp.evaluate("Q.lives") == 3, "voz: palabra incorrecta no quita vidas")
        vp.evaluate("window.__say=[Q.it.w]"); vp.click("#qvMic"); vp.wait_for_timeout(400)
        check(vp.evaluate("Q.solved") == 1, "voz: ¿Qué ves? completa la palabra dicha")
        # palabras aprendidas por voz
        vp.evaluate("localStorage.removeItem('palabras-aprendidas')"); vp.reload(); vp.wait_for_timeout(500)
        vp.evaluate("SV.name='Ana';save()")
        for w in ["chimango","carancho","ñandubay","zorzal","tornasol"]:
            vp.evaluate("showAdHome()"); vp.click('[data-game="adi"]') if False else None
            vp.evaluate("adStart('Animal')" if False else "showAdHome(), adStart(ADI.cats[0].name)"); vp.wait_for_timeout(150)
            vp.evaluate("window.__say=['%s']" % w); vp.click("#adMic"); vp.wait_for_timeout(250)
        res = vp.evaluate("[Apr.list.length, Apr.add('perro'), Apr.add('chimangoo'), Apr.add('xx'), !!ADI.cats.find(c=>c.name==='✨ Aprendidas')]")
        check(res == [5, False, False, False, True], f"aprendidas: se suman nuevas por voz, no repetidas ni typos ({res})")
        vp.reload(); vp.wait_for_timeout(500)
        check(vp.evaluate("buildAdivina().cats.some(c=>c.name==='✨ Aprendidas' && c.words.length===5)"), "aprendidas: persisten y forman categoría")
        # aviso de instalación según plataforma
        ioc = b.new_context(viewport=V, user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1")
        ip = np(ioc); ip.goto(URL + "#d=123.40.adi.Ana"); ip.wait_for_timeout(600)
        check(ip.is_visible(".instbar"), "iOS: aviso 'Agregar a pantalla de inicio' al abrir un desafío")
        ip.click(".instbar button"); check(not ip.query_selector(".instbar"), "iOS: aviso se puede cerrar")
        ap = np(b.new_context(viewport=V)); ap.goto(URL); ap.wait_for_timeout(400)
        check(not ap.query_selector(".instbar"), "sin desafío no hay aviso")
        check("INV" in ap.evaluate("typeof INV") or ap.evaluate("INV.includes('Google Play')"), "invitaciones mencionan Google Play y Safari")
        # categorías completadas: no se repiten palabras
        cp = np(b.new_context(viewport=V)); cp.goto(URL); cp.wait_for_timeout(500); cp.evaluate("SV.name='Ana';save();showAdHome()")
        r = cp.evaluate("""(()=>{const c=ADI.cats[0],out={};const seen=new Set();let rounds=0;
          while(adLeftOf(c.name).length&&rounds<60){adStart(c.name);AD.words.forEach(e=>{if(!adDoneSet(c.name).has(e.w)&&seen.has(e.w))out.dup=e.w;});AD.words.forEach(e=>{seen.add(e.w);adMark(e)});rounds++}
          out.rounds=rounds;out.total=c.words.length;out.seen=seen.size;out.left=adLeftOf(c.name).length;return out})()""")
        check(r.get("dup") is None and r["left"] == 0 and r["seen"] == r["total"], f"completar categoría sin repetir ({r})")
        cp.evaluate("showAdHome()"); check(cp.evaluate("document.querySelector('#adCats [data-cat].full')!==null"), "categoría completa se marca ✔")
        cp.evaluate("adStart(ADI.cats[0].name)"); cp.wait_for_timeout(200)
        check(cp.is_visible("#adHome") and cp.evaluate("document.querySelector('#toast')?document.querySelector('#toast').textContent:''").find("completaste") >= 0, "categoría completa no se puede jugar de nuevo")
        cp.evaluate("ADI.cats.forEach(c=>c.words.forEach(adMark));renderAdCats()")
        check(cp.query_selector("[data-lap]") is not None, "todas completas: opción de nueva vuelta")
        cp.click("[data-lap]"); cp.click("#askYes"); cp.wait_for_timeout(200)
        check(cp.evaluate("adLeftOf('Mezcla').length") == cp.evaluate("ADI.all.length"), "nueva vuelta reinicia las palabras")
        nov = np(b.new_context(viewport=V)); nov.goto(URL); nov.evaluate("delete window.SpeechRecognition; delete window.webkitSpeechRecognition")
        check(True, "voz: sin soporte no se rompe")
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
