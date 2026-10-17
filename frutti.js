"use strict";
// Tuti Frutti: duelo por letra y categorías (en vivo o por link). Corrección: existe / bien escrita / repetida con el rival.
const TF_LETTERS = "ABCDEFGHILMNOPRSTV", TF_LIMIT = 120, TF_GRACE = 20, TF_BONUS = 10;
const TF_BY = Object.fromEntries(TF_CATS.map((c) => [c[0], { id: c[0], name: c[1], icon: c[2], words: c[3].split(",") }]));
let TF = null, TFT = 0;
const tfN = (s) => String(s || "").toLowerCase().replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ").replace(/[^a-zñ0-9]/g, "");
const tfIdx = {};
function tfIndex(id) { if (!tfIdx[id]) { const m = new Map(); TF_BY[id].words.forEach((w) => { const k = tfN(w); if (k && !m.has(k)) m.set(k, w.trim()); }); tfIdx[id] = m; } return tfIdx[id]; }
const tfLetter = (seed) => TF_LETTERS[Math.floor(mulberry(seed)() * TF_LETTERS.length)];
const tfSel = () => { const s = SV.tfCats && SV.tfCats.filter((c) => TF_BY[c]); return s && s.length >= 3 ? s : ["nombres", "merc", "anim", "pais", "colo"]; };

// Evalúa una respuesta: { st: vacio|letra|ok|mal|no, word (forma correcta), pts }
function tfCheck(id, ans, letter) {
  const raw = String(ans || "").trim(); if (!raw) return { st: "vacio", pts: 0, word: "" };
  const g = tfN(raw), L = letter.toLowerCase();
  if (!g || g[0] !== L) return { st: "letra", pts: 0, word: "" };
  const idx = tfIndex(id), hit = idx.get(g);
  if (hit) return { st: "ok", pts: 10, word: hit, key: g };
  if (g.length >= 4) for (const [k, w] of idx) if (k[0] === L && Math.abs(k.length - g.length) <= 2 && k.length >= 4 && editDist(g, k) <= (k.length >= 9 ? 2 : 1)) return { st: "mal", pts: 5, word: w, key: k };
  return { st: "no", pts: 0, word: "" };
}
// Puntaje completo de un jugador contra el otro (opp puede ser null).
function tfScore(cats, letter, mine, opp) {
  const rows = cats.map((id, i) => {
    const a = tfCheck(id, mine.ans[i], letter), b = opp ? tfCheck(id, opp.ans[i], letter) : null;
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
function tfOpen() { $("#menu").hidden = true; $("#tfGame").hidden = true; $("#tfHome").hidden = false; tfHome(); }
function tfHome() {
  SCENES.apply(SCENES.world(5)); applyTheme(); $("#tfCoins").textContent = SV.wal.tf || 0; $("#tfRank").textContent = ptsOf("tf") + " pts";
  const sel = new Set(tfSel());
  $("#tfCats").innerHTML = TF_CATS.map((c) => `<button class="chip${sel.has(c[0]) ? " on" : ""}" data-tfc="${c[0]}">${c[2]} ${c[1]}</button>`).join("");
  tfCount();
}
function tfCount() { const n = tfSel().length; $("#tfCount").textContent = `${n} categorías elegidas (de 3 a 8)`; }
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-tfc]");
  if (c) {
    const s = new Set(tfSel()), id = c.dataset.tfc;
    if (s.has(id)) { if (s.size <= 3) return toast("Mínimo 3 categorías"); s.delete(id); } else { if (s.size >= 8) return toast("Máximo 8 categorías"); s.add(id); }
    SV.tfCats = [...s]; save(); c.classList.toggle("on", s.has(id)); return tfCount();
  }
  if (e.target.id === "tfRand") { SV.tfCats = dxSeedPick(TF_CATS.map((x) => x[0]), Math.floor(Math.random() * 1e9), 5); save(); return tfHome(); }
  if (e.target.id === "tfBack") { $("#tfHome").hidden = true; return showMenu(); }
  const b = e.target.closest("[data-tf]"); if (!b) return;
  askName(() => { const cats = tfSel(); if (b.dataset.tf === "live") { liveHost("tf"); LIVE.cats = cats; } else tfStart(Math.floor(Math.random() * 1e9), cats, null, false); });
});

