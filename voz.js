"use strict";
// Responder con la voz (Adivina y ¿Qué ves?) usando el reconocimiento de voz del navegador.
const Voz = {
  api: window.SpeechRecognition || window.webkitSpeechRecognition, rec: null, btn: null,
  stop() { try { if (this.rec) this.rec.abort(); } catch {} this.done(); },
  done() { if (this.btn) { this.btn.classList.remove("on"); this.btn.disabled = false; } this.rec = null; this.btn = null; },
  // Sin reconocimiento de voz en el navegador (p. ej. Silk de las tablets Fire): se escribe y se usa el micrófono del teclado
  sinVoz() { toast("Este navegador no entiende la voz. Escribí, o tocá el 🎤 de tu teclado. También podés abrir el juego en Chrome."); const i = $("#qvIn") || $("#adIn"); try { if (i && i.offsetParent) i.focus(); } catch {} },
  // Escucha una vez y llama cb(alternativas) con lo que entendió (la más probable primero)
  listen(btn, cb) {
    if (!this.api) return this.sinVoz();
    if (this.rec) return this.stop();
    const r = new this.api(); this.rec = r; this.btn = btn; btn.classList.add("on");
    r.lang = "es-AR"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
    let got = false;
    r.onresult = (e) => { got = true; const res = e.results[e.resultIndex || 0] || e.results[0], alts = []; for (let i = 0; i < res.length; i++) alts.push(String(res[i].transcript || "").trim()); const list = alts.filter(Boolean); if (list.length) cb(list); };
    r.onerror = (e) => { const m = { "not-allowed": "Permití el micrófono para usar la voz", "service-not-allowed": "Permití el micrófono para usar la voz", "no-speech": "No te escuché. Probá de nuevo", "audio-capture": "No encuentro el micrófono", "network": "Sin conexión: la voz necesita internet" }[e.error]; if (e.error === "aborted") return; if (e.error === "service-not-allowed" || e.error === "language-not-supported") return this.sinVoz(); toast(m || "La voz no funcionó. Escribí la respuesta."); };
    r.onend = () => { if (!got && this.rec === r && this.btn) toast("No te escuché. Probá de nuevo"); this.done(); };
    try { r.start(); toast("🎤 Hablá ahora…"); } catch { this.done(); this.sinVoz(); }
  },
};
// Adivina: dice la respuesta y se prueba como si la hubieras escrito
$("#adMic").onclick = () => { $("#adIn").blur(); Voz.listen($("#adMic"), (alts) => {
  if (AD.busy) return;
  const ans = adAnswers(), pick = alts.find((a) => ans.includes(plain(a))) || alts.find((a) => ans.some((x) => spellOk(plain(a), x))) || alts[0];
  $("#adIn").value = pick; if (!ans.includes(plain(pick)) && !ans.some((x) => spellOk(plain(pick), x))) toast(`Escuché «${pick}»`); AD.said = true; adGuess();
}); };
// Anagrama y Palabras escondidas: dice la palabra; si se arma con las letras y es válida, se completa sola
$("#tMic").onclick = () => { if (!G || G.busy || G.paused) return; Voz.listen($("#tMic"), (alts) => {
  if (!G || G.busy) return; const alt = G.kind === "hid" ? null : ALL.get([...G.target].sort().join(""));
  const fits = (w) => { if (w.length !== G.len || !(w === G.target || (G.kind === "hid" ? WSET.has(w) : alt && alt.has(w)))) return false; const used = new Set(), ids = []; for (const ch of w) { const t = G.tiles.find((x) => x.ch === ch && !used.has(x.id)); if (!t) return false; used.add(t.id); ids.push(t.id); } return ids; };
  for (const a of alts) { const w = plain(a).toUpperCase().replace(/[^A-ZÑ]/g, ""), ids = fits(w); if (ids) { G.ans = ids; G.locked = Array(G.len).fill(false); renderTiles(); return solveWord(); } }
  toast(`Escuché «${alts[0]}»: no es. Probá de nuevo`); beep(SND.bad);
}); };
// ¿Qué ves?: si dice la palabra correcta se completa sola; si no, muestra lo que entendió (sin quitar vidas)
$("#qvMic").onclick = () => Voz.listen($("#qvMic"), (alts) => {
  if (!Q || Q.busy) return;
  const hit = alts.find((a) => qvNorm(a) === Q.it.L);
  if (hit) { Q.ans = [...Q.it.L]; qvDraw(); return qvWin(); }
  toast(`Escuché «${alts[0]}»: no es. Probá de nuevo`); beep(SND.bad);
});
HELP.adi[1].push("🎤 También podés tocar el micrófono y decir la respuesta en voz alta.");
HELP.qv[1].push("🎤 Tocá el micrófono y decí la palabra completa en voz alta.");
