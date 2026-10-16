"use strict";
// Frases encriptadas: cada letra se oculta tras un número, un objeto o un color.
const CR_DIFF = {
  f: { name: "Fácil", icon: "🌱", min: 0, max: 24, reveal: 5, base: 40 },
  m: { name: "Medio", icon: "🌿", min: 20, max: 34, reveal: 4, base: 70 },
  d: { name: "Difícil", icon: "🔥", min: 30, max: 46, reveal: 3, base: 110 },
  e: { name: "Experto", icon: "💀", min: 40, max: 99, reveal: 2, base: 160 },
};
const CR_ABC = "ABCDEFGHIJKLMNOÑPQRSTUVWXYZ";
const CR_OBJ = ["🍎", "🐟", "🔑", "⭐", "🎈", "🌙", "🍄", "🔔", "🎩", "🐢", "🍋", "🚲", "🎸", "🌵", "🍕", "🐝", "🎁", "🦋", "🍇", "🚀", "🧲", "🌻", "🍒", "🍩", "🦉", "🎯", "🐙"];
const crLetter = (ch) => { if (/[ñÑ]/.test(ch)) return "Ñ"; const b = ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase(); return /^[A-Z]$/.test(b) ? b : ""; };
const CRP = FRASES_RAW.map((x) => { const [t, o] = x.split("|"); return { t, o, n: [...t].filter((c) => crLetter(c)).length }; });
const crPool = (d) => CRP.filter((p) => p.n >= CR_DIFF[d].min && p.n <= CR_DIFF[d].max);
const crReveal = (d, lv) => Math.max(1, CR_DIFF[d].reveal - Math.floor((lv - 1) / 4));
const crShuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
let CR = null, P = null; // ronda y frase actual

function crPick(d, lv) {
  const pool = crPool(d).sort((a, b) => a.n - b.n || (a.t < b.t ? -1 : 1));
  let unseen = pool.filter((p) => !SV.crSeen.includes(p.t));
  if (unseen.length < 5) { SV.crSeen = SV.crSeen.filter((t) => !pool.some((p) => p.t === t)); unseen = pool; }
  const target = Math.min(1, (lv - 1) / 14);
  const sc = unseen.map((p) => ({ p, s: Math.abs(pool.indexOf(p) / Math.max(1, pool.length - 1) - target) + Math.random() * 0.5 }));
  return sc.sort((a, b) => a.s - b.s).slice(0, 5).map((x) => x.p);
}

// ---------- Menú e inicio ----------
window.addEventListener("load", () => crMenu());
function crMenu() { document.querySelectorAll("#menu .chips [data-diff]").forEach((c) => c.classList.toggle("on", c.dataset.diff === SV.crDiff)); }
document.addEventListener("click", (e) => { const c = e.target.closest("[data-diff]"); if (c && c.closest("#menu")) { SV.crDiff = c.dataset.diff; save(); } }, true);
function crOpen() {
  $("#menu").hidden = true; $("#crGame").hidden = true; $("#crHome").hidden = false; crHome();
}
function crHome() {
  const d = SV.crDiff, lv = SV.crLv[d]; SCENES.apply(SCENES.world(lv)); applyTheme();
  $("#crCoins").textContent = SV.coins; $("#crRank").textContent = ptsOf("cri") + " pts";
  $("#crDiffs").innerHTML = Object.entries(CR_DIFF).map(([k, v]) => `<button data-d="${k}" class="${k === d ? "on" : ""}"><span>${v.icon}</span><b>${v.name}</b><small>Nivel ${SV.crLv[k]}</small></button>`).join("");
  const n = crReveal(d, lv);
  $("#crLvl").innerHTML = `<div class="mid"><small>${CR_DIFF[d].name} · Nivel</small><b>${lv}</b><small class="world">🌍 ${SCENES.worldName(lv)}</small><small>${n} ${n === 1 ? "letra regalada" : "letras regaladas"} por frase · 5 frases por ronda</small></div>`;
}
$("#crDiffs").addEventListener("click", (e) => { const b = e.target.closest("[data-d]"); if (b) { SV.crDiff = b.dataset.d; save(); crHome(); } });
$("#crBack").onclick = showMenu;
$("#crPlay").onclick = () => crRound();

