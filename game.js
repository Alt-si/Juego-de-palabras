"use strict";
// Anagrama. Todo el progreso se guarda en este dispositivo (localStorage).
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PER_LEVEL = 10, LIVES = 3, TICK = 100;

// ---------- Guardado ----------
const DEF = { coins: 0, level: 1, stars: {}, lvH: 1, starsH: {}, solved: 0, bestStreak: 0, ach: {}, theme: "claro", owned: ["claro"], sound: true, lastDaily: "", dailyStreak: 0, seen: [], played: 0, fastest: 0, name: "", duels: 0, duelWins: 0 };
let SV;
try { SV = { ...DEF, ...JSON.parse(localStorage.getItem("anagrama-v1") || "{}") }; } catch { SV = { ...DEF }; }
const save = () => { try { localStorage.setItem("anagrama-v1", JSON.stringify(SV)); } catch {} };

// ---------- Reglas de niveles ----------
const RANGES = [[4, 4], [4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [7, 7], [7, 8], [8, 8], [8, 9], [9, 9]];
const rangeOf = (lv) => (lv <= RANGES.length ? RANGES[lv - 1] : lv < 16 ? [9, 10] : [9, 12]);
const timeFor = (lv, len) => Math.max(25, 20 + 5 * len - Math.min(lv, 10) * 2);
const TITLES = [[1, "Novato"], [3, "Aprendiz"], [5, "Curioso"], [8, "Palabrero"], [11, "Lingüista"], [15, "Erudito"], [20, "Maestro del anagrama"], [30, "Leyenda"]];
const titleOf = (lv) => TITLES.filter((t) => lv >= t[0]).pop()[1];
let CUR = "ana"; // juego elegido en el menú: "ana" (Anagrama) o "hid" (Palabras escondidas)
const KSk = (k) => (k === "hid" ? { lv: "lvH", st: "starsH" } : { lv: "level", st: "stars" });
const KS = () => KSk(CUR);
const curLevel = () => SV[KS().lv];
const topLevel = () => Math.max(SV.level, SV.lvH);
const NAMES = { ana: "Anagrama", hid: "Palabras escondidas" };
const maxLives = () => (SV.owned.includes("vida") ? LIVES + 1 : LIVES);

const THEMES = [["claro", "Claro", 0], ["oscuro", "Oscuro", 80], ["oceano", "Océano", 150], ["bosque", "Bosque", 150], ["atardecer", "Atardecer", 200]];
const ACH = [
  ["first", "Primera palabra", "Resolvé tu primera palabra", () => SV.solved >= 1, 10],
  ["w50", "Medio centenar", "50 palabras resueltas", () => SV.solved >= 50, 50],
  ["w200", "Palabrero", "200 palabras resueltas", () => SV.solved >= 200, 150],
  ["s5", "En racha", "5 palabras seguidas", () => SV.bestStreak >= 5, 20],
  ["s10", "Imparable", "10 palabras seguidas", () => SV.bestStreak >= 10, 60],
  ["l5", "Nivel 5", "Llegá al nivel 5", () => SV.level >= 5, 50],
  ["l10", "Nivel 10", "Llegá al nivel 10", () => SV.level >= 10, 150],
  ["perfect", "Perfecto", "3 estrellas en un nivel", () => [...Object.values(SV.stars), ...Object.values(SV.starsH)].some((n) => n >= 3), 30],
  ["h5", "Buscapalabras", "Llegá al nivel 5 de Palabras escondidas", () => SV.lvH >= 5, 50],
  ["speed", "Rayo", "Resolvé una palabra con más del 75 % del tiempo sobrando", () => SV.fastest >= 0.75, 20],
  ["rich", "Ahorrista", "Juntá 500 monedas", () => SV.coins >= 500, 50],
  ["duel1", "Competidor", "Ganale un duelo a un amigo", () => SV.duelWins >= 1, 40],
  ["daily3", "Constante", "Entrá 3 días seguidos", () => SV.dailyStreak >= 3, 30],
];

// ---------- Utilidades ----------
let R = Math.random;
const rnd = (n) => Math.floor(R() * n);
function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function scramble(L) { const a = [...L]; if (new Set(a).size === 1) return a; let r; do r = shuffle(a); while (r.join("") === L); return r; }
const todayKey = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
const yesterdayKey = () => new Date(Date.now() - 27 * 3600e3).toISOString().slice(0, 10);
let audio;
function beep(seq) {
  if (!SV.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    let t = audio.currentTime;
    for (const [f, d, type] of seq) { const o = audio.createOscillator(), g = audio.createGain(); o.type = type || "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + d + 0.02); t += d * 0.8; }
  } catch {}
}
const vib = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch {} };
const SND = { ok: [[660, 0.12], [880, 0.18]], bad: [[180, 0.2, "sawtooth"]], win: [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.3]], lose: [[300, 0.2], [220, 0.35]], coin: [[1200, 0.06]] };
function toast(t) { const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2600); }

