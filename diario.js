"use strict";
// Desafío diario: una palabra escondida por día (la misma para todos), con calendario, racha y aviso diario opcional.
const DLY_START = "2026-10-26"; // primer día del calendario
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const dKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dAdd = (key, n) => { const [y, m, d] = key.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
const dLabel = (key) => { const [y, m, d] = key.split("-").map(Number); return `${d} de ${MESES[m - 1]}`; };
const dlyOf = (k) => (SV.dly && SV.dly[k]) || {};
const dlyCount = () => Object.values(SV.dly || {}).filter((x) => x && x.ok).length;
function dlyStreak() { // días seguidos resueltos, terminando hoy (o ayer si hoy todavía no se resolvió)
  let k = todayKey(); if (!dlyOf(k).ok) k = dAdd(k, -1); let n = 0;
  while (dlyOf(k).ok) { n++; k = dAdd(k, -1); }
  return n;
}
function dlyWord(key) { // misma palabra y mismas letras para todos los jugadores ese día
  let seed = 7; for (const c of key) seed = (Math.imul(seed, 31) + c.charCodeAt(0)) | 0;
  const pool = []; for (let n = 5; n <= 7; n++) for (const x of POOL[n] || []) if (x.c !== "✨ Aprendidas") pool.push(x);
  pool.sort((a, b) => (a.L < b.L ? -1 : a.L > b.L ? 1 : 0));
  const old = R, oldF = FIXDIF; R = mulberry(seed); FIXDIF = true;
  const w = pool[rnd(pool.length)], scr = makeScr(w.L, "hid", 5); R = old; FIXDIF = oldF;
  return { ...w, scr };
}
let dlyMonth = null; // {y, m}
function dlyOpen() {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = true)); adOn = false; $("#dlyHome").hidden = false;
  const [y, m] = todayKey().split("-").map(Number); dlyMonth = { y, m: m - 1 }; SCENES.apply(null); applyTheme(); dlyRender();
}
function dlyRender() {
  const t = todayKey(), st = dlyStreak(), done = dlyOf(t).ok;
  $("#dlyCoins").textContent = SV.coins;
  $("#dlyStreak").innerHTML = `<b>🔥 ${st}</b><small>${st === 1 ? "día seguido" : "días seguidos"}</small>`;
  $("#dlyTotal").innerHTML = `<b>✅ ${dlyCount()}</b><small>${dlyCount() === 1 ? "palabra resuelta" : "palabras resueltas"}</small>`;
  $("#dlyPlay").innerHTML = done ? `✅ ¡Hoy ya la resolviste!<small>Volvé mañana por la próxima</small>` : `▶ Jugar la palabra de hoy<small>${dLabel(t)} · ¡descubrí la palabra escondida!</small>`;
  $("#dlyPlay").classList.toggle("done", !!done);
  const { y, m } = dlyMonth; $("#dlyMonth").textContent = `${MESES[m]} ${y}`;
  const first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); let h = "";
  for (let i = 0; i < first; i++) h += `<i class="e"></i>`;
  for (let d = 1; d <= days; d++) {
    const k = dKey(y, m, d), r = dlyOf(k), fut = k > t, old = k < DLY_START;
    const cls = ["d", r.ok ? "ok" : r.f ? "fail" : "", k === t ? "today" : "", fut ? "fut" : "", old ? "old" : ""].join(" ");
    h += `<button class="${cls}" data-d="${k}" ${old ? "disabled" : ""}><span>${d}</span><b>${r.ok ? "✔" : r.f ? "✖" : fut ? "🔒" : k === t ? "⭐" : "·"}</b></button>`;
  }
  $("#dlyGrid").innerHTML = h;
  const ym = (y, m) => y * 12 + m, [ty, tm] = t.split("-").map(Number), [sy, sm] = DLY_START.split("-").map(Number);
  $("#dlyPrev").disabled = ym(y, m) <= ym(sy, sm - 1); $("#dlyNext").disabled = ym(y, m) >= ym(ty, tm - 1);
  dlyNotifUI();
}
$("#dlyBack").onclick = showMenu;
$("#dlyPrev").onclick = () => { dlyMonth.m--; if (dlyMonth.m < 0) { dlyMonth.m = 11; dlyMonth.y--; } dlyRender(); };
$("#dlyNext").onclick = () => { dlyMonth.m++; if (dlyMonth.m > 11) { dlyMonth.m = 0; dlyMonth.y++; } dlyRender(); };
$("#dlyPlay").onclick = () => { if (!dlyOf(todayKey()).ok) dlyStart(todayKey()); else toast("¡Ya resolviste la de hoy! Volvé mañana"); };
$("#dlyGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-d]"); if (!b) return; const k = b.dataset.d, r = dlyOf(k);
  if (k > todayKey()) return toast("Esa palabra todavía no está disponible");
  if (r.ok) return modal(`<h2>✅ ${dLabel(k)}</h2><p>La palabra era <b>${esc(dlyWord(k).w.toUpperCase())}</b>.</p><button class="big" data-close>Cerrar</button>`);
  dlyStart(k);
});
function dlyStart(key) {
  closeModal(); document.querySelectorAll(".screen").forEach((s) => (s.hidden = true)); adOn = false; CUR = "hid";
  $("#game").classList.remove("paused");
  G = { kind: "hid", daily: key, lv: 5, queue: [dlyWord(key)], solved: 0, lives: 1, lostLives: 0, hints: 0, streak: 0, paused: false, over: false, busy: false };
  $("#game").hidden = false; SCENES.apply(SCENES.world(7)); nextWord();
}
// Fin del intento (lo llaman levelDone / levelFailed del juego)
function dlyEnd(ok) {
  const key = G.daily, today = key === todayKey(), was = dlyOf(key); G.over = true; clearInterval(timerId); let r = 0;
  const word = (G.w && G.w.w ? G.w.w : G.target).toUpperCase();
  if (ok) {
    if (!was.ok) { SV.dly[key] = { ...was, ok: 1, t: Date.now(), h: G.hints }; r = today ? 20 + Math.min(dlyStreak(), 10) * 3 : 8; SV.coins += r; }
    beep(SND.win); vib([80, 50, 120]);
  } else { SV.dly[key] = { ...was, f: (was.f || 0) + 1 }; beep(SND.lose); }
  save(); checkAch(); dlyMark();
  const st = dlyStreak(), share = `🧩 Palabra del día ${dLabel(key)} de Juegos mentales: ${ok ? "¡la resolví!" : "no pude 😅"} ¿Podés vos?`;
  modal(ok ? `<h2>🧩 ¡Palabra del día resuelta!</h2><p class="big2">${r ? "+" + r + " 🪙" : "¡Bien!"}</p><p>Era <b>${esc(word)}</b>.</p><p>🔥 Racha: <b>${st}</b> ${st === 1 ? "día" : "días"}</p><button class="big" id="dlyShare">📨 Compartir</button><button class="mini" id="dlyCal">📅 Calendario</button>`
    : `<h2>😅 No salió</h2><p>La palabra era <b>${esc(word)}</b>.</p><p>Podés volver a intentarlo cuando quieras.</p><button class="big" id="dlyRetry">Reintentar</button><button class="mini" id="dlyCal">📅 Calendario</button>`, true);
  const sh = $("#dlyShare"); if (sh) sh.onclick = () => { const url = location.origin + location.pathname; if (navigator.share) navigator.share({ title: "Juegos mentales", text: share + INV, url }).catch(() => {}); else window.open("https://wa.me/?text=" + encodeURIComponent(share + "\n" + url + INV), "_blank"); };
  const rt = $("#dlyRetry"); if (rt) rt.onclick = () => dlyStart(key);
  $("#dlyCal").onclick = () => { closeModal(); G = null; dlyOpen(); };
}
// ---- Menú principal: tarjeta de la palabra del día
function dlyMenu() {
  const t = todayKey(), done = dlyOf(t).ok, st = dlyStreak();
  if (!$("#dlySub")) return;
  $("#dlySub").textContent = done ? `¡Resuelta! Racha de ${st} ${st === 1 ? "día" : "días"} 🔥` : st ? `¡Todavía no la resolviste! Racha: ${st} 🔥` : "Un desafío nuevo cada día";
  $("#dlyCard").classList.toggle("done", !!done); $("#dlyBadge").textContent = done ? "✅" : "🎯";
}
// ---- Avisos diarios (opcional): usan el service worker; el aviso solo se manda si todavía no resolviste la palabra de hoy
function dlyMark() { try { caches.open("dly-state").then((c) => c.put("hoy", new Response(dlyOf(todayKey()).ok ? todayKey() : ""))); } catch {} }
const dlyCan = () => "Notification" in window && "serviceWorker" in navigator;
function dlyNotifUI() {
  const b = $("#dlyNotif"), on = SV.dlyNotif && dlyCan() && Notification.permission === "granted";
  b.innerHTML = on ? `🔔 Aviso diario activado<small>Tocá para desactivarlo · <u id="dlyTest">probar aviso</u></small>` : `🔔 Avisame cada día<small>Te recordamos la palabra del día</small>`;
  b.classList.toggle("on", !!on);
}
$("#dlyNotif").onclick = async (e) => {
  if (e.target.id === "dlyTest") return dlyTest();
  if (!dlyCan()) return toast("Tu navegador no permite avisos. Probá con Chrome (Android) o instalá la app.");
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (SV.dlyNotif && Notification.permission === "granted") { SV.dlyNotif = false; save(); try { if (reg && reg.periodicSync) await reg.periodicSync.unregister("palabra-del-dia"); } catch {} dlyNotifUI(); return toast("Aviso diario desactivado"); }
  const p = await Notification.requestPermission(); if (p !== "granted") return toast("Permití las notificaciones para recibir el aviso");
  SV.dlyNotif = true; save(); dlyMark(); let periodic = false;
  try { if (reg && reg.periodicSync) { await reg.periodicSync.register("palabra-del-dia", { minInterval: 12 * 3600e3 }); periodic = true; } } catch {}
  dlyNotifUI(); toast(periodic ? "🔔 ¡Listo! Te vamos a avisar una vez por día" : "🔔 Activado. En este dispositivo el aviso puede no llegar si no tenés la app instalada");
};
async function dlyTest() {
  const reg = await navigator.serviceWorker.ready.catch(() => null); if (!reg || Notification.permission !== "granted") return toast("Primero activá el aviso");
  reg.showNotification("🧩 Palabra del día", { body: "¿Podés descubrir la palabra escondida de hoy?", icon: "icons/icon-192.png", tag: "palabra-del-dia", data: { url: "./#dia" } });
}
// El aviso abre el calendario
if ("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", (e) => { if (e.data && e.data.go === "dia" && !G) dlyOpen(); });
window.addEventListener("load", () => { dlyMenu(); dlyMark(); if (location.hash === "#dia") { history.replaceState(null, "", location.pathname); dlyOpen(); } });
