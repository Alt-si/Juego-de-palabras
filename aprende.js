"use strict";
// Palabras aprendidas: las que el jugador dice o escribe en Adivina y el juego no conoce
// se guardan en este dispositivo y forman la categoría «✨ Aprendidas» (se juega desde 5 palabras).
const APR_KEY = "palabras-aprendidas", APR_MAX = 500, APR_CAT = "✨ Aprendidas", APR_MIN = 5;
const Apr = {
  list: [],
  load() { try { const l = JSON.parse(localStorage.getItem(APR_KEY) || "[]"); this.list = Array.isArray(l) ? l.filter((w) => typeof w === "string") : []; } catch { this.list = []; } },
  save() { try { localStorage.setItem(APR_KEY, JSON.stringify(this.list)); } catch {} },
  norm: (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " "),
  key: (w) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ñ/g, "n"),
  known: null,
  // Conjunto de palabras que el juego ya tiene (sin tildes) para no duplicar.
  vocab() {
    if (this.known) return this.known;
    const k = new Set(); const add = (w) => k.add(this.key(w.toLowerCase()));
    for (const l of Object.values(POOL)) for (const x of l) add(x.w);
    for (const e of buildAdivina().byWord.values()) add(e.w);
    for (const a of Object.values(ALIAS)) a.forEach(add);
    this.list.forEach(add);
    return (this.known = k);
  },
  entry(w) {
    const T = [...w.toUpperCase()], L = T.length;
    return { w, t: 2, cat: APR_CAT, c: ["Una palabra que sumaron los jugadores.", `Tiene ${L} letras y empieza con ${T[0]}.`, `Termina con la letra ${T[L - 1]}.`, "Así se ve con algunas letras: " + T.map((c, i) => (i % 2 === 0 ? c : "_")).join(" ")] };
  },
  // Devuelve true si la palabra era nueva y se incorporó.
  add(raw) {
    const w = this.norm(raw);
    if (!/^[a-záéíóúüñ]{4,12}$/.test(w) || this.list.length >= APR_MAX) return false;
    const k = this.key(w), V = this.vocab(); if (V.has(k)) return false;
    // Evita errores de tipeo: si es casi igual a una palabra conocida (1 letra de diferencia), no se suma.
    for (const x of V) if (Math.abs(x.length - k.length) <= 1 && x[0] === k[0] && this.near(x, k)) return false;
    this.list.push(w); V.add(k); this.save(); this.attach(w); return true;
  },
  near(a, b) { // distancia de edición <= 1
    if (a === b) return true; let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
    const [s, l] = a.length < b.length ? [a, b] : [b, a]; return s.slice(i) === l.slice(i + 1);
  },
  attach(w) {
    if (typeof ADI === "undefined" || !ADI) return;
    let c = ADI.cats.find((x) => x.name === APR_CAT);
    const e = this.entry(w);
    if (!c) { if (this.list.length < APR_MIN) return; c = { name: APR_CAT, icon: "✨", words: [] }; ADI.cats.push(c); this.list.forEach((x) => { const en = this.entry(x); c.words.push(en); ADI.byWord.set(x, en); }); return; }
    c.words.push(e); ADI.byWord.set(w, e);
  },
};
Apr.load();
// buildAdivina arma la categoría al crear el catálogo. Los duelos usan ADI.all, que no cambia (los dos jugadores deben ver lo mismo).
{
  const base = buildAdivina; let done = false;
  buildAdivina = function () {
    const r = base();
    if (!done) { done = true; if (Apr.list.length >= APR_MIN) { const c = { name: APR_CAT, icon: "✨", words: [] }; r.cats.push(c); Apr.list.forEach((x) => { const en = Apr.entry(x); c.words.push(en); r.byWord.set(x, en); }); } }
    return r;
  };
}