// ---------- Pantalla de inicio ----------
function applyTheme() { document.body.dataset.theme = SV.theme; }
function stars(n) { return [1, 2, 3].map((i) => `<span class="${i <= n ? "on" : ""}">★</span>`).join(""); }
let viewLevel = 1;
function renderHome() {
  applyTheme();
  viewLevel = Math.min(viewLevel, curLevel());
  $("#hLogo").innerHTML = [...(CUR === "hid" ? "ESCONDIDAS" : "ANAGRAMA")].map((c) => `<i>${c}</i>`).join("");
  $("#hTag").textContent = CUR === "hid" ? "Hay letras de más: encontrá la palabra escondida" : "Ordená las letras y encontrá la palabra";
  $("#hCoins").textContent = SV.coins;
  $("#hRank").textContent = titleOf(topLevel());
  $("#btnSound").textContent = SV.sound ? "🔊" : "🔇";
    $("#hCard").innerHTML = `<button class="ib" id="lvPrev" ${viewLevel <= 1 ? "disabled" : ""} aria-label="Nivel anterior">‹</button>
    <div class="mid"><small>Nivel</small><b>${viewLevel}</b><div class="stars">${stars(SV[KS().st][viewLevel] || 0)}</div><small>${viewLevel === curLevel() ? "Nivel actual" : "Ya superado: mejorá tus estrellas"}</small></div>
    <button class="ib" id="lvNext" ${viewLevel >= curLevel() ? "disabled" : ""} aria-label="Nivel siguiente">›</button>`;
  $("#lvPrev").onclick = () => { viewLevel--; renderHome(); };
  $("#lvNext").onclick = () => { viewLevel++; renderHome(); };
  const d = SV.lastDaily !== todayKey();
  $("#btnDaily").innerHTML = d ? `🎁 <b>Premio diario disponible</b><small>Tocá para reclamarlo</small>` : `🎁 Premio diario reclamado<small>Volvé mañana · racha de ${SV.dailyStreak} día${SV.dailyStreak === 1 ? "" : "s"}</small>`;
  $("#btnDaily").classList.toggle("ready", d);
}
function claimDaily() {
  if (SV.lastDaily === todayKey()) return toast("Ya reclamaste el premio de hoy. ¡Volvé mañana!");
  SV.dailyStreak = SV.lastDaily === yesterdayKey() ? SV.dailyStreak + 1 : 1;
  const r = 20 + 10 * Math.min(SV.dailyStreak, 7);
  SV.lastDaily = todayKey(); SV.coins += r; save(); beep(SND.win);
  modal(`<h2>🎁 ¡Premio diario!</h2><p class="big2">+${r} 🪙</p><p>Racha de ${SV.dailyStreak} día${SV.dailyStreak === 1 ? "" : "s"}. Cuantos más días seguidos, más monedas (hasta 90).</p><button class="big" data-close>¡Genial!</button>`);
  checkAch(); renderHome();
}

// ---------- Modal ----------
function modal(html, noClose) { $("#box").innerHTML = html; $("#modal").hidden = false; $("#modal").dataset.lock = noClose ? "1" : ""; }
function closeModal() { $("#modal").hidden = true; }
$("#modal").addEventListener("click", (e) => { if (e.target.closest("[data-close]") || (e.target.id === "modal" && !$("#modal").dataset.lock)) closeModal(); });

function checkAch() {
  for (const [id, name, , test, reward] of ACH) if (!SV.ach[id] && test()) { SV.ach[id] = 1; SV.coins += reward; save(); toast(`🏅 ¡Logro: ${name}! +${reward} 🪙`); beep(SND.win); }
}
function showAch() {
  modal(`<h2>🏅 Logros</h2><div class="list">${ACH.map(([id, n, d, , r]) => `<div class="li ${SV.ach[id] ? "got" : ""}"><span>${SV.ach[id] ? "🏅" : "🔒"}</span><div><b>${n}</b><small>${d}</small></div><em>+${r}🪙</em></div>`).join("")}</div><button class="big" data-close>Cerrar</button>`);
}
function showStats() {
  const stars3 = [...Object.values(SV.stars), ...Object.values(SV.starsH)].reduce((a, b) => a + b, 0);
  modal(`<h2>📊 Estadísticas</h2><div class="list"><div class="li"><div><b>Palabras resueltas</b></div><em>${SV.solved}</em></div><div class="li"><div><b>Mejor racha</b></div><em>${SV.bestStreak}</em></div><div class="li"><div><b>Nivel en Anagrama</b></div><em>${SV.level}</em></div><div class="li"><div><b>Nivel en Palabras escondidas</b></div><em>${SV.lvH}</em></div><div class="li"><div><b>Estrellas</b></div><em>${stars3} ★</em></div><div class="li"><div><b>Partidas jugadas</b></div><em>${SV.played}</em></div><div class="li"><div><b>Rango</b></div><em>${titleOf(topLevel())}</em></div></div><button class="big" data-close>Cerrar</button>`);
}
function showShop() {
  const rows = THEMES.map(([id, name, price]) => {
    const own = SV.owned.includes(id), on = SV.theme === id;
    return `<div class="li"><span>🎨</span><div><b>Tema ${name}</b><small>Cambia los colores del juego</small></div>${own ? `<button class="mini" data-theme="${id}" ${on ? "disabled" : ""}>${on ? "En uso" : "Usar"}</button>` : `<button class="mini buy" data-buy="${id}" data-price="${price}">${price} 🪙</button>`}</div>`;
  }).join("");
  const life = SV.owned.includes("vida");
  modal(`<h2>🛍 Tienda</h2><p class="coinline">Tenés <b>${SV.coins} 🪙</b></p><div class="list">${rows}<div class="li"><span>❤</span><div><b>Vida extra permanente</b><small>4 vidas en cada nivel</small></div>${life ? `<button class="mini" disabled>Comprada</button>` : `<button class="mini buy" data-buy="vida" data-price="400">400 🪙</button>`}</div></div><button class="big" data-close>Cerrar</button>`);
}
$("#box").addEventListener("click", (e) => {
  const th = e.target.closest("button[data-theme]"); if (th) { SV.theme = th.dataset.theme; save(); applyTheme(); showShop(); return; }
  const b = e.target.closest("[data-buy]"); if (!b) return;
  const price = +b.dataset.price, id = b.dataset.buy;
  if (SV.coins < price) { toast("Te faltan monedas. ¡Seguí jugando!"); vib(40); return; }
  SV.coins -= price; SV.owned.push(id); if (id !== "vida") SV.theme = id; save(); beep(SND.win); applyTheme(); showShop(); renderHome();
});

