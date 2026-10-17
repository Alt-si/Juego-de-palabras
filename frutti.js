"use strict";
// Tutti Frutti: duelo por letra y categorías (en vivo o por link). Corrección: existe / bien escrita / repetida con el rival.
const TF_LETTERS = "ABCDEFGHILMNOPRSTV", TF_LIMIT = 120, TF_GRACE = 20, TF_BONUS = 10;
const TF_BY = Object.fromEntries(TF_CATS.map((c) => [c[0], { id: c[0], name: c[1], icon: c[2], words: c[3].split(",") }]));
let TF = null, TFT = 0;
const tfN = (s) => String(s || "").toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ").replace(/[^a-zñ0-9]/g, "");
const tfIdx = {};
function tfIndex(id) {
  if (!tfIdx[id]) {
    const m = new Map(), add = (w) => { const k = tfN(w); if (k && !m.has(k)) m.set(k, String(w).trim()); };
    TF_BY[id].words.forEach(add); ((typeof TF_EXTRA !== "undefined" && TF_EXTRA[id]) || "").split(",").forEach(add);
    try { buildAdivina(); const cs = (typeof TF_ADI !== "undefined" && TF_ADI[id]) || []; ADI.cats.forEach((c) => { if (cs.includes(c.name)) c.words.forEach((e) => add(e.w)); }); } catch {}
    tfIdx[id] = m;
  }
  return tfIdx[id];
}
// letras de cada ronda: todas distintas dentro de cada tanda de 18
function tfLetters(seed, n) {
  const r = mulberry(seed), out = [];
  while (out.length < n) { const a = TF_LETTERS.split(""); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } out.push(...a); }
  return out.slice(0, n);
}
const tfLetter = (seed, r = 0) => tfLetters(seed, r + 1)[r];
const tfSel = () => { const s = SV.tfCats && SV.tfCats.filter((c) => TF_BY[c]); return s && s.length >= 3 ? s : ["nombres", "merc", "anim", "pais", "colo"]; };

// Evalúa una respuesta: { st: vacio|letra|ok|mal|no, word (forma correcta), pts }
function tfCheck(id, ans, letter) {
  const raw = String(ans || "").trim(); if (!raw) return { st: "vacio", pts: 0, word: "" };
  const g = tfN(raw), L = letter.toLowerCase();
  if (!g || g[0] !== L) return { st: "letra", pts: 0, word: "" };
  const idx = tfIndex(id); let hit = idx.get(g), key = g;
  if (!hit) for (const v of [g.replace(/es$/, ""), g.replace(/s$/, ""), g + "s", g + "es"]) if (v !== g && idx.get(v)) { hit = idx.get(v); key = v; break; }
  if (hit) return { st: "ok", pts: 10, word: hit, key };
  if (g.length >= 4) for (const [k, w] of idx) if (k[0] === L && Math.abs(k.length - g.length) <= 2 && k.length >= 4 && editDist(g, k) <= (k.length >= 9 ? 2 : 1)) return { st: "mal", pts: 5, word: w, key: k };
  return { st: "no", pts: 0, word: "" };
}
// Puntaje completo de un jugador contra el otro (opp puede ser null).
const tfAppr = (x, raw, letter) => (["no", "mal"].includes(x.st) && tfN(raw)[0] === letter.toLowerCase() ? { st: "ok", pts: 10, word: String(raw).trim(), key: tfN(raw), appr: true } : x);
function tfScore(cats, letter, mine, opp, ap) {
  ap = ap || { a: new Set(), b: new Set() };
  const rows = cats.map((id, i) => {
    let a = tfCheck(id, mine.ans[i], letter), b = opp ? tfCheck(id, opp.ans[i], letter) : null;
    if (ap.a.has(i) || (mine.ok && mine.ok.includes(i))) a = tfAppr(a, mine.ans[i], letter);
    if (b && (ap.b.has(i) || (opp.ok && opp.ok.includes(i)))) b = tfAppr(b, opp.ans[i], letter);
    const rep = !!(b && a.key && b.key && a.key === b.key);
    return { id, a, b, rep, pts: rep ? 5 : a.pts, opts: b ? (rep ? 5 : b.pts) : 0 };
  });
  const fullMe = rows.every((x) => x.a.st !== "vacio"), fullOpp = !!opp && rows.every((x) => x.b.st !== "vacio");
  let bonus = 0, bonusOpp = 0; // el más rápido (con todo completado) suma extra; si empatan por menos de 0,5 s, nadie
  if (opp && Math.abs(mine.time - opp.time) >= 0.5) { if (mine.time < opp.time) { if (fullMe) bonus = TF_BONUS; } else if (fullOpp) bonusOpp = TF_BONUS; }
  const sum = rows.reduce((t, r) => t + r.pts, 0), sumOpp = rows.reduce((t, r) => t + r.opts, 0);
  return { rows, bonus, bonusOpp, total: sum + bonus, totalOpp: sumOpp + bonusOpp };
}

