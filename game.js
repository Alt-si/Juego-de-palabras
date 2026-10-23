"use strict";
// Anagrama. Todo el progreso se guarda en este dispositivo (localStorage).
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const PER_LEVEL = 10, LIVES = 3, TICK = 100;

// ---------- Guardado ----------
const DEF = { coins: 0, adBest: {}, pts: { ana: 0, hid: 0, adi: 0, cri: 0, qv: 0, tf: 0 }, crLv: { f: 1, m: 1, d: 1, e: 1 }, crDiff: "f", dif: { ana: "m", hid: "m", adi: "m" }, crSeen: [], crSolved: 0, qvLv: 1, qvSeen: [], qvSolved: 0, starsQ: [], adQuick: 0, adAces: 0, adLevel: 1, adSeen: [], level: 1, stars: {}, lvH: 1, starsH: {}, solved: 0, bestStreak: 0, ach: {}, theme: "claro", owned: ["claro"], sound: true, lastDaily: "", dailyStreak: 0, seen: [], played: 0, fastest: 0, name: "", duels: 0, duelWins: 0 };
let SV;
try { SV = { ...DEF, ...JSON.parse(localStorage.getItem("anagrama-v1") || "{}") }; } catch { SV = { ...DEF }; }
// Monedas individuales por juego: SV.coins apunta a la billetera del juego en pantalla.
{
  const old = SV.coins || 0;
  if (!SV.wal) SV.wal = { ana: old, hid: 0, adi: 0, cri: 0, qv: 0 };
  const key = () => { try { if (!$("#tfHome").hidden || !$("#tfGame").hidden) return "tf"; if (!$("#crHome").hidden || !$("#crGame").hidden) return "cri"; if (!$("#qvHome").hidden || !$("#qvGame").hidden) return "qv"; if (adOn) return "adi"; } catch {} return CUR === "hid" ? "hid" : "ana"; };
  Object.defineProperty(SV, "coins", { enumerable: false, configurable: true, get() { return SV.wal[key()] || 0; }, set(v) { SV.wal[key()] = v; } });
}
const walletTotal = () => Object.values(SV.wal).reduce((a, b) => a + b, 0);
const save = () => { try { localStorage.setItem("anagrama-v1", JSON.stringify(SV)); } catch {} };

// ---------- Reglas de niveles ----------
// Largo de las palabras y tiempo: suben de a poco a lo largo de 1000 niveles.
const rangeOf = (lv) => { const t = 4 + Math.floor(Math.pow(lvP(lv), 0.6) * 8.99); return [Math.max(4, t - 3), Math.min(12, t + 1)]; };
const timeFor = (lv, len) => Math.max(15, Math.round((20 + 5 * len - Math.min(lv, 15) * 2) * (1 - 0.35 * lvP(lv))));
const titleOf = (lv) => lvTitle(lv);
// Dificultad elegible (Anagrama, Escondidas, Adivina): modifica tiempo, largo, letras de más, tier de palabras y puntos.
const DIF = {
  f: { name: "Fácil", icon: "🌱", time: 1.5, len: -1, extra: -2, tier: -1, mult: 0.7, hint: 10, lives: 0, clues: 10 },
  m: { name: "Medio", icon: "🌿", time: 1, len: 0, extra: 0, tier: 0, mult: 1, hint: 10, lives: 0, clues: 10 },
  d: { name: "Difícil", icon: "🔥", time: 0.7, len: 1, extra: 3, tier: 1, mult: 1.6, hint: 20, lives: 0, clues: 8 },
  e: { name: "Experto", icon: "💀", time: 0.45, len: 3, extra: 6, tier: 3, mult: 3, hint: 40, lives: -1, clues: 6 },
};
const difOf = (k) => DIF[(SV.dif && SV.dif[k]) || "m"];
const gameDif = () => (typeof G !== "undefined" && G && G.duel ? DIF.m : difOf(CUR));
function difBar(el, k) {
  el.innerHTML = Object.entries(DIF).map(([c, v]) => `<button data-dg="${c}" class="${SV.dif[k] === c ? "on" : ""}"><span>${v.icon}</span><b>${v.name}</b><small>×${String(v.mult).replace(".", ",")} pts</small></button>`).join("");
  el.onclick = (e) => { const b = e.target.closest("[data-dg]"); if (b) { SV.dif[k] = b.dataset.dg; save(); difBar(el, k); } };
}
let CUR = "ana"; // juego elegido en el menú: "ana" (Anagrama) o "hid" (Palabras escondidas)
function addPts(k, n) { SV.pts = SV.pts || { ana: 0, hid: 0, adi: 0, cri: 0 }; SV.pts[k] = (SV.pts[k] || 0) + n; SV.wal[k] = (SV.wal[k] || 0) + n; }
const duelRank = (k, n) => { SV.pts = SV.pts || {}; SV.pts[k] = (SV.pts[k] || 0) + n; }; // los duelos solo suman al rango cuando se gana
const ptsOf = (k) => (SV.pts && SV.pts[k]) || 0;
const totalPts = () => ptsOf("ana") + ptsOf("hid") + ptsOf("adi") + ptsOf("cri") + ptsOf("qv") + ptsOf("tf");
function globalRank() {
  const t = totalPts(); let i = 0; GRANKS.forEach((r, j) => { if (t >= r[0]) i = j; });
  const last = GRANKS.length - 1, base = GRANKS[i];
  if (i === last) { const k = Math.floor((t - base[0]) / GR_STAR); return { name: base[1] + (k ? " ✦" + k : ""), icon: base[2], nextIcon: base[2], i, next: base[0] + (k + 1) * GR_STAR, nextName: base[1] + " ✦" + (k + 1), from: base[0] + k * GR_STAR, total: t, endless: true }; }
  const n = GRANKS[i + 1]; return { name: base[1], icon: base[2], nextIcon: n[2], i, next: n[0], nextName: n[1], from: base[0], total: t };
}
const KSk = (k) => (k === "hid" ? { lv: "lvH", st: "starsH" } : { lv: "level", st: "stars" });
const KS = () => KSk(CUR);
const curLevel = () => SV[KS().lv];
const topLevel = () => Math.max(SV.level, SV.lvH);
const NAMES = { ana: "Anagrama", hid: "Palabras escondidas", adi: "Adivina", cri: "Frases encriptadas", qv: "¿Qué ves?", tf: "Tutti Frutti" };
const maxLives = (k) => Math.max(1, (SV.owned.includes("vida") ? LIVES + 1 : LIVES) + difOf(k || CUR).lives);
const hintCost = (k) => difOf(k).hint, timeCost = (k) => Math.round((difOf(k).hint * 1.5) / 5) * 5;
function costLabels() { const k = typeof G !== "undefined" && G ? G.kind : CUR, d = G && G.duel; $("#tHint small").textContent = `Pista · ${d ? 10 : hintCost(k)}🪙`; $("#tTime small").textContent = `+15 s · ${timeCost(k)}🪙`; }

