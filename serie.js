"use strict";
// Series de duelos acumulados: en todos los juegos podés elegir cuántos duelos dura la partida (1, 3, 5 o 10).
// Los puntos de cada duelo se suman y gana quien más acumula. Sirve en vivo y por link.
const SR_OPTS = [1, 3, 5, 10];
let SR = null, SRGO = false; // SRGO: el próximo duelo que arranca pertenece a la serie en curso
const srN = () => (SR_OPTS.includes(SV.srRounds) ? SV.srRounds : 3);
const srSeed = (seed, r) => (seed + r * 7919) % 1000000000;
const srNew = (kind, rounds, seed, live, from) => ({ kind, rounds, r: 0, seed, live, from, tot: 0, totOpp: 0, mine: [], opp: [], scored: -1, ready: -1, oppReady: -1, paid: false });
function srSel() {
  document.querySelectorAll(".srsel").forEach((el) => { el.innerHTML = `<small>⚔ Duelos por partida (se acumulan)</small><div>${SR_OPTS.map((n) => `<button class="chip${n === srN() ? " on" : ""}" data-sr="${n}">${n === 1 ? "1 solo" : n}</button>`).join("")}</div>`; });
}
function srLaunch(kind, live) {
  askName(() => {
    const n = srN(), seed = Math.floor(Math.random() * 1e9);
    if (live) { liveHost(kind); LIVE.rounds = n; return; }
    SR = n > 1 ? srNew(kind, n, seed, false, null) : null;
    srPlay(seed, kind, false);
  });
}
function srPlay(seedBase, kind, live) {
  const s = SR ? srSeed(SR.seed, SR.r) : seedBase; SRGO = !!SR;
  if (DXG[kind]) dxBegin(kind, s, null, live); else startDuel(s, null, kind, live);
}
const srStart = (seed, kind, rounds) => { const n = SR_OPTS.includes(+rounds) ? +rounds : 1; SR = n > 1 ? srNew(kind, n, seed, true, null) : null; LIVE.rounds = n; return SR ? srSeed(seed, 0) : seed; };

