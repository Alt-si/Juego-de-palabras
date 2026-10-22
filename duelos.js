"use strict";
// Duelos para Adivina, Frases encriptadas y ¿Qué ves? (en vivo y por link). Usa la misma conexión (Net/LIVE) que Anagrama.
const DXG = { adi: { n: 5, label: "5 palabras" }, cri: { n: 3, label: "3 frases" }, qv: { n: 10, label: "10 enigmas" }, cv: { n: 3, label: "3 palabras" } };
let D = null; // duelo en curso: { kind, seed, live, from, total, pts, over, paid }
const dxSeedPick = (arr, seed, n) => { const r = mulberry(seed), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };

function dxBegin(kind, seed, from, live) {
  if (!SRGO) SR = null; SRGO = false;
  closeModal(); history.replaceState(null, "", location.pathname);
  const n = DXG[kind].n; D = { kind, seed, live: !!live, from, total: n, pts: 0, over: false, paid: false };
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true)); adOn = false;
  dxBars(true);
  if (kind === "adi") {
    buildAdivina(); const pool = ADI.all.filter((e) => e.t <= 3);
    Object.assign(AD, { duel: true, cat: "Duelo", lv: 4, i: 0, total: 0, results: [], words: dxSeedPick(pool, seed, n) });
    SCENES.apply(SCENES.mystery(4)); $("#adGame").hidden = false; adOn = true; $("#adCatName").textContent = "⚔ Duelo"; $("#adTotal").textContent = SV.wal.adi || 0; adNext();
  } else if (kind === "cri") {
    const pool = crPool("m"); CR = { d: "m", lv: 5, list: dxSeedPick(pool.sort((a, b) => (a.t < b.t ? -1 : 1)), seed, n), i: 0, solved: 0, pts: 0, duel: true };
    SCENES.apply(SCENES.world(7)); $("#crGame").hidden = false; crPhrase();
  } else if (kind === "cv") {
    cvLoad().then((all) => { CV = { lv: 5, list: dxSeedPick(all.filter((p) => p.L.length >= 7 && p.L.length <= 9).sort((a, b) => (a.w < b.w ? -1 : 1)), seed, n), i: 0, lives: 99, lost: 0, passed: 0, strong: 0, over: false, duel: true, pts: 0, found: [], streak: 0, busy: false }; SCENES.apply(SCENES.world(7)); $("#cvGame").hidden = false; cvRound(); }, () => dxExit());
  } else if (kind === "qv") {
    Q = { lv: 5, list: dxSeedPick(QV.slice().sort((a, b) => (a.w < b.w ? -1 : 1)), seed, n), i: 0, solved: 0, lives: 99, lost: 0, hints: 0, streak: 0, over: false, duel: true, pts: 0 };
    SCENES.apply(SCENES.world(7)); $("#qvGame").hidden = false; qvImage();
  }
}
function dxBars(on) { document.querySelectorAll(".dxbar").forEach((b) => { b.hidden = !on || !(D && D.live); if (!b.hidden) b.textContent = "⚔ Conectando con el rival…"; }); if (on) dxBarUI(); }
function dxBarUI() {
  if (!D || !D.live || !LIVE) return; const o = LIVE.opp;
  const t = `⚔ ${o.name || "Rival"}: ${o.n}/${D.total} · ${o.pts} pts${o.left ? " (se fue)" : o.done ? " ✔" : ""}`;
  document.querySelectorAll(".dxbar").forEach((b) => { b.hidden = false; b.textContent = t; });
}
function dxProg(n, pts) { if (D && D.live) Net.send({ t: "prog", n, pts }); }
function dxMsg(m) {
  if (!D || !D.live) return false;
  if (m.t === "prog") { LIVE.opp.n = +m.n || 0; LIVE.opp.pts = +m.pts || 0; dxBarUI(); return true; }
  if (m.t === "done") { LIVE.opp.pts = +m.pts || 0; LIVE.opp.n = D.total; LIVE.opp.done = true; dxBarUI(); if (D.over) dxResult(); return true; }
  if (m.t === "quit") { LIVE.opp.left = true; toast("El rival abandonó el duelo"); dxBarUI(); if (D.over) dxResult(); return true; }
  return false;
}
function dxAbort() { SR = null; if (LIVE) { Net.send({ t: "quit" }); liveReset(); } D = null; clearInterval(QT); }
function dxExit() { SR = null; if (LIVE) { Net.send({ t: "quit" }); liveReset(); } D = null; closeModal(); showMenu(); }
function dxCountdown(seed, kind) {
  let n = 3; modal(`<h2>⚔ ${oppName()}</h2><p>${NAMES[kind]} · ${DXG[kind].label}</p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); SRGO = !!SR; dxBegin(kind, seed, null, true); } else $("#cd").textContent = n; }, 1000);
}
function dxFinish(pts) {
  D.over = true; D.pts = pts; clearInterval(QT); clearInterval(timerId);
  if (D.live) {
    Net.send({ t: "done", pts });
    if (LIVE && (LIVE.opp.done || LIVE.opp.left)) return dxResult();
    modal(`<h2>⏳ ¡Terminaste!</h2><p>Hiciste <b>${pts} pts</b>. Esperando que ${oppName()} termine…</p><button class="link" id="dxHome">Salir</button>`, true);
    return;
  }
  dxResult();
}
function dxLink(pts) { return `${location.origin}${location.pathname}#d=${D.seed}.${pts}.${D.kind}.${encodeURIComponent(SV.name)}`; }
function dxResult() {
  if (!D) return; const me = D.pts;
  if (SR && SR.rounds > 1) return srRoundEnd(me, D.live && LIVE ? LIVE.opp.pts : null);
  if (D.live) {
    const o = LIVE ? LIVE.opp : { pts: 0, name: "Rival" }, w = me > o.pts ? 1 : me < o.pts ? -1 : 0;
    dxPay(w);
    modal(`<h2>${w > 0 ? "🏆 ¡Ganaste!" : w < 0 ? "😮 Perdiste" : "🤝 ¡Empate!"}</h2><div class="vs"><div><small>Vos</small><b>${me}</b></div><span>vs</span><div><small>${oppName()}</small><b>${o.pts}</b></div></div>${o.left && !o.done ? "<p>Tu rival abandonó antes de terminar.</p>" : ""}${w > 0 ? '<p class="big2">+50 🪙</p>' : ""}${o.left ? "" : '<button class="big" id="lvRe">🔁 Revancha</button>'}<button class="link" id="dxHome">Inicio</button>`, true);
    const re = $("#lvRe"); if (re) re.onclick = () => { if (LIVE.role === "host") sendStart(); else { Net.send({ t: "rematch" }); re.textContent = "Pedido enviado…"; re.disabled = true; } };
    return;
  }
  const f = D.from; let head, body;
  if (f) { const w = me > f.score ? 1 : me < f.score ? -1 : 0; dxPay(w); head = w > 0 ? "🏆 ¡Ganaste!" : w < 0 ? "😮 Perdiste" : "🤝 ¡Empate!"; body = `<div class="vs"><div><small>Vos</small><b>${me}</b></div><span>vs</span><div><small>${esc(f.name)}</small><b>${f.score}</b></div></div>${w > 0 ? '<p class="big2">+50 🪙</p>' : ""}`; }
  else { dxPay(0); head = "⚔ ¡Listo!"; body = `<div class="vs"><div><small>Tu puntaje</small><b>${me}</b></div></div><p>Mandale el desafío a un amigo: juega lo mismo y vemos quién gana.</p>`; }
  modal(`<h2>${head}</h2>${body}<button class="big" id="dxShare">📤 ${f ? "Desafiar de vuelta" : "Invitar a un amigo"}</button><button class="mini wide" id="dxCopy">Copiar link</button><button class="link" id="dxHome">Inicio</button>`, true);
  const url = dxLink(me), text = f ? `¡Te devuelvo el desafío en ${NAMES[D.kind]}! Hice ${me} puntos, superalos.` : `${SV.name} te desafía en ${NAMES[D.kind]}: hizo ${me} puntos. ¿Podés superarlo?`;
  $("#dxShare").onclick = () => { if (navigator.share) navigator.share({ title: "Juegos mentales", text: text + INV, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url + INV), "_blank"); };
  $("#dxCopy").onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url));
}
function dxPay(w) { if (D.paid) return; D.paid = true; SV.duels++; if (w > 0) { SV.duelWins++; SV.wal[D.kind] = (SV.wal[D.kind] || 0) + 50; duelRank(D.kind, D.pts); } save(); checkAch(); beep(SND.win); }
document.addEventListener("click", (e) => { if (e.target.id === "dxHome") dxExit(); });