// ---------- Juego ----------
let G = null, timerId = null;
function pickWords(lv) {
  const [a, b] = rangeOf(lv);
  let c = []; for (let n = a; n <= b; n++) c = c.concat(POOL[n] || []);
  const fresh = c.filter((x) => !SV.seen.includes(x.L));
  const src = fresh.length >= PER_LEVEL + 5 ? fresh : c;
  return shuffle(src);
}
function startLevel(lv) {
  closeModal();
  SV.played++; save();
  CUR = CUR; G = { kind: CUR, lv, queue: pickWords(lv), solved: 0, lives: maxLives(), lostLives: 0, hints: 0, streak: 0, paused: false, over: false, busy: false };
  $("#home").hidden = true; $("#game").hidden = false;
  nextWord();
}
function nextWord() {
  if (!G.duel && G.queue.length < 3) G.queue = G.queue.concat(pickWords(G.lv));
  const w = G.queue.shift();
  if (!G.duel) { SV.seen.push(w.L); if (SV.seen.length > 160) SV.seen.shift(); }
  G.w = w; G.target = w.L; G.len = w.L.length;
  G.hl = null; G.hinted = false;
  G.tiles = (w.scr || makeScr(w.L, G.kind, G.lv || 5)).map((ch, id) => ({ ch, id }));
  G.ans = Array(G.len).fill(null); G.locked = Array(G.len).fill(false);
  G.total = G.left = timerTotal(); G.wordHints = 0; G.busy = false;
  renderGame(); startTimer();
}
const timerTotal = () => timeFor(G.duel ? 5 : G.lv, G.len) + (G.kind === "hid" ? 10 : 0);
// Palabras escondidas: la palabra va mezclada con letras de más (no se usan todas).
const VOW = "AEIOU", CON = "BCDFGLMNPRSTVZ";
function makeScr(L, kind, lv) {
  if (kind !== "hid") return scramble(L);
  const extra = Math.max(3, Math.min(3 + Math.floor(lv / 3), 6, 14 - L.length));
  const a = [...L];
  for (let i = 0; i < extra; i++) a.push(rnd(5) < 2 ? VOW[rnd(5)] : CON[rnd(CON.length)]);
  return shuffle(a);
}
const WSET = new Set(); for (const k in POOL) for (const x of POOL[k]) WSET.add(x.L);
function markHint() {
  G.hinted = true; const take = new Set();
  for (const ch of G.target) { const t = G.tiles.find((x) => x.ch === ch && !take.has(x.id)); if (t) take.add(t.id); }
  G.hl = take; renderTiles(); float("¡Pista! Letras marcadas", "good"); beep(SND.coin);
}
function renderGame() {
  $("#gCoins").textContent = SV.coins;
  livesUI();
  const dn = G.duel ? G.n : G.solved;
  $("#gDots").innerHTML = Array.from({ length: PER_LEVEL }, (_, i) => `<i class="${i < dn ? "done" : i === dn ? "cur" : ""}"></i>`).join("");
  $("#gCat").textContent = G.w.c; $("#gLen").textContent = G.kind === "hid" ? `${G.len} letras · sobran ${G.tiles.length - G.len}` : `${G.len} letras`;
  $("#gStreak").textContent = G.streak >= 2 ? `🔥 Racha x${G.streak}` : "";
  renderTiles(); renderTime();
}
function livesUI() { $("#gLives").innerHTML = G.duel ? `<span class="on" style="font-size:16px;color:var(--ac)">⚔ ${G.duel.pts} pts</span>` : Array.from({ length: maxLives() }, (_, i) => `<span class="${i < G.lives ? "on" : ""}">❤</span>`).join(""); }
function renderTiles() {
  const used = new Set(G.ans.filter((x) => x !== null));
  $("#gSlots").innerHTML = G.ans.map((id, i) => `<button class="tile slot ${id !== null ? "fill" : ""} ${G.locked[i] ? "lock" : ""}" data-slot="${i}" ${G.locked[i] ? "disabled" : ""}>${id !== null ? G.tiles[id].ch : ""}</button>`).join("");
  $("#gPool").innerHTML = G.tiles.map((t) => `<button class="tile ${used.has(t.id) ? "gone" : ""} ${G.hl && G.hl.has(t.id) ? "hl" : ""}" data-tile="${t.id}" ${used.has(t.id) ? "disabled" : ""}>${t.ch}</button>`).join("");
}
function renderTime() {
  const pct = Math.max(0, G.left / G.total);
  $("#gBar").style.width = pct * 100 + "%";
  $("#gBar").className = pct < 0.25 ? "low" : pct < 0.5 ? "mid" : "";
  $("#gTime").textContent = Math.ceil(Math.max(0, G.left)) + " s";
}
function startTimer() {
  clearInterval(timerId); let last = performance.now();
  timerId = setInterval(() => {
    const now = performance.now(), dt = (now - last) / 1000; last = now;
    if (!G || G.paused || G.over || G.busy) return;
    G.left -= dt; renderTime();
    if (G.kind === "hid" && !G.hinted && G.left <= 10 && G.left > 0) markHint();
    if (G.left <= 0) failWord("¡Se acabó el tiempo!");
  }, TICK);
}
function place(id) {
  const i = G.ans.indexOf(null); if (i < 0 || G.busy || G.paused) return;
  G.ans[i] = id; renderTiles(); beep([[500 + i * 40, 0.05]]);
  if (G.ans.every((x) => x !== null)) checkAnswer();
}
function takeBack(i) { if (G.busy || G.paused || G.locked[i] || G.ans[i] === null) return; G.ans[i] = null; renderTiles(); }
function checkAnswer() {
  const word = G.ans.map((id) => G.tiles[id].ch).join("");
  const alt = ALL.get([...G.target].sort().join(""));
  if (word === G.target || (G.kind === "hid" ? WSET.has(word) : alt && alt.has(word))) return solveWord();
  G.busy = true; $("#gSlots").classList.add("shake"); beep(SND.bad); vib([60, 40, 60]);
  G.left = Math.max(0.1, G.left - 3); renderTime(); float("−3 s", "bad");
  setTimeout(() => { $("#gSlots").classList.remove("shake"); G.ans = G.ans.map((id, i) => (G.locked[i] ? id : null)); G.busy = false; renderTiles(); }, 450);
}
function float(t, cls) { const f = $("#gFloat"); f.className = "float " + (cls || ""); f.textContent = t; void f.offsetWidth; f.classList.add("go"); }
function solveWord() {
  G.busy = true; G.solved++; G.streak++; SV.solved++; SV.bestStreak = Math.max(SV.bestStreak, G.streak);
  const ratio = G.left / G.total; if (G.wordHints === 0) SV.fastest = Math.max(SV.fastest, ratio);
  const gain = Math.max(5, 10 + G.len + Math.ceil(10 * ratio) + Math.min(G.streak, 10) * 2 - 5 * G.wordHints);
  if (G.duel) { G.duel.pts += gain; G.n++; } else SV.coins += gain; save();
  liveSend();
  $("#gSlots").classList.add("win"); $("#gCoins").textContent = SV.coins;
  float(`+${gain} 🪙${G.streak >= 2 ? "  🔥x" + G.streak : ""}`, "good"); beep(SND.ok); vib(25);
  checkAch(); renderGame();
  setTimeout(() => { $("#gSlots").classList.remove("win"); (G.duel ? G.n >= PER_LEVEL : G.solved >= PER_LEVEL) ? (G.duel ? duelDone() : levelDone()) : nextWord(); }, 900);
}
function failWord(msg) {
  if (G.busy && msg !== "skip") { /* ya resolviendo */ }
  G.busy = true; G.streak = 0; if (G.duel) G.n++; else { G.lives--; G.lostLives++; }
  liveSend(); beep(SND.lose); vib(120);
  G.ans = [...G.target].map((ch) => { const t = G.tiles.find((x) => x.ch === ch && !G.ans.includes(x.id)) || G.tiles.find((x) => x.ch === ch); return t.id; });
  // mostrar la solución (puede repetir fichas con la misma letra; sólo es visual)
  const sol = [...G.target]; const taken = new Set();
  G.ans = sol.map((ch) => { const t = G.tiles.find((x) => x.ch === ch && !taken.has(x.id)); taken.add(t.id); return t.id; });
  G.locked = Array(G.len).fill(true); renderTiles(); $("#gSlots").classList.add("reveal");
  float(msg === "skip" ? (G.duel ? "Pasaste" : "Pasaste: −❤") : msg, "bad"); renderGame2();
  setTimeout(() => { $("#gSlots").classList.remove("reveal"); G.duel ? (G.n >= PER_LEVEL ? duelDone() : nextWord()) : G.lives <= 0 ? levelFailed() : nextWord(); }, 1700);
}
function renderGame2() { livesUI(); $("#gStreak").textContent = ""; }