// Fin de un duelo de la serie (me = mis puntos; oppPts = puntos del rival en vivo)
function srRoundEnd(me, oppPts) {
  const r = SR.r, o = SR.live ? oppPts : SR.from ? SR.from.scores[r] : null;
  if (SR.scored < r) { SR.scored = r; SR.mine[r] = me; SR.opp[r] = o; SR.tot += me; if (o != null) SR.totOpp += o; beep(SND.coin || SND.ok); }
  const hasOpp = SR.live || !!SR.from, last = r >= SR.rounds - 1, left = SR.live && LIVE && LIVE.opp.left;
  const name = esc(SR.live ? (LIVE && LIVE.opp.name) || "Rival" : SR.from ? SR.from.name : "");
  const vs = hasOpp ? `<div class="vs"><div><small>Vos</small><b>${me}</b></div><span>vs</span><div><small>${name}</small><b>${o == null ? 0 : o}</b></div></div><p class="tfacc">Acumulado: <b>${SR.tot}</b> vs <b>${SR.totOpp}</b></p>` : `<div class="vs"><div><small>Tu puntaje</small><b>${me}</b></div></div><p class="tfacc">Acumulado: <b>${SR.tot}</b></p>`;
  const btn = last || left ? '<button class="big" id="srFinal">🏁 Ver resultado final</button>' : `<button class="big" id="srNext"${SR.live && SR.ready >= r ? " disabled" : ""}>${SR.live && SR.ready >= r ? "Esperando al rival…" : "▶ Siguiente duelo"}</button>`;
  modal(`<h2>⚔ Duelo ${r + 1} de ${SR.rounds}</h2>${vs}${left ? "<p>Tu rival abandonó.</p>" : ""}${btn}<button class="link" id="srExit">Salir</button>`, true);
}
function srAdvance() {
  if (!SR || !SR.live || SR.ready < SR.r || SR.oppReady < SR.r) return;
  SR.r++; if (LIVE) Object.assign(LIVE.opp, { n: 0, pts: 0, done: false }); let n = 3;
  modal(`<h2>⚔ Duelo ${SR.r + 1} de ${SR.rounds}</h2><p>${NAMES[SR.kind]}</p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!SR || !LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); srPlay(0, SR.kind, true); } else $("#cd").textContent = n; }, 1000);
}
function srMsg(m) {
  if (!SR || !SR.live || m.t !== "srnext") return false;
  SR.oppReady = Math.max(SR.oppReady, +m.r); srAdvance(); return true;
}
const srLink = () => `${location.origin}${location.pathname}#s=${SR.seed}.${SR.kind}.${SR.rounds}.${SR.mine.join("-")}.${encodeURIComponent(SV.name)}`;
function srFinal() {
  if (!SR) return; const hasOpp = SR.live || !!SR.from, w = hasOpp ? (SR.tot > SR.totOpp ? 1 : SR.tot < SR.totOpp ? -1 : 0) : 0, kind = SR.kind;
  const prize = SR.rounds * 20;
  if (!SR.paid) { SR.paid = true; if (hasOpp) { SV.duels++; if (w > 0) { SV.duelWins++; SV.wal[kind] = (SV.wal[kind] || 0) + prize; duelRank(kind, SR.tot); } } save(); checkAch(); beep(w >= 0 ? SND.win : SND.lose); }
  const name = esc(SR.live ? (LIVE && LIVE.opp.name) || "Rival" : SR.from ? SR.from.name : ""), left = SR.live && LIVE && LIVE.opp.left;
  const head = !hasOpp ? "🏁 ¡Listo!" : w > 0 ? "🏆 ¡Ganaste la partida!" : w < 0 ? "😮 Perdiste la partida" : "🤝 ¡Empate!";
  const rows = SR.mine.map((x, i) => `<tr><td>${i + 1}</td><td>${x}</td>${hasOpp ? `<td>${SR.opp[i] == null ? "—" : SR.opp[i]}</td>` : ""}</tr>`).join("");
  const vs = hasOpp ? `<div class="vs"><div><small>Vos</small><b>${SR.tot}</b></div><span>vs</span><div><small>${name}</small><b>${SR.totOpp}</b></div></div>` : `<div class="vs"><div><small>Tu total</small><b>${SR.tot}</b></div></div>`;
  const btns = SR.live ? (left ? "" : '<button class="big" id="srRe">🔁 Revancha</button>') : `<button class="big" id="srShare">📤 ${SR.from ? "Desafiar de vuelta" : "Invitar a un amigo"}</button><button class="mini wide" id="srCopy">Copiar link</button>`;
  modal(`<div class="tfres"><h2>${head}</h2>${vs}${w > 0 ? `<p class="big2">+${prize} 🪙</p>` : ""}${left ? "<p>Tu rival abandonó la partida.</p>" : ""}${!hasOpp ? "<p>Mandá el desafío: tu amigo juega los mismos duelos y gana quien acumule más.</p>" : ""}<div class="tfscroll"><table class="tft"><tr><th>Duelo</th><th>Vos</th>${hasOpp ? `<th>${name}</th>` : ""}</tr>${rows}</table></div>${btns}<button class="link" id="srExit">Inicio</button></div>`, true);
  const re = $("#srRe"); if (re) re.onclick = () => { if (LIVE.role === "host") sendStart(); else { Net.send({ t: "rematch" }); re.textContent = "Pedido enviado…"; re.disabled = true; } };
  if (!SR.live) {
    const url = srLink(), text = SR.from ? `¡Te devuelvo el desafío en ${NAMES[kind]} (${SR.rounds} duelos)! Hice ${SR.tot} puntos.` : `${SV.name} te desafía en ${NAMES[kind]} (${SR.rounds} duelos acumulados): hizo ${SR.tot} puntos. ¿Podés superarlo?`;
    $("#srShare").onclick = () => { if (navigator.share) navigator.share({ title: "Juegos mentales", text: text + INV, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url + INV), "_blank"); };
    $("#srCopy").onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url));
  }
}
function srExit() { if (LIVE) { Net.send({ t: "quit" }); liveReset(); } SR = null; D = null; G = null; clearInterval(timerId); clearInterval(QT); closeModal(); showMenu(); }
function srInvite() {
  const m = /^#s=(\d+)\.(ana|hid|adi|cri|qv)\.(\d+)\.([\d-]+)\.(.*)$/.exec(location.hash); if (!m) return false;
  const rounds = +m[3], scores = m[4].split("-").map(Number), kind = m[2];
  if (SR || (typeof G !== "undefined" && G) || !SR_OPTS.includes(rounds) || scores.length !== rounds) return true;
  let name = "Un amigo"; try { name = decodeURIComponent(m[5]).slice(0, 16) || name; } catch {}
  const total = scores.reduce((a, b) => a + b, 0);
  modal(`<h2>⚔ ¡${esc(name)} te desafió!</h2><p><b>${NAMES[kind]}</b> · ${rounds} duelos acumulados. Hizo <b>${total} puntos</b>. Jugás los mismos duelos: gana quien acumule más.</p><button class="big" id="srAccept">Aceptar el desafío</button><button class="link" data-close>Ahora no</button>`, true);
  $("#srAccept").onclick = () => askName(() => { SR = srNew(kind, rounds, +m[1], false, { name, scores }); srPlay(0, kind, false); });
  return true;
}
document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-sr]");
  if (o) { SV.srRounds = +o.dataset.sr; save(); return srSel(); }
  const id = e.target.id;
  if (id === "srNext" && SR) {
    if (SR.live) { SR.ready = SR.r; Net.send({ t: "srnext", r: SR.r }); e.target.disabled = true; e.target.textContent = "Esperando al rival…"; srAdvance(); } else { SR.r++; srPlay(0, SR.kind, false); }
  } else if (id === "srFinal") srFinal(); else if (id === "srExit") srExit();
  const b = e.target.closest("[data-dxk]"); if (b) srLaunch(b.dataset.dxk, b.dataset.dx === "live");
});
srSel(); srInvite();