// ---------- Ronda ----------
function crRound() {
  const d = SV.crDiff, lv = SV.crLv[d];
  CR = { d, lv, list: crPick(d, lv), i: 0, solved: 0, pts: 0 };
  $("#crHome").hidden = true; $("#crGame").hidden = false; SCENES.apply(SCENES.world(lv)); crPhrase();
}
function crPhrase() {
  const ph = CR.list[CR.i], d = CR.d;
  const letters = [...new Set([...ph.t].map(crLetter).filter(Boolean))];
  const mode = ["num", "obj", "col"][Math.floor(Math.random() * 3)];
  const order = crShuffle([...Array(27).keys()]);
  const sym = {}; letters.forEach((L, i) => (sym[L] = order[i]));
  const lock = {}, guess = {};
  crShuffle(letters).slice(0, Math.min(crReveal(d, CR.lv), letters.length - 2)).forEach((L) => { lock[sym[L]] = L; guess[sym[L]] = L; });
  P = { ph, letters, mode, sym, bySym: Object.fromEntries(letters.map((L) => [sym[L], L])), guess, lock, sel: null, wrong: {}, hints: 0, checks: 0, auth: false, mistakes: 0, over: false };
  crNext();
  $("#crTitle").textContent = `${CR_DIFF[d].icon} ${CR_DIFF[d].name} · Nivel ${CR.lv}`;
  $("#crTotal").textContent = SV.coins;
  $("#crDots").innerHTML = CR.list.map((_, i) => `<i class="${i < CR.i ? "done" : i === CR.i ? "cur" : ""}"></i>`).join("");
  const o = ph.o, plain = o === "Refrán" || o === "Dicho popular";
  $("#crTag").textContent = plain ? (o === "Refrán" ? "📜 Es un refrán" : "💬 Es un dicho popular") : "🎓 Es una cita célebre · ¿de quién será?";
  $("#crAuth").hidden = plain; $("#crAuth").querySelector("small").textContent = "Autor · −10";
  crDraw();
}
function crSymHtml(s) {
  if (P.mode === "num") return `<b>${s + 1}</b>`;
  if (P.mode === "obj") return `<b class="ob">${CR_OBJ[s]}</b>`;
  return `<b class="co" style="background:hsl(${Math.round((s * 360) / 27)} 75% ${s % 2 ? 42 : 60}%)">${s + 1}</b>`;
}
function crDraw() {
  const words = P.ph.t.split(" ");
  $("#crPhrase").innerHTML = words.map((w) => `<span class="cw">${[...w].map((ch) => {
    const L = crLetter(ch); if (!L) return `<span class="cp">${esc(ch)}</span>`;
    const s = P.sym[L], g = P.guess[s];
    return `<button class="cc${P.lock[s] ? " lk" : ""}${P.sel === s ? " sel" : ""}${P.wrong[s] ? " bad" : ""}" data-s="${s}"><span class="cl">${g || ""}</span>${crSymHtml(s)}</button>`;
  }).join("")}</span>`).join("");
  const used = new Set(Object.values(P.guess));
  $("#crKeys").innerHTML = [...CR_ABC].map((L) => `<button data-k="${L}" class="${used.has(L) ? "used" : ""}">${L}</button>`).join("") + `<button data-k="DEL" class="del">⌫</button>`;
}
function crNext(from) {
  const order = []; [...P.ph.t].forEach((ch) => { const L = crLetter(ch); if (L && !order.includes(P.sym[L])) order.push(P.sym[L]); });
  const start = from == null ? -1 : order.indexOf(from);
  for (let k = 1; k <= order.length; k++) { const s = order[(start + k) % order.length]; if (!P.guess[s]) { P.sel = s; return; } }
  P.sel = from == null ? null : from;
}
$("#crPhrase").addEventListener("click", (e) => { const c = e.target.closest("[data-s]"); if (!c || P.over) return; P.sel = +c.dataset.s; crDraw(); });
$("#crKeys").addEventListener("click", (e) => { const k = e.target.closest("[data-k]"); if (k) crKey(k.dataset.k); });
document.addEventListener("keydown", (e) => {
  if ($("#crGame").hidden || !$("#modal").hidden || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Backspace") { crKey("DEL"); return; }
  const L = crLetter(e.key.length === 1 ? e.key : ""); if (L) crKey(L);
});
function crKey(L) {
  if (!P || P.over) return;
  if (P.sel == null) { toast("Tocá un casillero primero"); return; }
  const s = P.sel;
  if (P.lock[s]) { toast("Esa letra ya te la regalamos 🎁"); return; }
  if (L === "DEL") { delete P.guess[s]; delete P.wrong[s]; crDraw(); return; }
  const other = Object.keys(P.guess).find((k) => P.guess[k] === L && +k !== s);
  if (other != null) { if (P.lock[other]) { toast(`La ${L} ya está revelada`); return; } delete P.guess[other]; delete P.wrong[other]; }
  P.guess[s] = L; delete P.wrong[s]; beep(SND.coin); crNext(s); crDraw(); crComplete();
}
function crComplete() {
  const syms = Object.keys(P.bySym);
  if (!syms.every((s) => P.guess[s])) return;
  const bad = syms.filter((s) => P.guess[s] !== P.bySym[s]);
  if (!bad.length) return crSolve();
  P.mistakes++; bad.forEach((s) => (P.wrong[s] = 1)); beep(SND.bad); vib(60); toast(`Hay ${bad.length} ${bad.length === 1 ? "letra mal puesta" : "letras mal puestas"} (en rojo)`); crDraw();
}
function crSolve() {
  P.over = true; const d = CR.d;
  const gain = Math.max(10, CR_DIFF[d].base + P.ph.n * 3 - P.hints * 15 - P.checks * 5 - (P.auth ? 10 : 0) - P.mistakes * 8);
  addPts("cri", gain); CR.pts += gain; CR.solved++; SV.crSolved++; SV.crSeen.push(P.ph.t); save(); checkAch(); beep(SND.win); vib([60, 40, 100]);
  $("#crTotal").textContent = SV.coins; P.sel = null; crDraw();
  const last = CR.i === CR.list.length - 1;
  modal(`<h2>¡Descifrada! 🔓</h2><p class="crq">“${esc(P.ph.t)}”</p><p class="crau">— ${esc(P.ph.o)}</p><p class="big2">+${gain} pts</p><button class="big" id="crNextBtn">${last ? "Terminar ronda" : "Siguiente frase ▶"}</button>`, true);
  $("#crNextBtn").onclick = () => { closeModal(); crAdvance(); };
}
function crAdvance() { CR.i++; if (CR.i >= CR.list.length) crEnd(); else crPhrase(); }
function crEnd() {
  const d = CR.d, up = CR.solved >= 3 && CR.lv === SV.crLv[d]; let bonus = 0;
  if (up) { bonus = 30 + 10 * CR.lv; addPts("cri", bonus); SV.crLv[d]++; save(); beep(SND.win); }
  checkAch();
  modal(`<h2>${up ? "¡Nivel superado! 🎉" : CR.solved >= 3 ? "¡Ronda completa!" : "Ronda terminada"}</h2><p>Frases descifradas: <b>${CR.solved} de ${CR.list.length}</b></p><p class="big2">${CR.pts + bonus} pts</p>${up ? `<p>Bonus de nivel: +${bonus} 🪙 · Ahora vas por el nivel <b>${SV.crLv[d]}</b></p>` : CR.solved < 3 ? "<p>Descifrá al menos 3 para subir de nivel.</p>" : ""}<button class="big" id="crAgain">Jugar otra ronda</button><button class="mini" id="crMenuBtn">Volver</button>`, true);
  $("#crAgain").onclick = () => { closeModal(); crRound(); };
  $("#crMenuBtn").onclick = () => { closeModal(); $("#crGame").hidden = true; $("#crHome").hidden = false; crHome(); };
}

// ---------- Herramientas ----------
$("#crHint").onclick = () => {
  if (!P || P.over) return;
  if (SV.coins < 10) { toast("Te faltan monedas para la pista"); vib(40); return; }
  const open = Object.keys(P.bySym).filter((s) => !P.lock[s]); if (!open.length) return;
  const s = P.sel != null && !P.lock[P.sel] ? P.sel : +open[Math.floor(Math.random() * open.length)], L = P.bySym[s];
  const other = Object.keys(P.guess).find((k) => P.guess[k] === L && +k !== s); if (other != null) { delete P.guess[other]; delete P.wrong[other]; }
  SV.coins -= 10; P.hints++; P.guess[s] = L; P.lock[s] = L; delete P.wrong[s]; save(); $("#crTotal").textContent = SV.coins; beep(SND.coin);
  crNext(s); crDraw(); crComplete();
};
$("#crCheck").onclick = () => {
  if (!P || P.over) return; P.checks++;
  const bad = Object.keys(P.guess).filter((s) => !P.lock[s] && P.guess[s] !== P.bySym[s]);
  bad.forEach((s) => (P.wrong[s] = 1));
  toast(bad.length ? `${bad.length} ${bad.length === 1 ? "letra está mal" : "letras están mal"} (en rojo)` : "Todo lo que pusiste va bien 👍"); crDraw();
};
$("#crAuth").onclick = () => { if (!P || P.over) return; if (!P.auth) { P.auth = true; } toast(`👤 ${P.ph.o}`); };
$("#crSkip").onclick = () => {
  if (!P || P.over) return;
  modal(`<h2>¿Pasar esta frase?</h2><p>No suma puntos.</p><button class="big" id="crYes">Pasar</button><button class="mini" data-close>Seguir</button>`);
  $("#crYes").onclick = () => { closeModal(); P.over = true; crAdvance(); };
};
$("#crQuit").onclick = () => { if (confirm("¿Salir de la ronda?")) { $("#crGame").hidden = true; $("#crHome").hidden = false; crHome(); } };