// Herramientas
function hint() {
  if (G.busy || G.paused) return;
  if (G.duel) return toast("En los duelos no hay pistas");
  if (SV.coins < 10) { toast("Te faltan monedas para la pista"); vib(40); return; }
  const i = G.locked.findIndex((l) => !l); if (i < 0) return;
  const ch = G.target[i];
  const used = new Set(G.ans.filter((x) => x !== null));
  let t = G.tiles.find((x) => x.ch === ch && !used.has(x.id));
  if (!t) { const j = G.ans.findIndex((id, k) => id !== null && !G.locked[k] && G.tiles[id].ch === ch); t = G.tiles[G.ans[j]]; G.ans[j] = null; }
  if (G.ans[i] !== null) G.ans[i] = null;
  G.ans[i] = t.id; G.locked[i] = true; SV.coins -= 10; G.hints++; G.wordHints++; save();
  $("#gCoins").textContent = SV.coins; renderTiles(); beep(SND.coin);
  if (G.ans.every((x) => x !== null)) checkAnswer();
}
function moreTime() { if (G.busy || G.paused) return; if (G.duel) return toast("En los duelos no hay tiempo extra"); if (SV.coins < 15) { toast("Te faltan monedas"); vib(40); return; } SV.coins -= 15; G.left += 15; G.total = Math.max(G.total, G.left); save(); $("#gCoins").textContent = SV.coins; renderTime(); beep(SND.coin); float("+15 s", "good"); }
function pause(on) {
  if (!G || G.over || (G.duel && G.duel.live)) return; G.paused = on;
  $("#game").classList.toggle("paused", on);
  if (on) modal(`<h2>⏸ Pausa</h2><p>El tiempo está detenido.</p><button class="big" id="resume">▶ Seguir</button><button class="link" id="quit">Salir al inicio</button>`, true);
  else closeModal();
}
function levelDone() {
  G.over = true; clearInterval(timerId);
  const st = G.lostLives === 0 && G.hints === 0 ? 3 : G.lostLives <= 1 ? 2 : 1;
  const bonus = 50 + 10 * G.lv;
  const K = KSk(G.kind);
  SV[K.st][G.lv] = Math.max(SV[K.st][G.lv] || 0, st); SV.coins += bonus;
  const first = G.lv === SV[K.lv]; const before = titleOf(topLevel());
  if (first) SV[K.lv]++; save(); checkAch(); beep(SND.win); vib([80, 50, 120]);
  const after = titleOf(topLevel());
  modal(`<h2>🎉 ¡Nivel ${G.lv} superado!</h2><div class="stars big3">${stars(st)}</div><p class="big2">+${bonus} 🪙</p><p>${st === 3 ? "¡Perfecto! Sin perder vidas ni usar pistas." : st === 2 ? "Muy bien. Probá no perder vidas para las 3 estrellas." : "Superado. Intentá de nuevo para ganar más estrellas."}</p>${after !== before ? `<p class="rankup">Nuevo rango: <b>${after}</b></p>` : ""}<button class="big" id="nextLv">Nivel ${first ? G.lv + 1 : SV[K.lv]} ▶</button><button class="link" id="goHome">Inicio</button>`, true);
}
function levelFailed() {
  G.over = true; clearInterval(timerId); save(); beep(SND.lose);
  modal(`<h2>💔 Sin vidas</h2><p>Resolviste ${G.solved} de ${PER_LEVEL} palabras. ¡Podés volver a intentarlo con palabras nuevas!</p><button class="big" id="retry">Reintentar nivel ${G.lv}</button><button class="link" id="goHome">Inicio</button>`, true);
}
function toHome() { if (LIVE) { Net.send({ t: "quit" }); liveReset(); } closeModal(); clearInterval(timerId); G = null; $("#game").hidden = true; $("#menu").hidden = true; $("#home").hidden = false; viewLevel = curLevel(); renderHome(); }

