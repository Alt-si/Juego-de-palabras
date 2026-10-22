"use strict";
// ¿Cuántas ves?: aparece una palabra y hay que armar todas las palabras que se puedan con sus letras (escribiendo, tocando letras o con el micrófono).
let CVD = null, CV = null;
function cvLoad() {
  return new Promise((ok, no) => {
    const done = () => { if (!CVD) { CVD = CV_RAW.trim().split("\n").map((l) => { const [w, a] = l.split("|"); return { w, L: [...w].map(crLetter).join(""), A: new Set((a || "").split(" ").filter(Boolean)) }; }); } ok(CVD); };
    if (typeof CV_RAW !== "undefined") return done();
    const s = document.createElement("script"); s.src = "cuantas-data.js"; s.onload = done; s.onerror = () => { toast("No pude cargar las palabras. Revisá tu conexión."); no(); }; document.head.appendChild(s);
  });
}
const cvNorm = (s) => [...String(s)].map(crLetter).join("").toLowerCase().replace(/ñ/g, "ñ");
const cvKey = (s) => [...String(s).toLowerCase()].map((c) => (c === "ñ" ? "ñ" : c.normalize("NFD").replace(/[̀-ͯ]/g, ""))).join("").replace(/[^a-zñ]/g, "");
const cvGoal = (lv, it) => { const d = { f: 0.8, m: 1, d: 1.25, e: 1.6 }[(SV.dif && SV.dif.cv) || "m"]; return Math.max(3, Math.min(Math.round(4 + 26 * Math.pow(lvP(lv), 0.7) * d), Math.floor(it.A.size * 0.5))); };
const cvTime = (lv, goal) => Math.round((55 + goal * 2.2) * (CV && CV.duel ? 1 : difOf("cv").time));
const cvPts = (w, streak) => 2 * w.length + Math.min(streak, 10);
let cvSel = [], cvClr = 0; // cvClr: temporizador que limpia la palabra recién armada // índices de fichas elegidas
function cvPick(lv) {
  const want = Math.max(6, Math.min(10, 6 + Math.floor(Math.pow(lvP(lv), 0.8) * 4.99) + difOf("cv").tier));
  let un = CVD.filter((p) => !SV.cvSeen.includes(p.w)); if (un.length < 12) { SV.cvSeen = []; un = CVD.slice(); }
  return crShuffle(un).map((p) => ({ p, s: Math.abs(p.L.length - want) + Math.random() * 1.2 })).sort((a, b) => a.s - b.s).slice(0, 3).map((x) => x.p);
}
function cvMenu() {
  document.querySelectorAll('#menu [data-game="cv"] [data-diff]').forEach((x) => x.classList.toggle("on", x.dataset.diff === ((SV.dif && SV.dif.cv) || "m")));
  if ($("#mLvCv")) $("#mLvCv").textContent = `Nivel ${SV.cvLv}`; if ($("#mPtsCv")) $("#mPtsCv").textContent = ptsOf("cv") + " pts";
}
window.addEventListener("load", cvMenu);
function cvOpen() { $("#menu").hidden = true; $("#cvGame").hidden = true; $("#cvHome").hidden = false; cvHome(); }
function cvHome() {
  if (!SV.dif.cv) SV.dif.cv = "m";
  const lv = SV.cvLv; SCENES.apply(SCENES.world(lv)); applyTheme(); difBar($("#cvDiffs"), "cv");
  $("#cvCoins").textContent = SV.coins; $("#cvRank").textContent = titleOf(lv) + " · " + ptsOf("cv") + " pts";
  $("#cvLvl").innerHTML = `<div class="mid"><small>Nivel</small><b>${lv}</b><div class="stars">${stars(SV.starsCV[lv - 1] || 0)}</div><small class="world">🌍 ${SCENES.worldName(lv)}</small><small>3 palabras por nivel · llegá a la meta de cada una</small>${lvPath(lv)}</div>`;
}
$("#cvBack").onclick = showMenu;
$("#cvPlay").onclick = () => cvStart();
function cvStart() {
  cvLoad().then(() => {
    const lv = SV.cvLv;
    CV = { lv, list: cvPick(lv), i: 0, lives: maxLives("cv"), lost: 0, passed: 0, strong: 0, over: false, duel: false, pts: 0, found: [], streak: 0, busy: false };
    $("#cvHome").hidden = true; $("#cvGame").hidden = false; SCENES.apply(SCENES.world(lv)); cvRound();
  }, () => {});
}
function cvLives() { if (CV.duel) { $("#cvLives").innerHTML = `<span class="on" style="font-size:16px;color:var(--ac)">⚔ ${CV.pts} pts</span>`; return; } $("#cvLives").innerHTML = Array.from({ length: maxLives("cv") }, (_, i) => `<span class="${i < CV.lives ? "on" : ""}">❤</span>`).join(""); }
function cvRound() {
  clearInterval(QT); closeModal();
  const it = CV.list[CV.i]; CV.it = it; CV.found = []; CV.streak = 0; CV.busy = false; CV.ended = false;
  CV.goal = CV.duel ? 0 : cvGoal(CV.lv, it); CV.total = CV.duel ? 75 : cvTime(CV.lv, CV.goal); CV.left = CV.total; CV.rp = 0;
  CV.tiles = crShuffle([...it.L]); if (CV.tiles.join("") === it.L) CV.tiles = crShuffle(CV.tiles); cvSel = [];
  $("#cvTotal").textContent = SV.coins; cvLives();
  $("#cvDots").innerHTML = CV.list.map((_, i) => `<i class="${i < CV.i ? "done" : i === CV.i ? "cur" : ""}"></i>`).join("");
  $("#cvWord").textContent = it.w.toUpperCase(); cvUI(); cvTiles(); cvTimeUI();
  QT = setInterval(() => { if (CV.busy || !$("#modal").hidden) return; CV.left -= 0.1; cvTimeUI(); if (CV.left <= 0) cvEnd(true); }, 100);
}
function cvTimeUI() { const p = Math.max(0, CV.left / CV.total); $("#cvBar").style.width = p * 100 + "%"; $("#cvBar").className = p < 0.25 ? "low" : p < 0.5 ? "mid" : ""; $("#cvTime").textContent = Math.ceil(Math.max(0, CV.left)) + " s"; }
function cvUI() {
  const n = CV.found.length; $("#cvCount").innerHTML = CV.duel ? `Armaste <b>${n}</b> ${n === 1 ? "palabra" : "palabras"}` : `Armaste <b>${n}</b> · meta <b>${CV.goal}</b> ${n >= CV.goal ? "✅" : ""}`;
  $("#cvFound").innerHTML = CV.found.map((w) => `<span>${esc(w)}</span>`).join("") || `<em>Todavía no armaste ninguna…</em>`;
  $("#cvFound").scrollTop = 1e6; $("#cvCur").textContent = cvSel.map((i) => CV.tiles[i]).join("") || "·";
}
function cvTiles() { $("#cvTiles").innerHTML = CV.tiles.map((c, i) => `<button class="tile ${cvSel.includes(i) ? "gone" : ""}" data-i="${i}">${c}</button>`).join(""); }
$("#cvTiles").addEventListener("click", (e) => { const b = e.target.closest("[data-i]"); if (!b || !CV || CV.busy) return; const i = +b.dataset.i; if (!cvSel.includes(i)) { cvSel.push(i); beep(SND.coin); cvTiles(); cvUI(); cvAuto(); } });
document.addEventListener("keydown", (e) => {
  if ($("#cvGame").hidden || !$("#modal").hidden || e.ctrlKey || e.metaKey || e.altKey || !CV || CV.busy) return;
  if (e.key === "Enter") return cvSubmit(); if (e.key === "Backspace") return cvDel();
  const L = crLetter(e.key.length === 1 ? e.key : ""); if (!L) return;
  const i = CV.tiles.findIndex((c, k) => c === L && !cvSel.includes(k)); if (i >= 0) { cvSel.push(i); cvTiles(); cvUI(); cvAuto(); }
});
function cvDel() { clearTimeout(cvClr); cvSel.pop(); cvTiles(); cvUI(); }
$("#cvDel").onclick = () => { if (CV && !CV.busy) cvDel(); };
$("#cvShuf").onclick = () => { if (!CV || CV.busy) return; clearTimeout(cvClr); const cur = cvSel.map((i) => CV.tiles[i]); CV.tiles = crShuffle(CV.tiles); cvSel = []; cur.forEach((c) => { const i = CV.tiles.findIndex((x, k) => x === c && !cvSel.includes(k)); if (i >= 0) cvSel.push(i); }); cvTiles(); cvUI(); };
// Prueba una palabra. Devuelve true si sumó.
function cvTry(raw, quiet) {
  const w = cvKey(raw); if (!CV || CV.busy || w.length < 2) return false;
  if (CV.found.includes(w)) { cvRepeat(); return false; }
  if (w === cvKey(CV.it.w)) { if (!quiet) toast("Esa es la palabra original 😉"); return false; }
  if (!CV.it.A.has(w)) { if (!quiet) { beep(SND.bad); vib(40); toast("«" + w + "» no cuenta"); } return false; }
  CV.found.push(w); CV.streak++; const g = Math.round(cvPts(w, CV.streak) * (CV.duel ? 1 : difOf("cv").mult * lvMult(CV.lv)));
  CV.rp += g; if (CV.duel) { CV.pts += g; dxProg(CV.i + (CV.found.length ? 0 : 0), CV.pts); } else { addPts("cv", g); }
  SV.cvSolved++; save(); checkAch(); $("#cvTotal").textContent = SV.coins; beep(SND.ok); vib(20); cvFloat(`+${g}${CV.streak >= 3 ? " 🔥x" + CV.streak : ""}`, "good");
  if (CV.duel) cvLives(); return true;
}
// Repetir una palabra ya armada resta 5 puntos
function cvRepeat() {
  CV.streak = 0; beep(SND.bad); vib(40);
  if (CV.duel) { const p = Math.min(5, CV.pts); CV.pts -= p; CV.rp -= p; dxProg(CV.i, CV.pts); cvLives(); }
  else { const p = Math.min(5, ptsOf("cv"), (SV.wal && SV.wal.cv) || 0); addPts("cv", -p); CV.rp -= p; save(); $("#cvTotal").textContent = SV.coins; }
  cvFloat("Repetida −5", "bad");
}
// Si las letras elegidas forman una palabra válida se agrega sola; si ya estaba, resta 5. La selección se limpia al ratito (si seguís sumando letras, se conserva).
function cvAuto() {
  clearTimeout(cvClr); const w = cvSel.map((i) => CV.tiles[i]).join(""); if (w.length < 2) return;
  const k = cvKey(w);
  if (CV.found.includes(k)) { cvClr = setTimeout(() => { if (CV && !CV.busy && cvSel.map((i) => CV.tiles[i]).join("") === w) { cvRepeat(); cvSel = []; cvTiles(); cvUI(); } }, 1100); return; }
  if (cvTry(w)) { cvUI(); cvClr = setTimeout(() => { cvSel = []; cvTiles(); cvUI(); }, 1100); }
}
function cvFloat(t, cls) { const f = $("#cvFloat"); f.className = "float " + (cls || ""); f.textContent = t; void f.offsetWidth; f.classList.add("go"); }
function cvSubmit() {
  if (!CV || CV.busy) return; const w = cvSel.map((i) => CV.tiles[i]).join(""); if (!w) return;
  clearTimeout(cvClr); if (w.length < 2) { toast("Mínimo 2 letras"); } else if (!cvTry(w)) { CV.streak = 0; if (!CV.found.includes(cvKey(w)) && w !== CV.it.L) { /* ya avisó cvTry */ } }
  cvSel = []; cvTiles(); cvUI();
}
// Micrófono: se pueden decir varias palabras seguidas
$("#cvMic").onclick = () => Voz.listen($("#cvMic"), (alts) => {
  if (!CV || CV.busy) return; let n = 0; const seen = new Set();
  alts.forEach((a) => a.split(/[\s,.;]+/).forEach((t) => { const k = cvKey(t); if (k && !seen.has(k)) { seen.add(k); if (cvTry(k, true)) n++; } }));
  cvUI(); if (!n) { toast(`Escuché «${alts[0]}»: no suma. Probá de nuevo`); beep(SND.bad); }
});
$("#cvDone").onclick = () => { if (CV && !CV.busy) cvEnd(false); };
function cvEnd(timeout) {
  if (!CV || CV.ended) return; CV.ended = true; CV.busy = true; clearInterval(QT);
  const it = CV.it, n = CV.found.length, ok = CV.duel || n >= CV.goal;
  const missed = [...it.A].filter((w) => !CV.found.includes(w)).sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  if (!CV.duel) { if (ok) { CV.passed++; if (n >= CV.goal * 1.5) CV.strong++; beep(SND.win); } else { CV.lives--; CV.lost++; beep(SND.lose); SV.cvSeen.push(it.w); } if (ok) SV.cvSeen.push(it.w); save(); }
  cvLives();
  const last = CV.i >= CV.list.length - 1, dead = !CV.duel && CV.lives <= 0;
  const title = CV.duel ? (timeout ? "⏰ ¡Se acabó el tiempo!" : "✔ Listo") : ok ? (timeout ? "⏰ ¡Tiempo! Llegaste a la meta" : "¡Meta cumplida! 🎉") : timeout ? "⏰ ¡Se acabó el tiempo!" : "No llegaste a la meta";
  const more = missed.slice(0, 40), rest = missed.length - more.length;
  modal(`<h2>${title}</h2><p>Armaste <b>${n}</b>${CV.duel ? "" : ` de la meta de <b>${CV.goal}</b>${ok ? "" : " (−1 ❤)"}`} · +${CV.rp} 🪙</p><details><summary>Palabras que se podían armar (${missed.length + n})</summary><p class="cvmiss">${more.map(esc).join(" · ")}${rest > 0 ? ` y ${rest} más…` : ""}</p></details><button class="big" id="cvNext">${dead ? "Ver resultado" : last ? (CV.duel ? "Terminar duelo" : "Terminar nivel") : "Siguiente palabra ▶"}</button>`, true);
  $("#cvNext").onclick = () => { closeModal(); if (dead) return cvOver(); if (last) return CV.duel ? dxFinish(CV.pts) : cvLevelEnd(); CV.i++; if (CV.duel) dxProg(CV.i, CV.pts); cvRound(); };
}
function cvOver() {
  clearInterval(QT); CV.over = true;
  modal(`<h2>Sin vidas 💔</h2><p>Superaste <b>${CV.passed}</b> de ${CV.list.length} palabras.</p><button class="big" id="cvRetry">Reintentar nivel</button><button class="mini" id="cvOut">Volver</button>`, true);
  $("#cvRetry").onclick = () => { closeModal(); cvStart(); };
  $("#cvOut").onclick = () => { closeModal(); $("#cvGame").hidden = true; $("#cvHome").hidden = false; cvHome(); };
}
function cvLevelEnd() {
  const st = CV.lost === 0 && CV.strong >= 2 ? 3 : CV.lost === 0 ? 2 : 1, bonus = lvPrize(CV.lv);
  SV.starsCV[CV.lv - 1] = Math.max(SV.starsCV[CV.lv - 1] || 0, st); addPts("cv", bonus);
  const first = CV.lv === SV.cvLv; const before = titleOf(SV.cvLv); if (first) SV.cvLv++; save(); checkAch(); beep(SND.win); vib([80, 50, 120]);
  const rank = titleOf(SV.cvLv) !== before ? titleOf(SV.cvLv) : "";
  modal(`<h2>¡Nivel superado! 🎉</h2><div class="stars big3">${stars(st)}</div><p class="big2">+${bonus} 🪙</p>${rank ? `<p class="rankup">Nuevo rango: <b>${rank}</b></p>` : ""}<p>Ahora vas por el nivel <b>${SV.cvLv}</b></p><button class="big" id="cvAgain">Siguiente nivel ▶</button><button class="mini" id="cvOut">Volver</button>`, true);
  $("#cvAgain").onclick = () => { closeModal(); cvStart(); };
  $("#cvOut").onclick = () => { closeModal(); $("#cvGame").hidden = true; $("#cvHome").hidden = false; cvHome(); };
}
$("#cvQuit").onclick = () => { if (confirm("¿Salir del nivel?")) { clearInterval(QT); if (CV.duel) { dxAbort(); showMenu(); return; } $("#cvGame").hidden = true; $("#cvHome").hidden = false; cvHome(); } };