// ---------- Pantalla de inicio ----------
const TF_ROUNDS = [5, 10, 15, 20];
const tfRoundsSel = () => (TF_ROUNDS.includes(SV.tfRounds) ? SV.tfRounds : 5);
function tfOpen() { $("#menu").hidden = true; $("#tfGame").hidden = true; $("#tfHome").hidden = false; tfHome(); }
function tfHome() {
  SCENES.apply(SCENES.world(5)); applyTheme(); $("#tfCoins").textContent = SV.wal.tf || 0; $("#tfRank").textContent = ptsOf("tf") + " pts";
  const sel = new Set(tfSel());
  $("#tfCats").innerHTML = TF_CATS.map((c) => `<button class="chip${sel.has(c[0]) ? " on" : ""}" data-tfc="${c[0]}">${c[2]} ${c[1]}</button>`).join("");
  $("#tfRounds").innerHTML = TF_ROUNDS.map((n) => `<button class="chip${n === tfRoundsSel() ? " on" : ""}" data-tfr="${n}">${n} partidas</button>`).join("");
  tfCount();
}
function tfCount() { const n = tfSel().length; $("#tfCount").textContent = `${n} categorías elegidas (de 3 a 8) · gana quien más puntos acumule en ${tfRoundsSel()} partidas`; }
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-tfc]");
  if (c) {
    const s = new Set(tfSel()), id = c.dataset.tfc;
    if (s.has(id)) { if (s.size <= 3) return toast("Mínimo 3 categorías"); s.delete(id); } else { if (s.size >= 8) return toast("Máximo 8 categorías"); s.add(id); }
    SV.tfCats = [...s]; save(); c.classList.toggle("on", s.has(id)); return tfCount();
  }
  const rb = e.target.closest("[data-tfr]");
  if (rb) { SV.tfRounds = +rb.dataset.tfr; save(); document.querySelectorAll("[data-tfr]").forEach((x) => x.classList.toggle("on", x === rb)); return tfCount(); }
  if (e.target.id === "tfRand") { SV.tfCats = dxSeedPick(TF_CATS.map((x) => x[0]), Math.floor(Math.random() * 1e9), 5); save(); return tfHome(); }
  if (e.target.id === "tfBack") { $("#tfHome").hidden = true; return showMenu(); }
  const b = e.target.closest("[data-tf]"); if (!b) return;
  askName(() => { const cats = tfSel(), rounds = tfRoundsSel(); if (b.dataset.tf === "live") { liveHost("tf"); LIVE.cats = cats; LIVE.rounds = rounds; } else tfStart(Math.floor(Math.random() * 1e9), cats, rounds, null, false); });
});