// ---------- Eventos ----------
$("#btnDuel").onclick = () => askName(() => startDuel(Math.floor(Math.random() * 1e9), null, CUR));
$("#btnLive").onclick = () => askName(() => liveHost(CUR));
$("#btnMenu").onclick = showMenu;
document.addEventListener("click", (e) => { const c = e.target.closest("[data-game]"); if (c) openGame(c.dataset.game); });
$("#btnPlay").onclick = () => startLevel(viewLevel);
$("#btnDaily").onclick = claimDaily;
$("#btnAch").onclick = showAch; $("#btnShop").onclick = showShop; $("#btnStats").onclick = showStats;
$("#btnSound").onclick = () => { SV.sound = !SV.sound; save(); renderHome(); };
$("#btnHome").onclick = () => { if (!G) return; if (G.duel && G.duel.live) { if (confirm("¿Abandonar el duelo?")) toHome(); return; } pause(true); };
$("#btnPause").onclick = () => pause(true);
$("#gPool").onclick = (e) => { const b = e.target.closest("[data-tile]"); if (b) place(+b.dataset.tile); };
$("#gSlots").onclick = (e) => { const b = e.target.closest("[data-slot]"); if (b) takeBack(+b.dataset.slot); };
$("#tShuffle").onclick = () => { if (G && !G.busy && !G.paused) { G.tiles = shuffle(G.tiles); G.tiles.forEach((t) => (t.id = t.id)); const map = new Map(G.tiles.map((t, i) => [t.id, i])); renderTiles(); } };
$("#tHint").onclick = hint; $("#tTime").onclick = moreTime;
$("#tSkip").onclick = () => { if (G && !G.busy && !G.paused) failWord("skip"); };
document.addEventListener("click", (e) => {
  if (e.target.id === "resume") pause(false);
  else if (e.target.id === "quit" || e.target.id === "goHome") toHome();
  else if (e.target.id === "nextLv") startLevel(Math.min(G.lv + 1, curLevel()));
  else if (e.target.id === "retry") startLevel(G.lv);
});
document.addEventListener("keydown", (e) => {
  if (!G || G.busy || G.paused || G.over || e.ctrlKey || e.metaKey) return;
  if (e.key === "Backspace") { for (let i = G.len - 1; i >= 0; i--) if (G.ans[i] !== null && !G.locked[i]) { takeBack(i); break; } return; }
  if (e.key.length !== 1) return;
  const ch = strip(e.key.toLowerCase()).toUpperCase();
  const used = new Set(G.ans.filter((x) => x !== null)), t = G.tiles.find((x) => x.ch === ch && !used.has(x.id));
  if (t) place(t.id);
});
document.addEventListener("visibilitychange", () => { if (document.hidden && G && !G.over && !G.paused && !$("#game").hidden) pause(true); });
let installEv = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEv = e; $("#btnInstall").hidden = false; });
window.addEventListener("appinstalled", () => { $("#btnInstall").hidden = true; });
$("#btnInstall").onclick = async () => { if (!installEv) return; installEv.prompt(); try { await installEv.userChoice; } catch {} installEv = null; $("#btnInstall").hidden = true; };