const THEMES = [["claro", "Claro", 0], ["oscuro", "Oscuro", 80], ["oceano", "Océano", 150], ["bosque", "Bosque", 150], ["atardecer", "Atardecer", 200]];
const ACH = [
  ["first", "Primera palabra", "Resolvé tu primera palabra", () => SV.solved >= 1, 10],
  ["w50", "Medio centenar", "50 palabras resueltas", () => SV.solved >= 50, 50],
  ["w200", "Palabrero", "200 palabras resueltas", () => SV.solved >= 200, 150],
  ["s5", "En racha", "5 palabras seguidas", () => SV.bestStreak >= 5, 20],
  ["s10", "Imparable", "10 palabras seguidas", () => SV.bestStreak >= 10, 60],
  ["l5", "Nivel 5", "Llegá al nivel 5", () => SV.level >= 5, 50],
  ["l10", "Nivel 10", "Llegá al nivel 10", () => SV.level >= 10, 150],
  ["l50", "Nivel 50", "Llegá al nivel 50", () => SV.level >= 50 || SV.lvH >= 50, 300],
  ["l100", "Centenario", "Llegá al nivel 100", () => SV.level >= 100 || SV.lvH >= 100, 600],
  ["l250", "Maratonista", "Llegá al nivel 250", () => SV.level >= 250 || SV.lvH >= 250, 1500],
  ["l500", "Mitad del camino", "Llegá al nivel 500", () => SV.level >= 500 || SV.lvH >= 500, 3000],
  ["l1000", "Mil niveles", "Llegá al nivel 1000: ¡y seguí, que no termina!", () => SV.level >= 1000 || SV.lvH >= 1000, 8000],
  ["perfect", "Perfecto", "3 estrellas en un nivel", () => [...Object.values(SV.stars), ...Object.values(SV.starsH)].some((n) => n >= 3), 30],
  ["ad1", "Ojo de águila", "Adiviná una palabra con la primera pista", () => SV.adAces >= 1, 50],
  ["ad3", "Detective", "Adiviná 5 palabras con 3 pistas o menos", () => SV.adQuick >= 5, 60],
  ["adl5", "Rastreador", "Llegá al nivel 5 de Adivina", () => SV.adLevel >= 5, 60],
  ["adl50", "Inspector", "Llegá al nivel 50 de Adivina", () => SV.adLevel >= 50, 400],
  ["adl200", "Mente maestra", "Llegá al nivel 200 de Adivina", () => SV.adLevel >= 200, 2000],
  ["adl15", "Sabueso", "Llegá al nivel 15 de Adivina", () => SV.adLevel >= 15, 200],
  ["h5", "Buscapalabras", "Llegá al nivel 5 de Palabras escondidas", () => SV.lvH >= 5, 50],
  ["speed", "Rayo", "Resolvé una palabra con más del 75 % del tiempo sobrando", () => SV.fastest >= 0.75, 20],
  ["cr10", "Descifrador", "Resolvé 10 frases encriptadas", () => SV.crSolved >= 10, 40],
  ["cr50", "Criptógrafo", "Resolvé 50 frases encriptadas", () => SV.crSolved >= 50, 150],
  ["qv10", "Ojo de águila", "Resolvé 10 enigmas en ¿Qué ves?", () => SV.qvSolved >= 10, 40],
  ["qv100", "Ojo clínico", "Resolvé 100 enigmas en ¿Qué ves?", () => SV.qvSolved >= 100, 150],
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
  applyTheme(); viewLevel = Math.min(viewLevel, curLevel()); SCENES.apply(SCENES.world(viewLevel));
  $("#hLogo").innerHTML = [...(CUR === "hid" ? "ESCONDIDAS" : "ANAGRAMA")].map((c) => `<i>${c}</i>`).join("");
  $("#hTag").textContent = CUR === "hid" ? "Hay otra palabra escondida en las letras: encontrala" : "Ordená las letras y encontrá la palabra";
  difBar($("#hDiffs"), CUR === "hid" ? "hid" : "ana"); $("#hCoins").textContent = SV.coins;
  $("#hRank").textContent = titleOf(topLevel()) + " · " + ptsOf(CUR) + " pts";
  $("#btnSound").textContent = SV.sound ? "🔊" : "🔇";
    $("#hCard").innerHTML = `<div class="lvnav"><button class="ib" id="lvPrev10" ${viewLevel <= 1 ? "disabled" : ""} aria-label="10 niveles atrás">«</button><button class="ib" id="lvPrev" ${viewLevel <= 1 ? "disabled" : ""} aria-label="Nivel anterior">‹</button></div>
    <div class="mid"><small>Nivel</small><b>${viewLevel}</b><div class="stars">${stars(SV[KS().st][viewLevel] || 0)}</div><small>${viewLevel === curLevel() ? "Nivel actual" : "Ya superado: mejorá tus estrellas"}</small><small class="world">🌍 ${SCENES.worldName(viewLevel)}</small>${lvPath(viewLevel)}</div>
    <div class="lvnav"><button class="ib" id="lvNext" ${viewLevel >= curLevel() ? "disabled" : ""} aria-label="Nivel siguiente">›</button><button class="ib" id="lvNext10" ${viewLevel >= curLevel() ? "disabled" : ""} aria-label="10 niveles adelante">»</button></div>`;
  $("#lvPrev").onclick = () => { viewLevel--; renderHome(); };
  $("#lvNext").onclick = () => { viewLevel++; renderHome(); };
  $("#lvPrev10").onclick = () => { viewLevel = Math.max(1, viewLevel - 10); renderHome(); };
  $("#lvNext10").onclick = () => { viewLevel = Math.min(curLevel(), viewLevel + 10); renderHome(); };
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
// Confirmación dentro de la app (los confirm() del navegador pueden estar bloqueados en la app instalada)
function ask(msg, yes, yesLabel) { modal(`<h2>${msg}</h2><button class="big" id="askYes">${yesLabel || "Sí, salir"}</button><button class="link" data-close>Seguir jugando</button>`); $("#askYes").onclick = () => { closeModal(); yes(); }; }
$("#modal").addEventListener("click", (e) => { if (e.target.closest("[data-close]") || (e.target.id === "modal" && !$("#modal").dataset.lock)) closeModal(); });

function checkAch() {
  for (const [id, name, , test, reward] of ACH) if (!SV.ach[id] && test()) { SV.ach[id] = 1; SV.coins += reward; save(); toast(`🏅 ¡Logro: ${name}! +${reward} 🪙`); beep(SND.win); }
}
function showAch() {
  modal(`<h2>🏅 Logros</h2><div class="list">${ACH.map(([id, n, d, , r]) => `<div class="li ${SV.ach[id] ? "got" : ""}"><span>${SV.ach[id] ? "🏅" : "🔒"}</span><div><b>${n}</b><small>${d}</small></div><em>+${r}🪙</em></div>`).join("")}</div><p class="tag">Y después del ♾️ Eterno: una estrella ✦ por cada millón de puntos. ¡Esto no termina!</p><button class="big" data-close>Cerrar</button>`);
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
  const [a0, b0] = rangeOf(lv), dl = gameDif().len; let a = lvClamp(a0 + dl, 4, 12); const b = lvClamp(b0 + dl, a, 12);
  let c = []; for (let n = a; n <= b; n++) c = c.concat(POOL[n] || []);
  while (c.length < PER_LEVEL + 15 && a > 4) { a--; c = c.concat(POOL[a] || []); }
  const fresh = c.filter((x) => !SV.seen.includes(x.L));
  const src = fresh.length >= PER_LEVEL + 5 ? fresh : c;
  return shuffle(src);
}
function startLevel(lv) {
  closeModal();
  SV.played++; save();
  CUR = CUR; G = { kind: CUR, lv, queue: pickWords(lv), solved: 0, lives: maxLives(CUR), lostLives: 0, hints: 0, streak: 0, paused: false, over: false, busy: false };
  SCENES.apply(SCENES.world(lv)); $("#home").hidden = true; $("#game").hidden = false;
  nextWord();
}
function nextWord() {
  if (!G.duel && G.queue.length < 3) G.queue = G.queue.concat(pickWords(G.lv));
  const w = G.queue.shift();
  if (!G.duel) { SV.seen.push(w.L); if (SV.seen.length > 1500) SV.seen.shift(); }
  G.w = w; G.target = w.L; G.len = w.L.length;
  G.hl = null; G.hinted = false;
  G.tiles = (w.scr || makeScr(w.L, G.kind, G.lv || 5)).map((ch, id) => ({ ch, id }));
  G.ans = Array(G.len).fill(null); G.locked = Array(G.len).fill(false); G.order = null;
  G.total = G.left = timerTotal(); G.wordHints = 0; G.busy = false; G.lockUntil = performance.now() + 350; $("#gAnswer").textContent = "";
  renderGame(); startTimer();
}
const timerTotal = () => Math.round(timeFor(G.duel ? 5 : G.lv, G.len) * (G.duel ? 1 : difOf(G.kind).time)) + (G.kind === "hid" ? 10 : 0);
// El diccionario de Anagrama y Palabras escondidas se amplía con todas las palabras de Adivina (4 a 12 letras).
function extendPool() {
  const seen = new Set(Object.values(POOL).flat().map((x) => x.L));
  for (const e of buildAdivina().all) {
    if (!/^[a-záéíóúüñ]+$/i.test(e.w)) continue;
    const L = letters(e.w), n = L.length; if (n < 4 || n > 12 || seen.has(L)) continue;
    seen.add(L); (POOL[n] ||= []).push({ w: e.w, c: e.cat, L });
    const key = [...L].sort().join(""); (ALL.get(key) || ALL.set(key, new Set()).get(key)).add(L);
  }
}
extendPool();
// La pista de Escondidas se vuelve más vaga a medida que subís de nivel.
const hidClue = (w, c, lv) => { const ad = (buildAdivina().byWord.get(w) || { c: [] }).c, idx = 3 - Math.min(3, Math.floor(lvP(lv || 1) * 4)); return ((typeof CLUES !== "undefined" && lvP(lv || 1) < 0.5 && CLUES[w]) || ad[idx] || (typeof CLUES !== "undefined" && CLUES[w]) || ad[3] || (c ? "Categoría: " + c : "")); };
// Palabras escondidas: la palabra va mezclada con letras de más (no se usan todas).
const VOW = "AEIOU", CON = "BCDFGLMNPRSTVZ";
// Palabras escondidas: se muestra una palabra real (el "anfitrión", p. ej. ELIMINA) y adentro hay otra (LIMA) que se arma con algunas de sus letras, en cualquier orden.
const cntL = (s) => { const m = {}; for (const c of s) m[c] = (m[c] || 0) + 1; return m; };
const isSubseq = (a, b) => { let i = 0; for (const c of b) if (c === a[i]) i++; return i === a.length; };
function hidHost(L, lv) {
  const extra = Math.max(2, Math.min(3 + Math.round(8 * Math.pow(lvP(lv), 0.7)) + gameDif().extra, 9, 14 - L.length)), need = cntL(L); let best = null, bs = 1e9;
  for (let n = L.length + 2; n <= Math.min(14, L.length + extra + 3); n++) for (const x of POOL[n] || []) {
    if (x.c === "✨ Aprendidas" || x.L === L) continue;
    const h = cntL(x.L); if (Object.keys(need).some((c) => (h[c] || 0) < need[c])) continue;
    const sc = Math.abs(n - L.length - extra) + (isSubseq(L, x.L) ? 2.5 : 0) + rnd(1000) / 1000;
    if (sc < bs) { bs = sc; best = x; }
  }
  return best;
}
function makeScr(L, kind, lv) {
  if (kind !== "hid") return scramble(L);
  const host = hidHost(L, lv); if (host) { const a = [...host.L]; a.host = host.w; return a; }
  const extra = Math.max(2, Math.min(3 + Math.round(8 * Math.pow(lvP(lv), 0.7)) + gameDif().extra, 11, 16 - L.length));
  const a = [...L];
  for (let i = 0; i < extra; i++) a.push(rnd(5) < 2 ? VOW[rnd(5)] : CON[rnd(CON.length)]);
  return shuffle(a);
}
const WSET = new Set(); for (const k in POOL) for (const x of POOL[k]) WSET.add(x.L);
function markHint() {
  G.hinted = true; const take = new Set();
  for (const ch of G.target) { const t = G.tiles.find((x) => x.ch === ch && !take.has(x.id)); if (t) take.add(t.id); }
  G.hl = take; renderTiles(); beep(SND.coin);
}
function renderGame() {
  $("#gCoins").textContent = SV.coins;
  livesUI();
  const dn = G.duel ? G.n : G.solved;
  $("#gDots").innerHTML = Array.from({ length: PER_LEVEL }, (_, i) => `<i class="${i < dn ? "done" : i === dn ? "cur" : ""}"></i>`).join("");
  $("#gCat").textContent = G.w.c; $("#gLen").textContent = G.kind === "hid" ? `Escondida: ${G.len} letras · sobran ${G.tiles.length - G.len}` : `${G.len} letras`;
  const cl = G.kind === "hid" && hidClue(G.w.w, G.w.c, G.lv);
  $("#gClue").hidden = G.kind !== "hid"; $("#gClue").textContent = cl ? "💬 " + cl : " ";
  $("#gStreak").textContent = G.streak >= 2 ? `🔥 Racha x${G.streak}` : "";
  renderTiles(); renderTime();
}
function livesUI() { costLabels(); $("#gLives").innerHTML = G.duel ? `<span class="on" style="font-size:16px;color:var(--ac)">⚔ ${G.duel.pts} pts</span>` : Array.from({ length: maxLives(G.kind) }, (_, i) => `<span class="${i < G.lives ? "on" : ""}">❤</span>`).join(""); }
function renderTiles() {
  const used = new Set(G.ans.filter((x) => x !== null));
  $("#gSlots").innerHTML = G.ans.map((id, i) => `<button class="tile slot ${id !== null ? "fill" : ""} ${G.locked[i] ? "lock" : ""}" data-slot="${i}" ${G.locked[i] ? "disabled" : ""}>${id !== null ? G.tiles[id].ch : ""}</button>`).join("");
  $("#gPool").innerHTML = (G.order || G.tiles.map((t) => t.id)).map((i) => G.tiles[i]).map((t) => `<button class="tile ${used.has(t.id) ? "gone" : ""} ${G.hl && G.hl.has(t.id) ? "hl" : ""}" data-tile="${t.id}" ${used.has(t.id) ? "disabled" : ""}>${t.ch}</button>`).join("");
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
  const i = G.ans.indexOf(null); if (i < 0 || G.busy || G.paused || performance.now() < (G.lockUntil || 0)) return;
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
  const gain = Math.round(Math.max(5, 10 + G.len + Math.ceil(10 * ratio) + Math.min(G.streak, 10) * 2 - 5 * G.wordHints) * (G.duel ? 1 : difOf(G.kind).mult * lvMult(G.lv)));
  if (G.duel) { G.duel.pts += gain; G.n++; } else addPts(G.kind, gain); save();
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
  $("#gAnswer").innerHTML = `La palabra era: <b>${esc((G.w && G.w.w ? G.w.w : G.target).toUpperCase())}</b>`;
  setTimeout(() => { $("#gSlots").classList.remove("reveal"); G.duel ? (G.n >= PER_LEVEL ? duelDone() : nextWord()) : G.lives <= 0 ? levelFailed() : nextWord(); }, 2300);
}
function renderGame2() { livesUI(); $("#gStreak").textContent = ""; }

// Herramientas
function hint() {
  if (G.busy || G.paused) return;
  if (G.duel) return toast("En los duelos no hay pistas");
  if (SV.coins < hintCost(G.kind)) { toast("Te faltan monedas para la pista"); vib(40); return; }
  const i = G.locked.findIndex((l) => !l); if (i < 0) return;
  const ch = G.target[i];
  const used = new Set(G.ans.filter((x) => x !== null));
  let t = G.tiles.find((x) => x.ch === ch && !used.has(x.id));
  if (!t) { const j = G.ans.findIndex((id, k) => id !== null && !G.locked[k] && G.tiles[id].ch === ch); t = G.tiles[G.ans[j]]; G.ans[j] = null; }
  if (G.ans[i] !== null) G.ans[i] = null;
  G.ans[i] = t.id; G.locked[i] = true; SV.coins -= hintCost(G.kind); G.hints++; G.wordHints++; save();
  $("#gCoins").textContent = SV.coins; renderTiles(); beep(SND.coin);
  if (G.ans.every((x) => x !== null)) checkAnswer();
}
function moreTime() { if (G.busy || G.paused) return; if (G.duel) return toast("En los duelos no hay tiempo extra"); if (SV.coins < timeCost(G.kind)) { toast("Te faltan monedas"); vib(40); return; } SV.coins -= timeCost(G.kind); G.left += 15; G.total = Math.max(G.total, G.left); save(); $("#gCoins").textContent = SV.coins; renderTime(); beep(SND.coin); float("+15 s", "good"); }
function pause(on) {
  if (!G || G.over || (G.duel && G.duel.live)) return; G.paused = on;
  $("#game").classList.toggle("paused", on);
  if (on) modal(`<h2>⏸ Pausa</h2><p>El tiempo está detenido.</p><button class="big" id="resume">▶ Seguir</button><button class="link" id="quit">Salir al inicio</button>`, true);
  else closeModal();
}
function levelDone() {
  G.over = true; clearInterval(timerId);
  const st = G.lostLives === 0 && G.hints === 0 ? 3 : G.lostLives <= 1 ? 2 : 1;
  const bonus = lvPrize(G.lv);
  const K = KSk(G.kind);
  SV[K.st][G.lv] = Math.max(SV[K.st][G.lv] || 0, st); addPts(G.kind, bonus);
  const first = G.lv === SV[K.lv]; const before = titleOf(topLevel());
  if (first) SV[K.lv]++; save(); checkAch(); beep(SND.win); vib([80, 50, 120]);
  const after = titleOf(topLevel());
  modal(`<h2>🎉 ¡Nivel ${G.lv} superado!</h2><div class="stars big3">${stars(st)}</div><p class="big2">+${bonus} 🪙</p><p>${st === 3 ? "¡Perfecto! Sin perder vidas ni usar pistas." : st === 2 ? "Muy bien. Probá no perder vidas para las 3 estrellas." : "Superado. Intentá de nuevo para ganar más estrellas."}</p>${after !== before ? `<p class="rankup">Nuevo rango: <b>${after}</b></p>` : ""}<button class="big" id="nextLv">Nivel ${first ? G.lv + 1 : SV[K.lv]} ▶</button><button class="link" id="goHome">Inicio</button>`, true);
}
function levelFailed() {
  G.over = true; clearInterval(timerId); save(); beep(SND.lose);
  modal(`<h2>💔 Sin vidas</h2><p>Resolviste ${G.solved} de ${PER_LEVEL} palabras. ¡Podés volver a intentarlo con palabras nuevas!</p><button class="big" id="retry">Reintentar nivel ${G.lv}</button><button class="link" id="goHome">Inicio</button>`, true);
}
function toHome() { SR = null; if (LIVE) { Net.send({ t: "quit" }); liveReset(); } closeModal(); clearInterval(timerId); G = null; $("#game").hidden = true; $("#menu").hidden = true; $("#home").hidden = false; viewLevel = curLevel(); renderHome(); }

// ---------- Eventos ----------
$("#btnDuel").onclick = () => srLaunch(CUR, false);
$("#btnLive").onclick = () => srLaunch(CUR, true);
$("#btnMenu").onclick = showMenu;
document.addEventListener("click", (e) => { const c = e.target.closest("[data-game]"); if (c) openGame(c.dataset.game); });
$("#btnPlay").onclick = () => startLevel(viewLevel);
$("#btnDaily").onclick = claimDaily;
$("#btnAch").onclick = showAch; $("#btnShop").onclick = showShop; $("#btnStats").onclick = showStats;
$("#btnSound").onclick = () => { SV.sound = !SV.sound; save(); renderHome(); };
$("#btnHome").onclick = () => { if (!G) return; if (G.duel && G.duel.live) { ask("¿Abandonar el duelo?", toHome); return; } pause(true); };
$("#btnPause").onclick = () => pause(true);
$("#gPool").onclick = (e) => { const b = e.target.closest("[data-tile]"); if (b) place(+b.dataset.tile); };
$("#gSlots").onclick = (e) => { const b = e.target.closest("[data-slot]"); if (b) takeBack(+b.dataset.slot); };
$("#tShuffle").onclick = () => { if (G && !G.busy && !G.paused) { G.order = shuffle(G.tiles.map((t) => t.id)); renderTiles(); } };
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
  if (!SRGO) SR = null; SRGO = false;
  kind = kind || CUR; CUR = kind;
  closeModal(); history.replaceState(null, "", location.pathname);
  G = { kind, duel: { seed, from, pts: 0, kind, live: !!live }, lv: 0, queue: duelWords(seed, kind), solved: 0, n: 0, lives: 99, lostLives: 0, hints: 0, streak: 0, paused: false, over: false, busy: false };
  $("#home").hidden = true; $("#menu").hidden = true; $("#game").hidden = false; if (live) { $("#gRival").hidden = false; $("#gRival").textContent = "⚔ Conectando con el rival…"; } liveBar(); SCENES.apply(SCENES.world(7)); nextWord();
}
const duelLink = (seed, score, kind) => `${location.origin}${location.pathname}#d=${seed}.${score}.${kind || CUR}.${encodeURIComponent(SV.name)}`;
function shareDuel(seed, score, text) {
  const url = duelLink(seed, score, G && G.duel && G.duel.kind);
  const msg = `${text}\n${url}`;
  if (navigator.share) navigator.share({ title: "Anagrama", text: text + INV, url }).catch(() => {});
  else window.open("https://wa.me/?text=" + encodeURIComponent(msg + INV), "_blank");
}
function copyLink(seed, score) { const url = duelLink(seed, score, G && G.duel && G.duel.kind); (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(() => toast("Link copiado"), () => prompt("Copiá el link:", url)); }
function duelDone() {
  G.over = true; clearInterval(timerId);
  if (G.duel.live) return liveDone();
  if (SR && SR.rounds > 1) return srRoundEnd(G.duel.pts);
  const d = G.duel, me = d.pts; SV.duels++;
  let head, body = "";
  if (d.from) {
    const w = me > d.from.score ? 1 : me < d.from.score ? -1 : 0;
    if (w > 0) { SV.duelWins++; SV.coins += 50; duelRank(d.kind, me); }
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
  if (typeof srInvite === "function" && srInvite()) return;
  if (typeof tfInvite === "function" && tfInvite()) return;
  const r = /^#r=([A-Z0-9]{5})\.(ana|hid|adi|cri|qv|tf)$/.exec(location.hash);
  if (r && !G) {
    modal(`<h2>⚔ Duelo en vivo</h2><p>Te invitaron a jugar <b>${NAMES[r[2]]}</b> en tiempo real.</p><button class="big" id="liveEnter">Entrar al duelo</button><button class="link" data-close>Ahora no</button>`, true);
    $("#liveEnter").onclick = () => askName(() => liveJoin(r[1], r[2]));
    return;
  }
  const m = /^#d=(\d+)\.(\d+)\.(?:(ana|hid|adi|cri|qv)\.)?(.*)$/.exec(location.hash); if (!m) return;
  const seed = +m[1], score = +m[2], kind = m[3] || "ana"; let name = "Un amigo"; try { name = decodeURIComponent(m[4]).slice(0, 16) || name; } catch {}
  if (G) return;
  modal(`<h2>⚔ ¡${esc(name)} te desafió!</h2><p>Hizo <b>${score} puntos</b> en <b>${NAMES[kind]}</b>. Jugás lo mismo: si lo superás, ganás.</p><button class="big" id="accept">Aceptar el desafío</button><button class="link" data-close>Ahora no</button>`, true);
  $("#accept").onclick = () => askName(() => (DXG[kind] ? dxBegin(kind, seed, { name, score }, false) : startDuel(seed, { name, score }, kind)));
}
window.addEventListener("hashchange", checkInvite);

// ---------- Menú ----------
function showMenu() {
  SCENES.apply(null);
  $("#adHome").hidden = true; $("#adGame").hidden = true; adOn = false; $("#crHome").hidden = true; $("#crGame").hidden = true; $("#qvHome").hidden = true; $("#qvGame").hidden = true; $("#tfHome").hidden = true; $("#tfGame").hidden = true; if (typeof TFT !== "undefined") clearInterval(TFT);
  $("#home").hidden = true; $("#game").hidden = true; $("#menu").hidden = false;
  $("#mCoins").textContent = walletTotal(); applyTheme();
  const gr = globalRank(); const fmt = (n) => n.toLocaleString("es-AR");
  $("#mRank").textContent = gr.endless ? "Rango máximo ♾️" : `Rango ${gr.i + 1}/${GRANKS.length}`;
  $("#mBadge").textContent = gr.icon; $("#mRankName").textContent = gr.name; $("#mTotal").textContent = fmt(gr.total);
  const pct = gr.next ? Math.min(100, ((gr.total - gr.from) / (gr.next - gr.from)) * 100) : 100;
  $("#mBar").style.width = Math.max(4, pct) + "%";
  $("#mFrom").textContent = fmt(gr.from); $("#mTo").textContent = gr.next ? fmt(gr.next) + " pts" : "MÁX";
  $("#mNext").innerHTML = gr.next ? `Te faltan <b>${fmt(gr.next - gr.total)} pts</b> para ser <b>${gr.nextIcon} ${gr.nextName}</b>` : "¡Llegaste al rango más alto! 🎉";
  { const lo = lvClamp(gr.i - 4, 0, GRANKS.length - 9); $("#mSteps").innerHTML = GRANKS.map((r, j) => ({ r, j })).slice(lo, lo + 9).map(({ r, j }) => `<i class="${j < gr.i ? "done" : j === gr.i ? "cur" : ""}" title="${r[1]}">${j <= gr.i ? r[2] : "🔒"}</i>`).join(""); }
  $("#mPtsAna").textContent = ptsOf("ana") + " pts"; $("#mPtsHid").textContent = ptsOf("hid") + " pts"; $("#mPtsAdi").textContent = ptsOf("adi") + " pts"; $("#mPtsCri").textContent = ptsOf("cri") + " pts"; $("#mPtsTf").textContent = ptsOf("tf") + " pts"; if (typeof crMenu === "function") crMenu(); if (typeof qvMenu === "function") qvMenu(); document.querySelectorAll("#menu [data-game]").forEach((c) => { const k = c.dataset.game; if (k !== "cri" && k !== "qv") c.querySelectorAll("[data-diff]").forEach((x) => x.classList.toggle("on", x.dataset.diff === SV.dif[k])); });
  $("#mLvAna").textContent = `Nivel ${SV.level}`; $("#mLvHid").textContent = `Nivel ${SV.lvH}`; $("#mLvAdi").textContent = `Nivel ${SV.adLevel}`;
}
function openGame(k) { if (k === "adi") return showAdHome(); if (k === "cri") return crOpen(); if (k === "qv") return qvOpen(); if (k === "tf") return tfOpen(); CUR = k; viewLevel = curLevel(); $("#menu").hidden = true; $("#home").hidden = false; renderHome(); }

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
const afterOpp = () => { if (typeof TF !== "undefined" && TF && TF.on) return tfOppGone(); if (G && G.over) showLiveResult(); else if (typeof D !== "undefined" && D && D.over) dxResult(); };
function handlers(role) {
  return {
    onReady() { if (role === "host") showLobby(); },
    onPeer() { Net.send({ t: "hello", name: SV.name }); },
    onMsg(m) {
      if (!m || !LIVE) return;
      if (typeof tfMsg === "function" && tfMsg(m)) return;
      if (typeof srMsg === "function" && srMsg(m)) return;
      if (typeof dxMsg === "function" && dxMsg(m, role)) return;
      if (m.t === "hello") { LIVE.opp.name = String(m.name || "Rival").slice(0, 16); if (role === "host" && !LIVE.started) sendStart(); }
      else if (m.t === "start" && role === "guest") runStart(m.seed, m.kind, m.cats, m.rounds);
      else if (m.t === "prog") { LIVE.opp.n = +m.n || 0; LIVE.opp.pts = +m.pts || 0; liveBar(); }
      else if (m.t === "done") { LIVE.opp.pts = +m.pts || 0; LIVE.opp.n = PER_LEVEL; LIVE.opp.done = true; liveBar(); afterOpp(); }
      else if (m.t === "rematch" && role === "host") sendStart();
      else if (m.t === "quit") { LIVE.opp.left = true; toast("El rival abandonó el duelo"); liveBar(); afterOpp(); }
    },
    onClose() {
      if (!LIVE) return;
      if (!LIVE.started) return liveFail("Se cortó la conexión con tu rival.");
      LIVE.opp.left = true; toast("Se desconectó el rival"); liveBar(); afterOpp();
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
  $("#lvShare").onclick = () => { const text = `${SV.name} te invita a un duelo en vivo de ${NAMES[LIVE.kind]}. ¡Entrá!`; if (navigator.share) navigator.share({ title: "Anagrama", text: text + INV, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(text + "\n" + url + INV), "_blank"); };
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
function sendStart() { const seed = Math.floor(Math.random() * 1e9); Net.send({ t: "start", seed, kind: LIVE.kind, cats: LIVE.cats, rounds: LIVE.rounds }); runStart(seed, LIVE.kind, LIVE.cats, LIVE.rounds); }
function runStart(seed, kind, cats, rounds) {
  LIVE.started = true; LIVE.kind = kind; LIVE.opp.n = 0; LIVE.opp.pts = 0; LIVE.opp.done = false; LIVE.opp.left = false; clearTimeout(LIVE.to);
  clearInterval(timerId); G = null;
  if (kind === "tf") { LIVE.cats = (cats || []).filter((c) => TF_BY[c]); LIVE.rounds = [5, 10, 15, 20].includes(+rounds) ? +rounds : 5; return tfCountdown(seed, LIVE.cats, LIVE.rounds); }
  const s0 = srStart(seed, kind, rounds);
  if (DXG[kind]) return dxCountdown(s0, kind);
  let n = 3; modal(`<h2>⚔ ${oppName()}</h2><p>${NAMES[kind]} · 10 palabras</p><p class="big2" id="cd">${n}</p>`, true);
  const iv = setInterval(() => { n--; if (!LIVE) return clearInterval(iv); if (n <= 0) { clearInterval(iv); SRGO = !!SR; startDuel(s0, null, kind, true); } else $("#cd").textContent = n; }, 1000);
}
function liveDone() {
  const me = G.duel.pts; Net.send({ t: "done", pts: me });
  if (LIVE.opp.done || LIVE.opp.left) return showLiveResult();
  modal(`<h2>⏳ ¡Terminaste!</h2><p>Hiciste <b>${me} pts</b>. Esperando que ${oppName()} termine…</p><button class="link" id="goHome">Salir</button>`, true);
}
function showLiveResult() {
  if (!LIVE || !G || !G.duel || !G.duel.live) return;
  const me = G.duel.pts, o = LIVE.opp, w = me > o.pts ? 1 : me < o.pts ? -1 : 0;
  if (SR && SR.rounds > 1) return srRoundEnd(me, o.pts);
  if (!G.paid) { G.paid = true; SV.duels++; if (w > 0) { SV.duelWins++; SV.coins += 50; duelRank(G.duel.kind, me); } save(); checkAch(); beep(SND.win); }
  modal(`<h2>${w > 0 ? "🏆 ¡Ganaste!" : w < 0 ? "😮 Perdiste" : "🤝 ¡Empate!"}</h2><div class="vs"><div><small>Vos</small><b>${me}</b></div><span>vs</span><div><small>${oppName()}</small><b>${o.pts}</b></div></div>${o.left && !o.done ? "<p>Tu rival abandonó antes de terminar.</p>" : ""}${w > 0 ? '<p class="big2">+50 🪙</p>' : ""}${o.left ? "" : '<button class="big" id="lvRe">🔁 Revancha</button>'}<button class="link" id="goHome">Inicio</button>`, true);
  const re = $("#lvRe"); if (re) re.onclick = () => { if (LIVE.role === "host") sendStart(); else { Net.send({ t: "rematch" }); re.textContent = "Pedido enviado…"; re.disabled = true; } };
}

// ---------- Adivina ----------
// 10 pistas por palabra (de la más difícil a la más fácil). Cuantas menos pistas uses, más puntos.
// Hay 100 categorías y niveles sin fin: a medida que subís aparecen palabras más difíciles y se pide más puntaje para pasar.
let adOn = false;
const AD = { cat: "", words: [], i: 0, shown: 0, total: 0, results: [], clues: [], cur: null, busy: false, lv: 1 };
const AD_ROUND = 5;
const adTier = (L) => lvClamp(1 + Math.floor(Math.pow(lvP(L), 0.8) * 3.99), 1, 4);
const adPass = (L) => Math.min(430, Math.round(120 + 310 * Math.pow(lvP(L), 0.9)));
const adTitle = (L) => lvTitle(L, LV_TITLES_AD);
const adMax = () => (AD.duel ? 10 : Math.max(3, difOf("adi").clues - Math.floor(lvP(AD.lv) * 4)));
const adPts = (shown) => 110 - 10 * shown;
const plain = (s) => letters(s).replace(/[^A-ZÑ]/g, "");
// Corrector de ortografía: distancia de edición (con letras intercambiadas) para aceptar errores de tipeo.
function editDist(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[m][n];
}
function isSwap(a, b) { if (a.length !== b.length) return false; const x = []; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) x.push(i); return x.length === 2 && x[1] === x[0] + 1 && a[x[0]] === b[x[1]] && a[x[1]] === b[x[0]]; }
// ¿"g" es la palabra "a" con un error de tipeo? (palabras cortas: solo letras intercambiadas, para no confundir "gato" con "pato")
function spellOk(g, a) {
  if (g === a) return true; const n = a.length;
  if (n < 4) return false; if (n <= 5) return isSwap(g, a);
  return editDist(g, a) <= (n >= 11 ? 2 : 1);
}
const plainText = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
function showAdHome() {
  buildAdivina(); SCENES.apply(SCENES.mystery(SV.adLevel));
  $("#menu").hidden = true; $("#home").hidden = true; $("#game").hidden = true; $("#adGame").hidden = true; $("#adHome").hidden = false; adOn = true;
  difBar($("#adDiffs"), "adi"); $("#adCoins").textContent = SV.coins;
  $("#adLvl").innerHTML = `<div class="mid"><small>Nivel</small><b>${SV.adLevel}</b><small>${adTitle(SV.adLevel)} · ${ptsOf("adi")} pts</small><small class="world">🔍 ${SCENES.mysteryName(SV.adLevel)}</small><small>Para pasar: ${adPass(SV.adLevel)} pts de 500 en una ronda</small>${lvPath(SV.adLevel)}</div>`;
  renderAdCats();
}
// Palabras ya jugadas por categoría (no se repiten hasta completar todas las categorías).
const adDoneSet = (cat) => new Set((SV.adDone || {})[cat] || []);
function adMark(e) { const d = (SV.adDone ||= {}), l = (d[e.cat] ||= []); if (!l.includes(e.w)) l.push(e.w); }
function adLeftOf(cat) { buildAdivina(); return cat === "Mezcla" ? ADI.all.filter((e) => !adDoneSet(e.cat).has(e.w)) : ADI.cats.find((c) => c.name === cat).words.filter((e) => !adDoneSet(cat).has(e.w)); }
const adTotalOf = (cat) => (cat === "Mezcla" ? ADI.all : ADI.cats.find((c) => c.name === cat).words).length;
function renderAdCats() {
  const q = plainText($("#adSearch").value.trim());
  const cats = ADI.cats.filter((c) => !q || plainText(c.name).includes(q));
  const left = adLeftOf("Mezcla").length, allDone = ADI.cats.every((c) => adLeftOf(c.name).length === 0);
  const lap = allDone ? `<button class="mix lap" data-lap="1"><span class="ico">🏁</span>¡Completaste todas las categorías!<small>Tocá para empezar una nueva vuelta (se reinician las palabras)</small></button>` : "";
  const mix = !q || "mezcla".includes(q) ? `<button class="mix ${left ? "" : "full"}" data-cat="Mezcla"><span class="ico">🎲</span>Mezcla de todo<small>${SV.adBest.Mezcla ? "Récord: " + SV.adBest.Mezcla + " · " : ""}${left ? left + " palabras sin jugar" : "✔ Completada"}</small></button>` : "";
  $("#adCats").innerHTML = lap + mix + cats.map((c) => { const t = c.words.length, l = adLeftOf(c.name).length, full = l === 0; return `<button class="${full ? "full" : ""}" data-cat="${esc(c.name)}"><span class="ico">${c.icon}</span>${esc(c.name)}<small>${full ? "✔ Completada" : t - l + "/" + t + (SV.adBest[c.name] ? " · Récord: " + SV.adBest[c.name] : "")}</small></button>`; }).join("") || '<p class="tag">No hay categorías con ese nombre.</p>';
}
$("#adSearch").addEventListener("input", renderAdCats);
$("#adCats").addEventListener("click", (e) => {
  if (e.target.closest("[data-lap]")) { ask("¿Empezar una nueva vuelta? Se reinician todas las categorías.", () => { SV.adDone = {}; SV.adLap = (SV.adLap || 0) + 1; save(); renderAdCats(); toast("🔄 ¡Nueva vuelta!"); }, "Sí, empezar"); return; }
  const b = e.target.closest("[data-cat]"); if (b) adStart(b.dataset.cat);
});
$("#adBack").onclick = showMenu;
function adBuildClues(e) {
  const A = e.c, T = [...e.w.toUpperCase()], L = T.length;
  const vow = T.filter((c) => "AEIOUÁÉÍÓÚÜ".includes(c)).length;
  const mid = L % 2 ? `La letra del medio es ${T[(L - 1) / 2]}.` : `Las dos letras del medio son ${T[L / 2 - 1]} y ${T[L / 2]}.`;
  const pattern = T.map((c, i) => (i % 2 === 0 ? c : "_")).join(" ");
  const auto = [`Tiene ${L} letras.`, `Empieza con la letra ${T[0]}.`, `Termina con la letra ${T[L - 1]}.`, `Tiene ${vow} vocales y ${L - vow} consonantes.`, mid, `Así se ve con algunas letras: ${pattern}`];
  return [[A[0]], [A[1]], [auto[0], 1], [A[2]], [auto[1], 1], [A[3]], [auto[2], 1], [auto[3], 1], [auto[4], 1], [auto[5], 1]];
}
function adPick(pool, L) {
  const T = Math.max(1, Math.min(4, adTier(L) + difOf("adi").tier)), seen = new Set(SV.adSeen), lastSeen = new Map(SV.adSeen.map((w, i) => [w, i]));
  return shuffle(pool).map((e) => ({ e, s: Math.abs(e.t - T) + Math.random() * 0.9 + (seen.has(e.w) ? 8 + 4 * (lastSeen.get(e.w) / Math.max(1, SV.adSeen.length)) : 0) })).sort((a, b) => a.s - b.s).slice(0, AD_ROUND).map((x) => x.e);
}
function adStart(cat) {
  buildAdivina(); AD.duel = false; AD.cat = cat; AD.lv = SV.adLevel; AD.i = 0; AD.total = 0; AD.results = [];
  const left = adLeftOf(cat);
  if (!left.length) { closeModal(); toast("✔ Ya completaste «" + cat + "». ¡Elegí otra categoría!"); return showAdHome(); }
  AD.words = adPick(left, AD.lv);
  if (AD.words.length < AD_ROUND) { // quedan pocas: se completa la ronda con las menos recientes de la misma categoría
    const have = new Set(AD.words.map((e) => e.w)), all = cat === "Mezcla" ? ADI.all : ADI.cats.find((c) => c.name === cat).words;
    const order = new Map(SV.adSeen.map((w, i) => [w, i]));
    AD.words.push(...all.filter((e) => !have.has(e.w)).sort((a, b) => (order.get(a.w) ?? -1) - (order.get(b.w) ?? -1)).slice(0, AD_ROUND - AD.words.length));
  }
  SV.adSeen.push(...AD.words.map((e) => e.w)); if (SV.adSeen.length > 1100) SV.adSeen.splice(0, SV.adSeen.length - 1100); save();
  $("#adHome").hidden = true; $("#adGame").hidden = false; adOn = true;
  $("#adCatName").textContent = cat; $("#adTotal").textContent = SV.coins;
  adNext();
}
function adNext() {
  const e = AD.words[AD.i]; AD.cur = e; AD.clues = adBuildClues(e); AD.shown = 1; AD.busy = false;
  $("#adIn").value = ""; adRender(true);
}
function adRender(fresh) {
  $("#adDots").innerHTML = Array.from({ length: (AD.words || []).length || AD_ROUND }, (_, i) => `<i class="${i < AD.i ? "done" : i === AD.i ? "cur" : ""}"></i>`).join("");
  adGoalUI();
  $("#adWorth").textContent = `Pista ${AD.shown}/${adMax()} · Vale ${adPts(AD.shown)} pts`;
  $("#adClues").innerHTML = AD.clues.slice(0, AD.shown).map((c, i) => `<li class="${c[1] ? "auto" : ""} ${i === AD.shown - 1 ? "new" : ""}"><b>${i + 1}</b><span>${esc(c[0])}</span></li>`).join("");
  const ul = $("#adClues"); ul.scrollTop = ul.scrollHeight;
  $("#adMore").disabled = AD.shown >= adMax();
  // El teclado ya no se abre solo: aparece cuando tocás el campo para escribir.
}
function adGoalUI() { $("#adGoal").textContent = AD.duel ? `⚔ Duelo · Llevás ${AD.total} pts` : `Nivel ${AD.lv} · Meta ${adPass(AD.lv)} pts · Llevás ${AD.total}`; }
function adFloat(t, cls) { const f = $("#adFloat"); f.className = "float " + (cls || ""); f.textContent = t; void f.offsetWidth; f.classList.add("go"); }
function adMore() { if (AD.busy || AD.shown >= adMax()) return; AD.shown++; adRender(); beep(SND.coin); }
function adAnswers() { const w = AD.cur.w; return [plain(w), ...(ALIAS[w] || []).map(plain)]; }
function adGuess() {
  if (AD.busy) return;
  const g = plain($("#adIn").value); if (!g) return;
  const ans = adAnswers();
  if (ans.includes(g)) return adWin();
  if (ans.some((a) => spellOk(g, a))) { AD.fixed = true; return adWin(); }
  const said = AD.said; AD.said = false;
  if (said && !AD.duel && typeof Apr !== "undefined" && Apr.add($("#adIn").value)) toast("✨ «" + Apr.norm($("#adIn").value) + "» es nueva: la sumamos al juego");
  beep(SND.bad); vib([60, 40, 60]); $("#adIn").classList.add("shake"); setTimeout(() => $("#adIn").classList.remove("shake"), 400);
  if (AD.shown >= adMax()) return adLose();
  adFloat("No es. ¡Otra pista!", "bad"); $("#adIn").value = ""; AD.shown++; adRender();
}
function adFinish(pts, msg, good) {
  AD.busy = true; AD.results.push({ w: AD.cur.w, pts, shown: AD.shown }); if (!AD.duel) adMark(AD.cur); AD.total += pts; if (!AD.duel) addPts("adi", Math.round(pts * difOf("adi").mult));
  if (AD.duel) dxProg(AD.i + 1, AD.total);
  if (pts && !AD.duel) { SV.solved++; if (AD.shown <= 3) SV.adQuick++; if (AD.shown === 1) SV.adAces++; }
  save(); checkAch(); $("#adTotal").textContent = SV.coins;
  adFloat(msg, good ? "good" : "bad"); beep(good ? SND.ok : SND.lose);
  $("#adClues").insertAdjacentHTML("beforeend", `<li class="new"><b>${good ? "✔" : "✖"}</b><span class="reveal-msg">${esc(AD.cur.w.toUpperCase())}</span></li>`);
  adGoalUI();
  const ul = $("#adClues"); ul.scrollTop = ul.scrollHeight;
  setTimeout(() => { AD.i++; AD.i >= (AD.words || []).length ? adEnd() : adNext(); }, 1600);
}
function adWin() { const p = adPts(AD.shown); const fx = AD.fixed; AD.fixed = false; adFinish(p, `+${p} 🪙${fx ? " · se escribe " + AD.cur.w : ""}`, true); }
function adLose() { adFinish(0, "Era esa palabra…", false); }
$("#adGo").onclick = adGuess;
$("#adIn").addEventListener("keydown", (e) => { if (e.key === "Enter") adGuess(); });
$("#adMore").onclick = adMore;
$("#adSkip").onclick = () => { if (!AD.busy) adLose(); };
$("#adQuit").onclick = () => ask("¿Salir de la ronda?", () => { if (AD.duel) dxAbort(); showAdHome(); });
function adEnd() {
  if (AD.duel) return dxFinish(AD.total);
  const rec = !SV.adBest[AD.cat] || AD.total > SV.adBest[AD.cat]; if (rec) SV.adBest[AD.cat] = AD.total;
  const bonus = AD.results.every((r) => r.pts > 0) ? 50 : 0; if (bonus) addPts("adi", bonus);
  const need = adPass(AD.lv), passed = AD.total >= need;
  let lvBonus = 0, rank = "";
  if (passed && AD.lv === SV.adLevel) { const before = adTitle(SV.adLevel); SV.adLevel++; lvBonus = lvPrize(AD.lv); addPts("adi", lvBonus); if (adTitle(SV.adLevel) !== before) rank = adTitle(SV.adLevel); }
  save(); checkAch(); beep(passed ? SND.win : SND.lose); vib(passed ? [80, 50, 120] : 120);
  modal(`<h2>${passed ? "🎉 ¡Nivel " + AD.lv + " superado!" : "🕵️ Ronda terminada"}</h2><p class="big2">${AD.total} pts</p><p>${passed ? (lvBonus ? "+" + lvBonus + " 🪙 por pasar de nivel" : "Ya habías pasado este nivel") : `Te faltaron ${need - AD.total} pts para pasar de nivel (meta: ${need}).`}</p>${rank ? `<p class="rankup">Nuevo rango: <b>${rank}</b></p>` : ""}${rec ? '<p class="rankup">¡Nuevo récord de la categoría!</p>' : ""}<div class="list">${AD.results.map((r) => `<div class="li ${r.pts ? "got" : ""}"><span>${r.pts ? "✅" : "❌"}</span><div><b>${esc(r.w)}</b><small>${r.pts ? r.shown + (r.shown === 1 ? " pista" : " pistas") : "No la adivinaste"}</small></div><em>${r.pts}</em></div>`).join("")}</div>${bonus ? '<p class="big2">+50 🪙 por acertar todas</p>' : ""}<button class="big" id="adAgain">${passed && lvBonus ? "Siguiente nivel ▶" : "Jugar otra vez"}</button><button class="link" id="adCatsBtn">Elegir categoría</button>`, true);
  $("#adAgain").onclick = () => { closeModal(); adStart(AD.cat); };
  $("#adCatsBtn").onclick = () => { closeModal(); showAdHome(); };
}

viewLevel = SV.level; showMenu(); checkInvite();

// Detalle de rangos
document.addEventListener("click", (e) => {
  if (!e.target.closest("#gRank")) return;
  const gr = globalRank();
  modal(`<h2>Rangos mentales</h2><p>Sumá puntos en cualquiera de los juegos para subir.</p><div class="list">${GRANKS.map((r, j) => `<div class="li ${j === gr.i ? "mine" : ""}"><span>${j <= gr.i ? r[2] : "🔒"}</span><div><b>${r[1]}</b><small>${r[0].toLocaleString("es-AR")} pts</small></div>${j === gr.i ? "<em>Vos</em>" : j < gr.i ? "<em>✔</em>" : ""}</div>`).join("")}</div><button class="big" data-close>Cerrar</button>`);
});

// ---------- Ayuda: cómo se juega ----------
const HELP = {
  ana: ["🔤 Anagrama", ["Ordená las letras mezcladas y armá la palabra antes de que se acabe el tiempo.", "Tocá las letras en orden. Si te equivocás o se acaba el tiempo perdés una vida ❤.", "10 palabras = subís de nivel.", "Ayudas: 🔀 mezclar, 💡 pista (revela una letra), ⏱ tiempo extra."]],
  hid: ["🔍 Palabras escondidas", ["Arriba ves una palabra (por ejemplo ELIMINA) y adentro hay otra escondida (LIMA) que se arma con algunas de sus letras, en cualquier orden. La frase-pista te ayuda a descubrirla.", "Armala solo con las letras justas. En los últimos 10 s se iluminan las letras que forman la palabra escondida.", "3 vidas ❤ y 10 palabras por nivel."]],
  adi: ["🕵️ Adivina", ["Elegí una categoría y descubrí la palabra oculta.", "Arrancás con 1 pista; cada error o \"otra pista\" abre una más.", "Cuantas menos pistas uses, más puntos ganás (hasta 100 por palabra).", "Hay corrector de ortografía: si te equivocás en una letra, igual te la aceptamos.", "Juntá los puntos de la meta del nivel para pasar."]],
  cri: ["🔐 Frases encriptadas", ["Cada letra se esconde detrás de un número, un objeto o un color, y se repite en toda la frase.", "Tocá un casillero y elegí la letra: se completa en todos los que tienen el mismo símbolo.", "En las citas célebres también tenés que completar al autor.", "💡 regala una letra (−15 pts) y ✔ Revisar marca los errores (−10 pts cada vez). Mirá cuánto vale la frase."]],
  tf: ["📝 Tutti Frutti", ["Es un juego de duelos: elegí de 3 a 8 categorías (nombres de personas, en el mercado compro, animales…) y desafiá a un amigo, en vivo o por link.", "Sale una letra al azar: escribí una palabra de cada categoría que empiece con esa letra. Tenés 120 s.", "Antes de empezar elegís 5, 10, 15 o 20 partidas: cada una tiene su letra y los puntos se acumulan, gana quien más suma al final. Tocá ¡BASTA! cuando termines: se guarda tu tiempo. Si tu rival termina primero, te quedan 20 s.", "Corrección: palabra bien escrita 10 pts · repetida con el rival 5 · mal escrita 5 (te mostramos cómo se escribe) · no existe 0.", "Quien termina todo en menos tiempo suma 10 pts extra. El ganador del duelo se lleva 10 🪙 por partida."]],
  qv: ["🖼️ ¿Qué ves?", ["Mirá las 2 o 3 imágenes: tienen algo en común. Descubrí la palabra o frase (puede tener 1, 2 o 3 palabras) y escribila.", "Arriba ves el rubro y cuántas palabras son; los huecos te muestran cuántas letras tiene cada una.", "10 enigmas por nivel, 3 vidas ❤ y tiempo límite. Cuanto más subís o más difícil elegís, menos letras de ayuda te damos."]],
  all: ["❓ Cómo se juega", ["Elegí un juego y una dificultad: cuanto más difícil, más puntos ganás.", "Cada juego tiene sus propios niveles, puntos y monedas.", "La suma de tus puntos sube tu rango global, de Novato a Leyenda.", "Tocá el ❓ dentro de cada juego para ver sus reglas."]]
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-help]"); if (!b) return;
  let k = b.dataset.help; if (k === "cur") k = CUR;
  const h0 = HELP[k] || HELP.all, h = ["ana", "hid", "adi", "cri", "qv"].includes(k) ? [h0[0], h0[1].concat("⚔ Duelos: elegí si la partida dura 1, 3, 5 o 10 duelos. Los puntos se acumulan y gana quien más suma al final. Se juega en vivo o por link.")] : h0; const paused = typeof G !== "undefined" && G && !G.paused && !$("#game").hidden;
  if (paused) G.paused = true;
  modal(`<div class="helpbox"><h2>${h[0]}</h2>${h[1].map((t) => `<p class="hl">• ${t}</p>`).join("")}${k !== "all" ? `<p class="hg">Dificultad</p><p class="hl">Fácil, Medio, Difícil o Experto: cuanto más difícil, menos ayuda y más puntos.</p>` : ""}<button class="big" id="helpOk">¡Entendido!</button></div>`, true);
  $("#helpOk").onclick = () => { closeModal(); if (paused && G) G.paused = false; };
});