// ---------- Partida (varias rondas que se acumulan) ----------
function tfCountdown(seed, cats, rounds, msg) {
  let n = 3; modal(`<h2>${msg || "⚔ " + oppName()}</h2><p>Tutti Frutti · ${cats.length} categorías · ${rounds} partidas</p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); tfStart(seed, cats, rounds, null, true); } else $("#cd").textContent = n; }, 1000);
}
function tfStart(seed, cats, rounds, from, live) {
  closeModal(); history.replaceState(null, "", location.pathname); clearInterval(TFT);
  TF = { on: true, seed, cats, rounds, r: 0, ap: [], letters: tfLetters(seed, rounds), from, live: !!live, tot: 0, totOpp: 0, log: [], mine: [], oppR: {}, scored: -1, ready: -1, oppReady: -1, paidEnd: false };
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true)); adOn = false; SCENES.apply(SCENES.world(5));
  $("#tfRival").hidden = !live; $("#tfGame").hidden = false; tfRound();
}
function tfRound() {
  closeModal(); clearInterval(TFT);
  Object.assign(TF, { letter: TF.letters[TF.r], t0: Date.now(), done: false, me: null, endAt: 0, sent: -1, warned: false });
  $("#tfLetter").textContent = TF.letter; $("#tfTotal").textContent = SV.wal.tf || 0;
  $("#tfSum").textContent = `Partida ${TF.r + 1}/${TF.rounds} · acumulado ${TF.tot}${TF.live || TF.from ? " vs " + TF.totOpp : ""}`;
  $("#tfRows").innerHTML = TF.cats.map((id, i) => `<label class="tfrow"><span>${TF_BY[id].icon} ${TF_BY[id].name}</span><input data-tfi="${i}" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="${TF.letter}…"></label>`).join("");
  if (TF.live) { $("#tfRival").hidden = false; $("#tfRival").textContent = "⚔ Conectando con el rival…"; tfBar(); }
  $("#tfRows input").focus(); TFT = setInterval(tfTick, 250); tfTick();
}
const tfFilled = () => [...document.querySelectorAll("#tfRows input")].filter((i) => i.value.trim()).length;
function tfBar() {
  if (!TF || !TF.live || !LIVE) return; const o = LIVE.opp, opR = TF.oppR[TF.r];
  $("#tfRival").hidden = false; $("#tfRival").textContent = `⚔ ${o.name || "Rival"}: ${opR ? TF.cats.length : o.n}/${TF.cats.length} palabras · acum. ${TF.totOpp}${o.left ? " (se fue)" : opR ? " ✔ ¡terminó!" : ""}`;
}
function tfTick() {
  if (!TF || TF.done) return;
  const el = (Date.now() - TF.t0) / 1000; let left = TF_LIMIT - el;
  if (TF.endAt) left = Math.min(left, (TF.endAt - Date.now()) / 1000);
  $("#tfTime").textContent = Math.max(0, Math.ceil(left)) + " s"; $("#tfTime").classList.toggle("hot", left <= 10);
  $("#tfBar").style.width = Math.max(0, Math.min(100, (left / TF_LIMIT) * 100)) + "%";
  if (left <= 0) tfFinish(true);
}
document.addEventListener("input", (e) => {
  if (!e.target.matches("#tfRows input") || !TF || TF.done || !TF.live) return;
  const n = tfFilled(); if (n !== TF.sent) { TF.sent = n; Net.send({ t: "prog", n, pts: 0, r: TF.r }); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("#tfRows input")) { const all = [...document.querySelectorAll("#tfRows input")], i = all.indexOf(e.target); if (i < all.length - 1) all[i + 1].focus(); else e.target.blur(); } });
function tfBastaClick() { const b = document.getElementById("tfBasta"); b.click(); b.click(); }
document.addEventListener("click", (e) => {
  if (e.target.id === "tfBasta") { if (TF && !TF.done) { const f = tfFilled(); if (f < TF.cats.length) { if (!TF.warned) { TF.warned = true; return toast(`Te faltan ${TF.cats.length - f}: sin completar todo no ganás el bonus. Tocá de nuevo para terminar.`); } } tfFinish(false); } }
  if (e.target.id === "tfQuit" && TF) modal(`<h2>¿Abandonar el duelo?</h2><p>Perdés este duelo.</p><button class="big" id="tfQuitOk">Abandonar</button><button class="link" data-close>Seguir jugando</button>`);
  if (e.target.id === "tfQuitOk" || e.target.id === "tfHomeBtn") tfExit();
  const ok = e.target.closest("[data-tfok]");
  if (ok && TF) {
    const [side, i] = ok.dataset.tfok.split(":"), ap = TF.ap[TF.r] || (TF.ap[TF.r] = { a: new Set(), b: new Set() }); ap[side].add(+i);
    if (TF.live) Net.send({ t: "tfok", r: TF.r, i: +i, own: side === "a" });
    return tfResult();
  }
  if (e.target.id === "tfNext" && TF) tfNext();
  if (e.target.id === "tfFinalBtn" && TF) tfFinal();
});
function tfExit() { clearInterval(TFT); if (LIVE) { Net.send({ t: "quit" }); liveReset(); } TF = null; closeModal(); $("#tfGame").hidden = true; showMenu(); }
function tfFinish() {
  if (!TF || TF.done) return; TF.done = true; clearInterval(TFT);
  const time = Math.min(TF_LIMIT, Math.round(((Date.now() - TF.t0) / 1000) * 10) / 10);
  const ans = [...document.querySelectorAll("#tfRows input")].map((i) => i.value.trim().replace(/[|~^;]/g, " ").replace(/^\++/, "").slice(0, 30));
  TF.me = { ans, time }; TF.mine[TF.r] = TF.me; document.querySelectorAll("#tfRows input").forEach((i) => (i.disabled = true));
  if (TF.live) {
    Net.send({ t: "tfdone", ans, time, r: TF.r });
    if (TF.oppR[TF.r] || (LIVE && LIVE.opp.left)) return tfResult();
    return modal(`<h2>⏳ ¡Terminaste en ${time} s!</h2><p>Esperando que ${oppName()} termine…</p><button class="link" id="tfHomeBtn">Salir</button>`, true);
  }
  tfResult();
}
function tfMsg(m) {
  if (!TF || !TF.on || !TF.live) return false;
  if (m.t === "prog") { if (m.r === TF.r || m.r === undefined) LIVE.opp.n = +m.n || 0; tfBar(); return true; }
  if (m.t === "tfdone") {
    TF.oppR[+m.r || 0] = { ans: (Array.isArray(m.ans) ? m.ans : []).slice(0, TF.cats.length).map((x) => String(x).slice(0, 30)), time: Math.min(TF_LIMIT, +m.time || TF_LIMIT), name: LIVE.opp.name };
    if (+m.r === TF.r) { if (!TF.done) { TF.endAt = Date.now() + TF_GRACE * 1000; toast(`¡${LIVE.opp.name || "Tu rival"} terminó! Tenés ${TF_GRACE} s`); } tfBar(); if (TF.done) tfResult(); }
    return true;
  }
  if (m.t === "tfok") { const r = +m.r, ap = TF.ap[r] || (TF.ap[r] = { a: new Set(), b: new Set() }); ap[m.own ? "b" : "a"].add(+m.i); toast(`${LIVE.opp.name || "Tu rival"} aceptó una palabra`); if (TF.r === r && TF.scored === r && TF.done) tfResult(); return true; }
  if (m.t === "tfnext") { TF.oppReady = Math.max(TF.oppReady, +m.r); tfAdvance(); return true; }
  if (m.t === "quit") { LIVE.opp.left = true; toast("El rival abandonó el duelo"); tfBar(); tfOppGone(); return true; }
  return false;
}
function tfOppGone() { if (TF && TF.done && !TF.oppR[TF.r] && TF.scored < TF.r) tfResult(); else if (TF && TF.scored === TF.r) tfResult(true); }

// ---------- Corrección y resultado ----------
const TF_ST = { ok: ["✔", "Bien escrita", "ok"], mal: ["✏", "Mal escrita", "mal"], no: ["✖", "No existe", "no"], letra: ["✖", "No empieza con la letra", "no"], vacio: ["—", "Sin respuesta", "vac"] };
function tfCell(x, raw, rep, side, i) {
  const st = x.appr ? ["✔", "Aceptada (verificada en la RAE)", "ok"] : TF_ST[x.st], r = rep ? ["🤝", "Repetida con el rival", "rep"] : st;
  const chk = !x.appr && (x.st === "no" || x.st === "mal") && raw ? `<span class="tfv"><a href="https://dle.rae.es/${encodeURIComponent(String(raw).trim().toLowerCase())}" target="_blank" rel="noopener">🔎 Ver en la RAE</a><button class="mini" data-tfok="${side}:${i}">✔ Es válida</button></span>` : "";
  return `<div class="tfc ${r[2]}"><b>${esc(raw || "—")}</b><small>${r[0]} ${r[1]}${x.st === "mal" && !x.appr ? ` · se escribe <u>${esc(x.word)}</u>` : ""}</small>${chk}</div>`;
}
const tfOppOf = (r) => (TF.live ? TF.oppR[r] : TF.from && TF.from.rounds[r]) || null;
function tfResult(again) {
  if (!TF) return; const r = TF.r, o = tfOppOf(r), hasOpp = !!o, name = esc((TF.live ? oppName() : TF.from && TF.from.name) || "Rival");
  const ap = TF.ap[r] || (TF.ap[r] = { a: new Set(), b: new Set() }), sc = tfScore(TF.cats, TF.letter, TF.me, o, ap);
  const prev = TF.log[r], dMe = sc.total - (prev ? prev.me : 0), dOpp = hasOpp ? sc.totalOpp - (prev && prev.opp != null ? prev.opp : 0) : 0;
  if (TF.scored < r) { TF.scored = r; beep(SND.coin || SND.ok); }
  TF.tot += dMe; TF.totOpp += dOpp; TF.log[r] = { l: TF.letter, me: sc.total, opp: hasOpp ? sc.totalOpp : null }; if (dMe) addPts("tf", dMe); save();
  $("#tfCoins").textContent = SV.wal.tf || 0; $("#tfSum").textContent = `Partida ${r + 1}/${TF.rounds} · acumulado ${TF.tot}${hasOpp || TF.live || TF.from ? " vs " + TF.totOpp : ""}`;
  const last = r >= TF.rounds - 1, oppLeft = TF.live && LIVE && LIVE.opp.left;
  const rows = sc.rows.map((x, i) => `<div class="tfrr"><h4>${TF_BY[x.id].icon} ${TF_BY[x.id].name}</h4><div class="tfpair">${tfCell(x.a, TF.me.ans[i], x.rep, "a", i)}${hasOpp ? tfCell(x.b, o.ans[i], x.rep, "b", i) : ""}</div><small class="pp">+${x.pts}${hasOpp ? ` · rival +${x.opts}` : ""}</small></div>`).join("");
  const bon = sc.bonus ? `<p class="tfbon">⚡ Fuiste más rápido (${TF.me.time} s): <b>+${TF_BONUS}</b></p>` : sc.bonusOpp ? `<p class="tfbon">⚡ ${name} fue más rápido (${o.time} s): +${TF_BONUS} para él</p>` : "";
  const vs = hasOpp ? `<div class="vs"><div><small>Vos · ${TF.me.time} s</small><b>${sc.total}</b></div><span>vs</span><div><small>${name} · ${o.time} s</small><b>${sc.totalOpp}</b></div></div><p class="tfacc">Acumulado: <b>${TF.tot}</b> vs <b>${TF.totOpp}</b></p>` : `<div class="vs"><div><small>Tu puntaje · ${TF.me.time} s</small><b>${sc.total}</b></div></div><p class="tfacc">Acumulado: <b>${TF.tot}</b></p>`;
  const btn = last || oppLeft ? '<button class="big" id="tfFinalBtn">🏁 Ver resultado final</button>' : TF.live ? `<button class="big" id="tfNext"${TF.ready >= r ? " disabled" : ""}>${TF.ready >= r ? "Esperando al rival…" : "▶ Siguiente partida"}</button>` : '<button class="big" id="tfNext">▶ Siguiente partida</button>';
  modal(`<div class="tfres"><h2>Partida ${r + 1} de ${TF.rounds} · letra ${TF.letter}</h2>${vs}${bon}<p class="tfhint">10 bien · 5 repetida o mal escrita · 0 no existe</p><div class="tfscroll">${rows}</div>${btn}<button class="link" id="tfHomeBtn">Salir</button></div>`, true);
}
function tfNext() {
  if (!TF) return;
  if (TF.live) { TF.ready = TF.r; Net.send({ t: "tfnext", r: TF.r }); const b = $("#tfNext"); if (b) { b.disabled = true; b.textContent = "Esperando al rival…"; } return tfAdvance(); }
  TF.r++; tfRound();
}
function tfAdvance() {
  if (!TF || !TF.live || TF.ready < TF.r || TF.oppReady < TF.r) return;
  TF.r++; let n = 3; modal(`<h2>Partida ${TF.r + 1} de ${TF.rounds}</h2><p>Letra <b>${TF.letters[TF.r]}</b></p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!TF || !LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); tfRound(); } else $("#cd").textContent = n; }, 1000);
}
function tfFinal() {
  if (!TF) return; const hasOpp = TF.live || !!TF.from, w = hasOpp ? (TF.tot > TF.totOpp ? 1 : TF.tot < TF.totOpp ? -1 : 0) : 0;
  if (!TF.paidEnd) { TF.paidEnd = true; if (hasOpp) { SV.duels++; if (w > 0) { SV.duelWins++; SV.wal.tf = (SV.wal.tf || 0) + TF.rounds * 10; } } save(); checkAch(); beep(w >= 0 ? SND.win : SND.lose); }
  $("#tfCoins").textContent = SV.wal.tf || 0;
  const oname = esc((TF.live ? oppName() : TF.from && TF.from.name) || "Rival");
  const head = !hasOpp ? "🏁 ¡Listo!" : w > 0 ? "🏆 ¡Ganaste el duelo!" : w < 0 ? "😮 Perdiste el duelo" : "🤝 ¡Empate!";
  const rows = TF.log.map((x, i) => x ? `<tr><td>${i + 1}</td><td>${x.l}</td><td>${x.me}</td>${hasOpp ? `<td>${x.opp == null ? "—" : x.opp}</td>` : ""}</tr>` : "").join("");
  const vs = hasOpp ? `<div class="vs"><div><small>Vos</small><b>${TF.tot}</b></div><span>vs</span><div><small>${oname}</small><b>${TF.totOpp}</b></div></div>` : `<div class="vs"><div><small>Tu total</small><b>${TF.tot}</b></div></div>`;
  const live = TF.live, left = live && LIVE && LIVE.opp.left;
  const btns = live ? (left ? "" : '<button class="big" id="tfRe">🔁 Revancha</button>') : `<button class="big" id="tfShare">📤 ${TF.from ? "Desafiar de vuelta" : "Invitar a un amigo"}</button><button class="mini wide" id="tfCopy">Copiar link</button>`;
  modal(`<div class="tfres"><h2>${head}</h2>${vs}${w > 0 ? `<p class="big2">+${TF.rounds * 10} 🪙</p>` : ""}${left ? "<p>Tu rival abandonó el duelo.</p>" : ""}${!hasOpp ? "<p>Mandá el desafío: tu amigo juega las mismas letras y gana quien acumule más puntos.</p>" : ""}<div class="tfscroll"><table class="tft"><tr><th>#</th><th>Letra</th><th>Vos</th>${hasOpp ? `<th>${oname}</th>` : ""}</tr>${rows}</table></div>${btns}<button class="link" id="tfHomeBtn">Inicio</button></div>`, true);
  if (live) { const re = $("#tfRe"); if (re) re.onclick = () => { if (LIVE.role === "host") sendStart(); else { Net.send({ t: "rematch" }); re.textContent = "Pedido enviado…"; re.disabled = true; } }; return; }
  const url = tfLink(), text = TF.from ? `¡Te devuelvo el desafío en Tutti Frutti (${TF.rounds} partidas)! Hice ${TF.tot} puntos.` : `${SV.name} te desafía en Tutti Frutti (${TF.rounds} partidas): hizo ${TF.tot} puntos. ¿Podés superarlo?`;
  $("#tfShare").onclick = () => { if (navigator.share) navigator.share({ title: "Juegos mentales", text, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank"); };
  $("#tfCopy").onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url));
}
const tfLink = () => `${location.origin}${location.pathname}#t=${TF.seed}~${TF.cats.join("-")}~${TF.rounds}~${encodeURIComponent(SV.name)}~${encodeURIComponent(TF.mine.map((x, r) => x.time + ";" + x.ans.map((a, i) => ((TF.ap[r] && TF.ap[r].a.has(i)) ? "+" : "") + a).join("|")).join("^"))}`;
function tfInvite() {
  const m = /^#t=(\d+)~([a-z-]+)~(\d+)~([^~]*)~(.*)$/.exec(location.hash); if (!m) return false;
  const cats = m[2].split("-").filter((c) => TF_BY[c]), rounds = +m[3]; if (cats.length < 3 || !TF_ROUNDS.includes(rounds) || TF) return true;
  let name = "Un amigo", rs = []; try { name = decodeURIComponent(m[4]).slice(0, 16) || name; rs = decodeURIComponent(m[5]).split("^").map((x) => { const [t, a] = x.split(";"); const raw = (a || "").split("|").slice(0, cats.length); return { time: Math.min(TF_LIMIT, +t || TF_LIMIT), ans: raw.map((y) => y.replace(/^\+/, "").slice(0, 30)), ok: raw.map((y, i) => (y[0] === "+" ? i : -1)).filter((i) => i >= 0) }; }); } catch {}
  if (rs.length !== rounds) { modal("<h2>Desafío incompleto</h2><p>El link está cortado. Pedile que lo mande de nuevo.</p><button class=\"big\" data-close>Entendido</button>"); return true; }
  const from = { name, rounds: rs };
  modal(`<h2>⚔ ¡${esc(name)} te desafió!</h2><p><b>Tutti Frutti</b> · ${rounds} partidas · ${cats.length} categorías. Jugás las mismas letras: gana quien acumule más puntos.</p><button class="big" id="tfAccept">Aceptar el desafío</button><button class="link" data-close>Ahora no</button>`, true);
  $("#tfAccept").onclick = () => askName(() => tfStart(+m[1], cats, rounds, from, false));
  return true;
}
tfInvite();