// ---------- Duelos (desafiar a un amigo por link) ----------
// Los dos juegan las mismas 10 palabras (salen de un número "semilla" que viaja en el link). Gana quien suma más puntos.
function askName(then) {
  if (SV.name) return then();
  modal(`<h2>⚔ Tu nombre</h2><p>Así te va a ver tu rival.</p><input id="nameIn" maxlength="16" placeholder="Tu nombre" autocomplete="nickname"><button class="big" id="nameOk">Continuar</button><button class="link" data-close>Cancelar</button>`);
  $("#nameOk").onclick = () => { const v = $("#nameIn").value.trim().slice(0, 16); if (!v) return toast("Escribí un nombre"); SV.name = v; save(); closeModal(); then(); };
}
function duelWords(seed, kind) {
  const old = R; R = mulberry(seed);
  let c = []; for (let n = kind === "hid" ? 5 : 5; n <= (kind === "hid" ? 6 : 7); n++) c = c.concat(POOL[n]);
  const out = shuffle(c).slice(0, PER_LEVEL).map((w) => ({ ...w, scr: makeScr(w.L, kind, 5) }));
  R = old; return out;
}
function startDuel(seed, from, kind, live) {
  kind = kind || CUR; CUR = kind;
  closeModal(); history.replaceState(null, "", location.pathname);
  G = { kind, duel: { seed, from, pts: 0, kind, live: !!live }, lv: 0, queue: duelWords(seed, kind), solved: 0, n: 0, lives: 99, lostLives: 0, hints: 0, streak: 0, paused: false, over: false, busy: false };
  $("#home").hidden = true; $("#menu").hidden = true; $("#game").hidden = false; liveBar(); nextWord();
}
const duelLink = (seed, score, kind) => `${location.origin}${location.pathname}#d=${seed}.${score}.${kind || CUR}.${encodeURIComponent(SV.name)}`;
function shareDuel(seed, score, text) {
  const url = duelLink(seed, score, G && G.duel && G.duel.kind);
  const msg = `${text}\n${url}`;
  if (navigator.share) navigator.share({ title: "Anagrama", text, url }).catch(() => {});
  else window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
}
function copyLink(seed, score) { const url = duelLink(seed, score, G && G.duel && G.duel.kind); (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url)); }
function duelDone() {
  G.over = true; clearInterval(timerId);
  if (G.duel.live) return liveDone();
  const d = G.duel, me = d.pts; SV.duels++;
  let head, body = "";
  if (d.from) {
    const w = me > d.from.score ? 1 : me < d.from.score ? -1 : 0;
    if (w > 0) { SV.duelWins++; SV.coins += 50; }
    head = w > 0 ? "🏆 ¡Ganaste!" : w < 0 ? "😮 Perdiste" : "🤝 ¡Empate!";
    body = `<div class="vs"><div><small>Vos</small><b>${me}</b></div><span>vs</span><div><small>${esc(d.from.name)}</small><b>${d.from.score}</b></div></div>${w > 0 ? '<p class="big2">+50 🪙</p>' : ""}`;
  } else {
    head = "⚔ ¡Listo!"; body = `<div class="vs"><div><small>Tu puntaje</small><b>${me}</b></div></div><p>Mandale el desafío a un amigo: va a jugar las mismas palabras y vamos a ver quién gana.</p>`;
  }
  save(); checkAch(); beep(SND.win);
  const nameOk = SV.name;
  modal(`<h2>${head}</h2>${body}<button class="big" id="dShare">📤 ${d.from ? "Desafiar de vuelta" : "Invitar a un amigo"}</button><button class="mini wide" id="dCopy">Copiar link</button><button class="link" id="goHome">Inicio</button>`, true);
  const txt = d.from ? `¡Te devuelvo el desafío en Anagrama! Hice ${me} puntos, superalos.` : `${nameOk} te desafía en ${NAMES[d.kind]}: hizo ${me} puntos. ¿Podés superarlo?`;
  $("#dShare").onclick = () => shareDuel(d.seed, me, txt);
  $("#dCopy").onclick = () => copyLink(d.seed, me);
}
function checkInvite() {
  const r = /^#r=([A-Z0-9]{5})\.(ana|hid)$/.exec(location.hash);
  if (r && !G) {
    modal(`<h2>⚔ Duelo en vivo</h2><p>Te invitaron a jugar <b>${NAMES[r[2]]}</b> en tiempo real.</p><button class="big" id="liveEnter">Entrar al duelo</button><button class="link" data-close>Ahora no</button>`, true);
    $("#liveEnter").onclick = () => askName(() => liveJoin(r[1], r[2]));
    return;
  }
  const m = /^#d=(\d+)\.(\d+)\.(?:(ana|hid)\.)?(.*)$/.exec(location.hash); if (!m) return;
  const seed = +m[1], score = +m[2], kind = m[3] || "ana"; let name = "Un amigo"; try { name = decodeURIComponent(m[4]).slice(0, 16) || name; } catch {}
  if (G) return;
  modal(`<h2>⚔ ¡${esc(name)} te desafió!</h2><p>Hizo <b>${score} puntos</b> en 10 palabras de <b>${NAMES[kind]}</b>. Jugás las mismas palabras: si lo superás, ganás.</p><button class="big" id="accept">Aceptar el desafío</button><button class="link" data-close>Ahora no</button>`, true);
  $("#accept").onclick = () => askName(() => startDuel(seed, { name, score }, kind));
}
window.addEventListener("hashchange", checkInvite);

