"use strict";
// ¿Qué ves?: 2 o 3 imágenes que se relacionan; hay que descubrir la palabra o frase (1 a 3 palabras) y escribirla.
const qvNorm = (s) => [...String(s)].map(crLetter).join("");
const QV = ENIG.map((e) => ({ ...e, L: qvNorm(e.w), wl: e.w.split(/\s+/).map((x) => qvNorm(x).length) }));
const qvHelp = (lv) => Math.max(0, Math.round(3 * (1 - Math.pow(lvP(lv), 0.6))) + gameDifQ().help);
const qvDifs = { f: 1, m: 0, d: -1, e: -3 };
const gameDifQ = () => ({ help: Q && Q.duel ? 0 : qvDifs[(SV.dif && SV.dif.qv) || "m"] });
const qvTime = (lv, n = 8) => Math.round((Math.max(22, 50 - 22 * Math.pow(lvP(lv), 0.6)) + n * 0.6) * (Q && Q.duel ? 1 : difOf("qv").time));
let Q = null, QT = 0;
// Variantes de la imagen (a partir del nivel 20): la misma ilustración se ve distinta y cuesta más reconocerla.
const QV_TW = [
  { n: "🪞 Espejo", min: 20, css: () => ({ transform: "scale(-1,1) rotate(.01deg)" }) },
  { n: "🙃 Al revés", min: 20, css: () => ({ transform: "rotate(179.99deg)" }) },
  { n: "🔍 Zoom", min: 40, css: () => ({ transform: `scale(2.1) translate(${(Math.random() * 28 - 14).toFixed(1)}%, ${(Math.random() * 28 - 14).toFixed(1)}%)`, filter: "blur(.01px)" }) },
  { n: "🌫️ Borrosa", min: 150, css: () => ({ filter: "blur(4px)" }) },
  { n: "🌑 Silueta", min: 300, css: () => ({ filter: "brightness(0) opacity(.85)" }) },
  { n: "🔬 Muy chica", min: 500, css: () => ({ transform: "scale(.42)", filter: "blur(.01px)" }) },
  { n: "🌀 Doble desafío", min: 700, css: () => ({ transform: "rotate(90deg) scaleX(-1)", filter: "blur(2.5px)" }) },
];
function qvTwist(lv) {
  if (lv < 20 || Math.random() > Math.min(0.75, 0.1 + 0.9 * lvP(lv))) return null;
  const ok = QV_TW.filter((t) => lv >= t.min); return ok[Math.floor(Math.random() * ok.length)];
}

function qvPick(lv) {
  let pool = QV.slice(); let un = pool.filter((p) => !SV.qvSeen.includes(p.w));
  if (un.length < 12) { SV.qvSeen = []; un = pool; }
  const T = Math.max(1, Math.min(4, 1 + Math.floor(Math.pow(lvP(lv), 0.8) * 3.99) + difOf("qv").tier));
  return crShuffle(un).map((p) => ({ p, s: Math.abs(p.t - T) + Math.random() * 1.1 })).sort((a, b) => a.s - b.s).slice(0, 10).map((x) => x.p);
}
function qvMenu() {
  const k = "qv"; document.querySelectorAll(`#menu [data-game="${k}"] [data-diff]`).forEach((x) => x.classList.toggle("on", x.dataset.diff === ((SV.dif && SV.dif[k]) || "m")));
  if ($("#mLvQv")) $("#mLvQv").textContent = `Nivel ${SV.qvLv}`; if ($("#mPtsQv")) $("#mPtsQv").textContent = ptsOf("qv") + " pts";
}
window.addEventListener("load", qvMenu);
function qvOpen() { $("#menu").hidden = true; $("#qvGame").hidden = true; $("#qvHome").hidden = false; qvHome(); }
function qvHome() {
  const lv = SV.qvLv; SCENES.apply(SCENES.world(lv)); applyTheme(); difBar($("#qvDiffs"), "qv");
  $("#qvCoins").textContent = SV.coins; $("#qvRank").textContent = titleOf(lv) + " · " + ptsOf("qv") + " pts";
  const h = qvHelp(lv);
  $("#qvLvl").innerHTML = `<div class="mid"><small>Nivel</small><b>${lv}</b><div class="stars">${stars(SV.starsQ[lv - 1] || 0)}</div><small class="world">🌍 ${SCENES.worldName(lv)}</small><small>${h} ${h === 1 ? "letra de ayuda" : "letras de ayuda"} por enigma · 10 enigmas</small>${lvPath(lv)}</div>`;
}
$("#qvBack").onclick = showMenu;
$("#qvPlay").onclick = () => qvStart();

