"use strict";
// Responder con la voz (Adivina y ¿Qué ves?) usando el reconocimiento de voz del navegador.
const Voz = {
  api: window.SpeechRecognition || window.webkitSpeechRecognition, rec: null, btn: null,
  stop() { try { if (this.rec) this.rec.abort(); } catch {} this.done(); },
  done() { if (this.btn) { this.btn.classList.remove("on"); this.btn.disabled = false; } this.rec = null; this.btn = null; },
  // Escucha una vez y llama cb(alternativas) con lo que entendió (la más probable primero)
  listen(btn, cb) {
    if (!this.api) return toast("Tu navegador no permite usar la voz. Probá con Chrome o Safari.");
    if (this.rec) return this.stop();
    const r = new this.api(); this.rec = r; this.btn = btn; btn.classList.add("on");
    r.lang = "es-AR"; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
    let got = false;
    r.onresult = (e) => { got = true; const res = e.results[e.resultIndex || 0] || e.results[0], alts = []; for (let i = 0; i < res.length; i++) alts.push(String(res[i].transcript || "").trim()); const list = alts.filter(Boolean); if (list.length) cb(list); };
    r.onerror = (e) => { const m = { "not-allowed": "Permití el micrófono para usar la voz", "service-not-allowed": "Permití el micrófono para usar la voz", "no-speech": "No te escuché. Probá de nuevo", "audio-capture": "No encuentro el micrófono", "network": "Sin conexión: la voz necesita internet" }[e.error]; if (m && e.error !== "aborted") toast(m); };
    r.onend = () => { if (!got && this.rec === r && this.btn) toast("No te escuché. Probá de nuevo"); this.done(); };
    try { r.start(); toast("🎤 Hablá ahora…"); } catch { this.done(); }
  },
};
// Adivina: dice la respuesta y se prueba como si la hubieras escrito
$("#adMic").onclick = () => Voz.listen($("#adMic"), (alts) => {
  if (AD.busy) return;
  const ans = adAnswers(), pick = alts.find((a) => ans.includes(plain(a))) || alts.find((a) => ans.some((x) => spellOk(plain(a), x))) || alts[0];
  $("#adIn").value = pick; if (!ans.includes(plain(pick)) && !ans.some((x) => spellOk(plain(pick), x))) toast(`Escuché «${pick}»`); AD.said = true; adGuess();
});
// ¿Qué ves?: si dice la palabra correcta se completa sola; si no, muestra lo que entendió (sin quitar vidas)
$("#qvMic").onclick = () => Voz.listen($("#qvMic"), (alts) => {
  if (!Q || Q.busy) return;
  const hit = alts.find((a) => qvNorm(a) === Q.it.L);
  if (hit) { Q.ans = [...Q.it.L]; qvDraw(); return qvWin(); }
  toast(`Escuché «${alts[0]}»: no es. Probá de nuevo`); beep(SND.bad);
});
if (!Voz.api) { document.querySelectorAll(".mic").forEach((b) => b.remove()); const t = document.querySelector("#qvGame .tools"); if (t) t.classList.replace("three", "two"); const c = document.querySelector("#cvGame .tools"); if (c) c.classList.replace("three", "two"); }
HELP.adi[1].push("🎤 También podés tocar el micrófono y decir la respuesta en voz alta.");
HELP.qv[1].push("🎤 Tocá el micrófono y decí la palabra completa en voz alta.");
HELP.cv[1].push("🎤 Con el micrófono podés decir varias palabras seguidas.");