// ---------- Menú ----------
function showMenu() {
  $("#home").hidden = true; $("#game").hidden = true; $("#menu").hidden = false;
  $("#mCoins").textContent = SV.coins; applyTheme();
  $("#mLvAna").textContent = `Nivel ${SV.level}`; $("#mLvHid").textContent = `Nivel ${SV.lvH}`;
}
function openGame(k) { CUR = k; viewLevel = curLevel(); $("#menu").hidden = true; $("#home").hidden = false; renderHome(); }

// ---------- Duelo en vivo ----------
// Conexión directa entre los dos celulares (WebRTC) usando PeerJS; no hay servidor propio.
// Net es una capa fina: se puede reemplazar por otro servicio (p. ej. Firebase) sin tocar el resto del juego.
const PEER_SRC = "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js";
const PEER_CFG = window.PEER_CFG || {};
const pid = (c) => "anagrama-" + c.toLowerCase();
const Net = {
  peer: null, conn: null, h: null,
  load() { return window.Peer ? Promise.resolve() : new Promise((ok, ko) => { const s = document.createElement("script"); s.src = PEER_SRC; s.onload = ok; s.onerror = () => ko(new Error("lib")); document.head.appendChild(s); }); },
  wire(c, h) { this.conn = c; c.on("open", () => h.onPeer()); c.on("data", (m) => h.onMsg(m)); c.on("close", () => h.onClose()); c.on("error", () => h.onClose()); },
  host(code, h) {
    this.h = h; this.peer = new window.Peer(pid(code), PEER_CFG);
    this.peer.on("open", () => h.onReady());
    this.peer.on("connection", (c) => { if (this.conn) { c.on("open", () => c.close()); return; } this.wire(c, h); });
    this.peer.on("error", (e) => h.onError(e.type || "error"));
  },
  join(code, h) {
    this.h = h; this.peer = new window.Peer(undefined, PEER_CFG);
    this.peer.on("open", () => this.wire(this.peer.connect(pid(code), { reliable: true }), h));
    this.peer.on("error", (e) => h.onError(e.type || "error"));
  },
  send(m) { try { if (this.conn && this.conn.open) this.conn.send(m); } catch {} },
  close() { try { this.conn && this.conn.close(); } catch {} try { this.peer && this.peer.destroy(); } catch {} this.peer = this.conn = this.h = null; },
};
let LIVE = null;
const CODE_CH = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 5 }, () => CODE_CH[Math.floor(Math.random() * CODE_CH.length)]).join("");
const oppName = () => esc((LIVE && LIVE.opp.name) || "Rival");
function liveReset() { clearTimeout(LIVE && LIVE.to); Net.close(); LIVE = null; const b = $("#gRival"); if (b) b.hidden = true; }
function liveFail(msg) { liveReset(); modal(`<h2>⚔ Duelo en vivo</h2><p>${msg}</p><button class="big" data-close>Entendido</button>`); }
function liveSend() { if (G && G.duel && G.duel.live) Net.send({ t: "prog", n: G.n, pts: G.duel.pts }); }
function liveBar() {
  const b = $("#gRival"); if (!b) return;
  if (!(G && G.duel && G.duel.live && LIVE)) { b.hidden = true; return; }
  const o = LIVE.opp; b.hidden = false;
  b.textContent = `⚔ ${o.name || "Rival"}: ${o.n}/${PER_LEVEL} · ${o.pts} pts${o.left ? " (se fue)" : o.done ? " ✔" : ""}`;
}
function handlers(role) {
  return {
    onReady() { if (role === "host") showLobby(); },
    onPeer() { Net.send({ t: "hello", name: SV.name }); },
    onMsg(m) {
      if (!m || !LIVE) return;
      if (m.t === "hello") { LIVE.opp.name = String(m.name || "Rival").slice(0, 16); if (role === "host" && !LIVE.started) sendStart(); }
      else if (m.t === "start" && role === "guest") runStart(m.seed, m.kind);
      else if (m.t === "prog") { LIVE.opp.n = +m.n || 0; LIVE.opp.pts = +m.pts || 0; liveBar(); }
      else if (m.t === "done") { LIVE.opp.pts = +m.pts || 0; LIVE.opp.n = PER_LEVEL; LIVE.opp.done = true; liveBar(); if (G && G.over) showLiveResult(); }
      else if (m.t === "rematch" && role === "host") sendStart();
      else if (m.t === "quit") { LIVE.opp.left = true; toast("El rival abandonó el duelo"); liveBar(); if (G && G.over) showLiveResult(); }
    },
    onClose() {
      if (!LIVE) return;
      if (!LIVE.started) return liveFail("Se cortó la conexión con tu rival.");
      LIVE.opp.left = true; toast("Se desconectó el rival"); liveBar(); if (G && G.over) showLiveResult();
    },
    onError(type) {
      if (!LIVE) return;
      if (type === "unavailable-id" && role === "host" && LIVE.tries < 4) { LIVE.tries++; Net.close(); return hostTry(); }
      if (type === "peer-unavailable") return liveFail("Esa sala ya no existe. Pedile a tu amigo que cree otra.");
      if (LIVE.started) return;
      liveFail("No se pudo conectar. Revisá tu internet o probá con otra red (wifi/datos).");
    },
  };
}
async function liveHost(kind) {
  liveReset();
  LIVE = { role: "host", kind, code: "", tries: 0, started: false, opp: { name: "", n: 0, pts: 0, done: false, left: false } };
  modal(`<h2>⚔ Duelo en vivo</h2><p>Preparando la sala…</p><button class="link" data-close id="liveCancel">Cancelar</button>`, true);
  try { await Net.load(); } catch { return liveFail("No se pudo cargar la conexión en vivo. Revisá tu internet."); }
  hostTry();
}
function hostTry() { LIVE.code = newCode(); Net.host(LIVE.code, handlers("host")); }
function showLobby() {
  const url = liveLink(LIVE.code, LIVE.kind);
  modal(`<h2>⚔ Duelo en vivo</h2><p>Mandale este link a tu rival. Cuando entre, empieza solo.</p><div class="code">${LIVE.code}</div><button class="big" id="lvShare">📤 Invitar</button><button class="mini wide" id="lvCopy">Copiar link</button><p>Esperá en esta pantalla hasta que se conecte.</p><button class="link" id="lvCancel">Cancelar</button>`, true);
  $("#lvShare").onclick = () => { const text = `${SV.name} te invita a un duelo en vivo de ${NAMES[LIVE.kind]}. ¡Entrá!`; if (navigator.share) navigator.share({ title: "Anagrama", text, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url), "_blank"); };
  $("#lvCopy").onclick = () => (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url));
  $("#lvCancel").onclick = () => { liveReset(); closeModal(); };
}
const liveLink = (code, kind) => `${location.origin}${location.pathname}#r=${code}.${kind}`;
async function liveJoin(code, kind) {
  liveReset(); history.replaceState(null, "", location.pathname);
  LIVE = { role: "guest", kind, code, tries: 0, started: false, opp: { name: "", n: 0, pts: 0, done: false, left: false } };
  modal(`<h2>⚔ Duelo en vivo</h2><p>Conectando con tu rival…</p><button class="link" id="lvCancel">Cancelar</button>`, true);
  $("#lvCancel").onclick = () => { liveReset(); closeModal(); };
  try { await Net.load(); } catch { return liveFail("No se pudo cargar la conexión en vivo. Revisá tu internet."); }
  LIVE.to = setTimeout(() => { if (LIVE && !LIVE.started && !LIVE.opp.name) liveFail("No se pudo conectar con tu rival. ¿Sigue esperando en la sala?"); }, 15000);
  Net.join(code, handlers("guest"));
}
function sendStart() { const seed = Math.floor(Math.random() * 1e9); Net.send({ t: "start", seed, kind: LIVE.kind }); runStart(seed, LIVE.kind); }
function runStart(seed, kind) {
  LIVE.started = true; LIVE.kind = kind; LIVE.opp.n = 0; LIVE.opp.pts = 0; LIVE.opp.done = false; LIVE.opp.left = false; clearTimeout(LIVE.to);
  clearInterval(timerId); G = null;
  let n = 3; modal(`<h2>⚔ ${oppName()}</h2><p>${NAMES[kind]} · 10 palabras</p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); startDuel(seed, null, kind, true); } else $("#cd").textContent = n; }, 1000);
}
function liveDone() {
  const me = G.duel.pts; Net.send({ t: "done", pts: me });
  if (LIVE.opp.done || LIVE.opp.left) return showLiveResult();
  modal(`<h2>⏳ ¡Terminaste!</h2><p>Hiciste <b>${me} pts</b>. Esperando que ${oppName()} termine…</p><button class="link" id="goHome">Salir</button>`, true);
}
function showLiveResult() {
  if (!LIVE || !G || !G.duel || !G.duel.live) return;
  const me = G.duel.pts, o = LIVE.opp, w = me > o.pts ? 1 : me < o.pts ? -1 : 0;
  if (!G.paid) { G.paid = true; SV.duels++; if (w > 0) { SV.duelWins++; SV.coins += 50; } save(); checkAch(); beep(SND.win); }
  modal(`<h2>${w > 0 ? "🏆 ¡Ganaste!" : w < 0 ? "😮 Perdiste" : "🤝 ¡Empate!"}</h2><div class="vs"><div><small>Vos</small><b>${me}</b></div><span>vs</span><div><small>${oppName()}</small><b>${o.pts}</b></div></div>${o.left && !o.done ? "<p>Tu rival abandonó antes de terminar.</p>" : ""}${w > 0 ? '<p class="big2">+50 🪙</p>' : ""}${o.left ? "" : '<button class="big" id="lvRe">🔁 Revancha</button>'}<button class="link" id="goHome">Inicio</button>`, true);
  const re = $("#lvRe"); if (re) re.onclick = () => { if (LIVE.role === "host") sendStart(); else { Net.send({ t: "rematch" }); re.textContent = "Pedido enviado…"; re.disabled = true; } };
}

viewLevel = SV.level; showMenu(); checkInvite();