function qvStart() {
  const lv = SV.qvLv;
  Q = { lv, list: qvPick(lv), i: 0, solved: 0, lives: maxLives("qv"), lost: 0, hints: 0, streak: 0, over: false, duel: false, pts: 0 };
  $("#qvHome").hidden = true; $("#qvGame").hidden = false; SCENES.apply(SCENES.world(lv)); qvImage();
}
function qvLives() { if (Q.duel) { $("#qvLives").innerHTML = `<span class="on" style="font-size:16px;color:var(--ac)">⚔ ${Q.pts} pts</span>`; return; } $("#qvLives").innerHTML = Array.from({ length: maxLives("qv") }, (_, i) => `<span class="${i < Q.lives ? "on" : ""}">❤</span>`).join(""); }
function qvImage() {
  clearInterval(QT);
  const it = Q.list[Q.i]; const n = it.L.length;
  const k = Math.min(qvHelp(Q.lv) + (n >= 12 ? 1 : 0), n - 2);
  const given = new Set(); const idx = crShuffle([...Array(n).keys()]); idx.slice(0, Math.max(0, k)).forEach((i) => given.add(i));
  Q.it = it; Q.given = given; Q.ans = [...it.L].map((c, i) => (given.has(i) ? c : null)); Q.wordHints = 0; Q.busy = false;
  Q.total = qvTime(Q.lv, n); Q.left = Q.total;
  Q.starts = new Set(); { let c = 0; it.wl.forEach((k) => { Q.starts.add(c); c += k; }); }
  $("#qvTotal").textContent = SV.coins; qvLives();
  $("#qvDots").innerHTML = Q.list.map((_, i) => `<i class="${i < Q.i ? "done" : i === Q.i ? "cur" : ""}"></i>`).join("");
  const im = $("#qvImg"); im.innerHTML = `<div class="qvcards c${it.img.length}">${it.img.map((e) => `<span class="qvc">${e}</span>`).join("")}</div>`; $("#qvRubro").innerHTML = `🏷️ ${esc(it.rub)} · <b>${it.wl.length} ${it.wl.length === 1 ? "palabra" : "palabras"}</b>`; const tw = Q.duel ? null : qvTwist(Q.lv); if (tw) { const w = document.createElement("div"); w.className = "qvw"; while (im.firstChild) w.appendChild(im.firstChild); im.appendChild(w); Object.assign(w.style, tw.css()); im.insertAdjacentHTML("beforeend", `<b class="qvtw">${tw.n}</b>`); } im.classList.remove("pop"); void im.offsetWidth; im.classList.add("pop");
  $("#qvHint small").textContent = `Letra · ${hintCost("qv")}🪙`; qvDraw(); qvTimeUI();
  QT = setInterval(() => { if (Q.busy || !$("#modal").hidden) return; Q.left -= 0.1; qvTimeUI(); if (Q.left <= 0) qvFail("¡Se acabó el tiempo!"); }, 100);
}
function qvTimeUI() { const p = Math.max(0, Q.left / Q.total); $("#qvBar").style.width = p * 100 + "%"; $("#qvBar").className = p < 0.25 ? "low" : p < 0.5 ? "mid" : ""; $("#qvTime").textContent = Math.ceil(Math.max(0, Q.left)) + " s"; }
function qvDraw(bad) {
  let pos = 0;
  $("#qvSlots").innerHTML = Q.it.wl.map((k) => { const h = Q.ans.slice(pos, pos + k).map((c, j) => { const i = pos + j; return `<span class="tile slot ${c ? "fill" : ""} ${Q.given.has(i) ? "lock" : ""} ${bad && !Q.given.has(i) ? "bad" : ""}">${c || ""}</span>`; }).join(""); pos += k; return `<span class="qvword">${h}</span>`; }).join("");
  qvFit();
  const used = new Set(); $("#qvKeys").innerHTML = [...CR_ABC].map((L) => `<button data-k="${L}">${L}</button>`).join("") + `<button data-k="DEL" class="del">⌫</button>`;
}
$("#qvKeys").addEventListener("click", (e) => { const k = e.target.closest("[data-k]"); if (k) qvKey(k.dataset.k); });
document.addEventListener("keydown", (e) => {
  if ($("#qvGame").hidden || !$("#modal").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Backspace") return qvKey("DEL");
  const L = crLetter(e.key.length === 1 ? e.key : ""); if (L) qvKey(L);
});
function qvKey(L) {
  if (!Q || Q.busy) return;
  if (L === "DEL") { for (let i = Q.ans.length - 1; i >= 0; i--) if (Q.ans[i] && !Q.given.has(i)) { Q.ans[i] = null; break; } qvDraw(); return; }
  const i = Q.ans.findIndex((c) => !c); if (i < 0) return;
  Q.ans[i] = L; beep(SND.coin); qvDraw();
  if (Q.ans.every(Boolean)) { if (Q.ans.join("") === Q.it.L) qvWin(); else qvWrong(); }
}
function qvWrong() {
  Q.busy = true; if (!Q.duel) Q.lives--; Q.lost++; Q.streak = 0; beep(SND.bad); vib(60); qvLives(); qvDraw(true);
  if (Q.lives <= 0) return setTimeout(() => qvOver(), 600);
  setTimeout(() => { Q.ans = [...Q.it.L].map((c, i) => (Q.given.has(i) ? c : null)); Q.busy = false; qvDraw(); }, 700);
}
function qvFloat(t, cls) { const f = $("#qvFloat"); f.className = "float " + (cls || ""); f.textContent = t; void f.offsetWidth; f.classList.add("go"); }
function qvWin() {
  Q.busy = true; clearInterval(QT); Q.solved++; Q.streak++; SV.qvSolved++;
  const ratio = Q.left / Q.total, len = Q.it.L.length;
  const gain = Math.round(Math.max(5, 10 + len + Math.ceil(10 * ratio) + Math.min(Q.streak, 10) * 2 - 5 * Q.wordHints) * (Q.duel ? 1 : difOf("qv").mult * lvMult(Q.lv)));
  if (Q.duel) { Q.pts += gain; dxProg(Q.i + 1, Q.pts); } else { addPts("qv", gain); SV.qvSeen.push(Q.it.w); } save(); checkAch(); $("#qvTotal").textContent = SV.coins;
  $("#qvSlots").classList.add("win"); qvFloat(`+${gain} 🪙${Q.streak >= 2 ? "  🔥x" + Q.streak : ""}`, "good"); beep(SND.ok); vib(25);
  setTimeout(() => { $("#qvSlots").classList.remove("win"); qvNext(); }, 1100);
}
function qvFail(msg) {
  if (Q.busy) return; Q.busy = true; clearInterval(QT); if (!Q.duel) Q.lives--; Q.lost++; Q.streak = 0; qvLives(); beep(SND.lose);
  Q.ans = [...Q.it.L]; qvDraw(); qvFloat(msg + " Era: " + Q.it.w, "bad");
  if (Q.lives <= 0) return setTimeout(qvOver, 1500);
  if (Q.duel) dxProg(Q.i + 1, Q.pts);
  setTimeout(qvNext, 1600);
}
function qvNext() { Q.i++; if (Q.duel && Q.i >= Q.list.length) { clearInterval(QT); return dxFinish(Q.pts); } if (Q.i >= Q.list.length) qvEnd(); else qvImage(); }
function qvOver() {
  clearInterval(QT); Q.over = true;
  modal(`<h2>Sin vidas 💔</h2><p>Descubriste <b>${Q.solved}</b> de ${Q.list.length} enigmas.</p><button class="big" id="qvRetry">Reintentar nivel</button><button class="mini" id="qvOut">Volver</button>`, true);
  $("#qvRetry").onclick = () => { closeModal(); qvStart(); };
  $("#qvOut").onclick = () => { closeModal(); $("#qvGame").hidden = true; $("#qvHome").hidden = false; qvHome(); };
}
function qvEnd() {
  clearInterval(QT);
  const st = Q.lost === 0 && Q.hints === 0 ? 3 : Q.lost <= 1 ? 2 : 1, bonus = lvPrize(Q.lv);
  SV.starsQ[Q.lv - 1] = Math.max(SV.starsQ[Q.lv - 1] || 0, st); addPts("qv", bonus);
  const first = Q.lv === SV.qvLv; const before = titleOf(SV.qvLv); if (first) SV.qvLv++; save(); checkAch(); beep(SND.win); vib([80, 50, 120]);
  const rank = titleOf(SV.qvLv) !== before ? titleOf(SV.qvLv) : "";
  modal(`<h2>¡Nivel superado! 🎉</h2><div class="stars big3">${stars(st)}</div><p class="big2">+${bonus} 🪙</p>${rank ? `<p class="rankup">Nuevo rango: <b>${rank}</b></p>` : ""}<p>Ahora vas por el nivel <b>${SV.qvLv}</b></p><button class="big" id="qvAgain">Siguiente nivel ▶</button><button class="mini" id="qvOut">Volver</button>`, true);
  $("#qvAgain").onclick = () => { closeModal(); qvStart(); };
  $("#qvOut").onclick = () => { closeModal(); $("#qvGame").hidden = true; $("#qvHome").hidden = false; qvHome(); };
}
$("#qvHint").onclick = () => {
  if (!Q || Q.busy) return;
  if (Q.duel) return toast("En los duelos no hay pistas");
  if (SV.coins < hintCost("qv")) { toast("Te faltan monedas para la pista"); vib(40); return; }
  const open = Q.ans.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0 && !Q.given.has(i)); const empty = Q.ans.map((c, i) => (!c ? i : -1)).filter((i) => i >= 0);
  if (!empty.length) return;
  const i = empty[0]; Q.ans[i] = Q.it.L[i]; Q.given.add(i); SV.coins -= hintCost("qv"); Q.hints++; Q.wordHints++; save(); $("#qvTotal").textContent = SV.coins; beep(SND.coin); qvDraw();
  if (Q.ans.every(Boolean)) { if (Q.ans.join("") === Q.it.L) qvWin(); else qvWrong(); }
};
$("#qvSkip").onclick = () => { if (!Q || Q.busy) return; qvFail("Pasaste (−1 ❤)."); };
$("#qvQuit").onclick = () => { if (confirm("¿Salir del nivel?")) { clearInterval(QT); if (Q.duel) { dxAbort(); showMenu(); return; } $("#qvGame").hidden = true; $("#qvHome").hidden = false; qvHome(); } };

// Ajusta el tamaño de las casillas para que ninguna palabra se salga de la pantalla (si aun así no entra, sigue en la línea de abajo).
function qvFit() {
  const el = $("#qvSlots"); if (!el || !Q || !Q.it) return;
  const W = el.clientWidth || (el.parentElement && el.parentElement.clientWidth) || 320, n = Math.max(...Q.it.wl), gap = 5;
  const base = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--qvtile")) || 0;
  let tw = Math.floor((W - 4 - (n - 1) * gap) / n); tw = tw < 28 ? 32 : Math.min(tw, window.innerWidth >= 700 ? 52 : 44); // si no entra en una línea, la palabra sigue abajo con casillas de tamaño legible
  el.style.setProperty("--tw", tw + "px");
}
window.addEventListener("resize", () => { if (typeof Q !== "undefined" && Q && !$("#qvGame").hidden) qvFit(); });