// ---------- Partida ----------
function tfCountdown(seed, cats) {
  let n = 3; modal(`<h2>⚔ ${oppName()}</h2><p>Tuti Frutti · ${cats.length} categorías</p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); tfStart(seed, cats, null, true); } else $("#cd").textContent = n; }, 1000);
}
function tfStart(seed, cats, from, live) {
  closeModal(); history.replaceState(null, "", location.pathname); clearInterval(TFT);
  const letter = tfLetter(seed);
  TF = { on: true, seed, cats, letter, from, live: !!live, t0: Date.now(), done: false, oppData: null, endAt: 0, sent: -1, paid: false };
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true)); adOn = false; SCENES.apply(SCENES.world(5));
  $("#tfLetter").textContent = letter; $("#tfTotal").textContent = SV.wal.tf || 0;
  $("#tfRows").innerHTML = cats.map((id, i) => `<label class="tfrow"><span>${TF_BY[id].icon} ${TF_BY[id].name}</span><input data-tfi="${i}" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="${letter}…"></label>`).join("");
  $("#tfRival").hidden = !live; $("#tfRival").textContent = "⚔ Conectando con el rival…"; tfBar();
  $("#tfGame").hidden = false; $("#tfRows input").focus();
  TFT = setInterval(tfTick, 250); tfTick();
}
const tfFilled = () => [...document.querySelectorAll("#tfRows input")].filter((i) => i.value.trim()).length;
function tfBar() {
  if (!TF || !TF.live || !LIVE) return; const o = LIVE.opp;
  $("#tfRival").hidden = false; $("#tfRival").textContent = `⚔ ${o.name || "Rival"}: ${o.n}/${TF.cats.length} palabras${o.left ? " (se fue)" : TF.oppData ? " ✔ ¡terminó!" : ""}`;
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
  const n = tfFilled(); if (n !== TF.sent) { TF.sent = n; Net.send({ t: "prog", n, pts: 0 }); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("#tfRows input")) { const all = [...document.querySelectorAll("#tfRows input")], i = all.indexOf(e.target); if (i < all.length - 1) all[i + 1].focus(); else e.target.blur(); } });
function tfBastaClick() { const b = document.getElementById("tfBasta"); b.click(); b.click(); }
document.addEventListener("click", (e) => {
  if (e.target.id === "tfBasta") { if (TF && !TF.done) { const f = tfFilled(); if (f < TF.cats.length) { if (!TF.warned) { TF.warned = true; return toast(`Te faltan ${TF.cats.length - f}: sin completar todo no ganás el bonus. Tocá de nuevo para terminar.`); } } tfFinish(false); } }
  if (e.target.id === "tfQuit" && TF) modal(`<h2>¿Abandonar el duelo?</h2><p>Perdés esta partida.</p><button class="big" id="tfQuitOk">Abandonar</button><button class="link" data-close>Seguir jugando</button>`);
  if (e.target.id === "tfQuitOk") tfExit();
  if (e.target.id === "tfHomeBtn") tfExit();
});
function tfExit() { clearInterval(TFT); if (LIVE) { Net.send({ t: "quit" }); liveReset(); } TF = null; closeModal(); $("#tfGame").hidden = true; showMenu(); }
function tfFinish() {
  if (!TF || TF.done) return; TF.done = true; clearInterval(TFT);
  const time = Math.min(TF_LIMIT, Math.round(((Date.now() - TF.t0) / 1000) * 10) / 10);
  const ans = [...document.querySelectorAll("#tfRows input")].map((i) => i.value.trim().replace(/[|~]/g, " ").slice(0, 30));
  TF.me = { ans, time }; document.querySelectorAll("#tfRows input").forEach((i) => (i.disabled = true));
  if (TF.live) {
    Net.send({ t: "tfdone", ans, time });
    if (TF.oppData || (LIVE && LIVE.opp.left)) return tfResult();
    return modal(`<h2>⏳ ¡Terminaste en ${time} s!</h2><p>Esperando que ${oppName()} termine…</p><button class="link" id="tfHomeBtn">Salir</button>`, true);
  }
  tfResult();
}
function tfMsg(m) {
  if (!TF || !TF.on || !TF.live) return false;
  if (m.t === "prog") { LIVE.opp.n = +m.n || 0; tfBar(); return true; }
  if (m.t === "tfdone") {
    TF.oppData = { ans: (Array.isArray(m.ans) ? m.ans : []).slice(0, TF.cats.length).map((x) => String(x).slice(0, 30)), time: Math.min(TF_LIMIT, +m.time || TF_LIMIT), name: LIVE.opp.name };
    LIVE.opp.n = TF.cats.length; if (!TF.done) { TF.endAt = Date.now() + TF_GRACE * 1000; toast(`¡${LIVE.opp.name || "Tu rival"} terminó! Tenés ${TF_GRACE} s`); } tfBar(); if (TF.done) tfResult(); return true;
  }
  if (m.t === "quit") { LIVE.opp.left = true; toast("El rival abandonó el duelo"); tfBar(); tfOppGone(); return true; }
  return false;
}
function tfOppGone() { if (TF && TF.done && !TF.oppData) tfResult(); }

// ---------- Corrección y resultado ----------
const TF_ST = { ok: ["✔", "Bien escrita", "ok"], mal: ["✏", "Mal escrita", "mal"], no: ["✖", "No existe", "no"], letra: ["✖", "No empieza con la letra", "no"], vacio: ["—", "Sin respuesta", "vac"] };
function tfCell(x, raw, rep) {
  const st = TF_ST[x.st], r = rep ? ["🤝", "Repetida con el rival", "rep"] : st;
  return `<div class="tfc ${r[2]}"><b>${esc(raw || "—")}</b><small>${r[0]} ${r[1]}${x.st === "mal" ? ` · se escribe <u>${esc(x.word)}</u>` : ""}</small></div>`;
}
function tfResult() {
  if (!TF) return; const opp = TF.live ? TF.oppData : TF.from; const hasOpp = !!opp, o = opp || null;
  const sc = tfScore(TF.cats, TF.letter, TF.me, o), name = hasOpp ? esc(o.name || (TF.live ? "Rival" : "Amigo")) : "";
  const w = hasOpp ? (sc.total > sc.totalOpp ? 1 : sc.total < sc.totalOpp ? -1 : 0) : 0;
  if (!TF.paid) { TF.paid = true; addPts("tf", sc.total); if (hasOpp) { SV.duels++; if (w > 0) { SV.duelWins++; SV.wal.tf = (SV.wal.tf || 0) + 50; } } save(); checkAch(); beep(w >= 0 ? SND.win : SND.lose || SND.win); }
  $("#tfCoins").textContent = SV.wal.tf || 0;
  const head = !hasOpp ? (TF.live ? "🏁 Terminaste" : "⚔ ¡Listo!") : w > 0 ? "🏆 ¡Ganaste!" : w < 0 ? "😮 Perdiste" : "🤝 ¡Empate!";
  const rows = sc.rows.map((r, i) => `<div class="tfrr"><h4>${TF_BY[r.id].icon} ${TF_BY[r.id].name}</h4><div class="tfpair">${tfCell(r.a, TF.me.ans[i], r.rep)}${hasOpp ? tfCell(r.b, o.ans[i], r.rep) : ""}</div><small class="pp">+${r.pts}${hasOpp ? ` · rival +${r.opts}` : ""}</small></div>`).join("");
  const bon = sc.bonus ? `<p class="tfbon">⚡ Fuiste más rápido (${TF.me.time} s): <b>+${TF_BONUS}</b></p>` : sc.bonusOpp ? `<p class="tfbon">⚡ ${name} fue más rápido (${o.time} s): +${TF_BONUS} para él</p>` : "";
  const vs = hasOpp ? `<div class="vs"><div><small>Vos · ${TF.me.time} s</small><b>${sc.total}</b></div><span>vs</span><div><small>${name} · ${o.time} s</small><b>${sc.totalOpp}</b></div></div>` : `<div class="vs"><div><small>Tu puntaje · ${TF.me.time} s</small><b>${sc.total}</b></div></div>`;
  const legend = hasOpp ? "" : "<p>Todavía no se puede comparar: mandá el desafío y, cuando tu amigo juegue, verá la corrección contra tus respuestas.</p>";
  const btns = TF.live ? (LIVE && LIVE.opp.left ? "" : '<button class="big" id="tfRe">🔁 Revancha</button>') : `<button class="big" id="tfShare">📤 ${TF.from ? "Desafiar de vuelta" : "Invitar a un amigo"}</button><button class="mini wide" id="tfCopy">Copiar link</button>`;
  modal(`<div class="tfres"><h2>${head}</h2>${vs}${bon}${w > 0 ? '<p class="big2">+50 🪙</p>' : ""}<p class="tfhint">Letra <b>${TF.letter}</b> · 10 bien · 5 repetida o mal escrita · 0 no existe</p><div class="tfscroll">${rows}</div>${legend}${btns}<button class="link" id="tfHomeBtn">Inicio</button></div>`, true);
  if (TF.live) { const re = $("#tfRe"); if (re) re.onclick = () => { if (LIVE.role === "host") sendStart(); else { Net.send({ t: "rematch" }); re.textContent = "Pedido enviado…"; re.disabled = true; } }; return; }
  const url = tfLink(), text = TF.from ? `¡Te devuelvo el desafío en Tuti Frutti! Hice ${sc.total} puntos.` : `${SV.name} te desafía en Tuti Frutti. ¿Podés superarlo?`;
  $("#tfShare").onclick = () => { if (navigator.share) navigator.share({ title: "Juegos mentales", text, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank"); };
  $("#tfCopy").onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url));
}
const tfLink = () => `${location.origin}${location.pathname}#t=${TF.seed}~${TF.cats.join("-")}~${TF.me.time}~${encodeURIComponent(SV.name)}~${encodeURIComponent(TF.me.ans.join("|"))}`;
function tfInvite() {
  const m = /^#t=(\d+)~([a-z-]+)~([\d.]+)~([^~]*)~(.*)$/.exec(location.hash); if (!m) return false;
  const cats = m[2].split("-").filter((c) => TF_BY[c]); if (cats.length < 3 || TF) return true;
  let name = "Un amigo", ans = []; try { name = decodeURIComponent(m[4]).slice(0, 16) || name; ans = decodeURIComponent(m[5]).split("|"); } catch {}
  const from = { name, time: +m[3], ans: ans.slice(0, cats.length).map((x) => x.slice(0, 30)) }, letter = tfLetter(+m[1]);
  modal(`<h2>⚔ ¡${esc(name)} te desafió!</h2><p><b>Tuti Frutti</b> · letra <b>${letter}</b> · ${cats.length} categorías. Terminó en <b>${from.time} s</b>. Jugás lo mismo: gana quien sume más.</p><button class="big" id="tfAccept">Aceptar el desafío</button><button class="link" data-close>Ahora no</button>`, true);
  $("#tfAccept").onclick = () => askName(() => tfStart(+m[1], cats, from, false));
  return true;
}
tfInvite();
