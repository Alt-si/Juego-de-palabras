// Verifica que words.js cargue y no tenga palabras repetidas.
const fs = require("fs");
const src = fs.readFileSync(__dirname + "/../words.js", "utf8");
const run = new Function(src + "\nreturn POOL;");
const POOL = run();
const seen = new Set(); let n = 0;
for (const k in POOL) for (const x of POOL[k]) {
  if (seen.has(x.L)) throw new Error("palabra repetida: " + x.L);
  seen.add(x.L); n++;
}
console.log(n + " palabras sin repetir");

// Cada palabra debe tener su frase-pista y no puede nombrar la palabra.
const CLUES = new Function(fs.readFileSync(__dirname + "/../clues.js", "utf8") + "\nreturn CLUES;")();
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
for (const k in POOL) for (const x of POOL[k]) {
  const c = CLUES[x.w];
  if (!c) throw new Error("falta la pista de: " + x.w);
  if (norm(c).includes(norm(x.w))) throw new Error("la pista nombra la palabra: " + x.w);
}
console.log("pistas completas");

// Adivina: 100 categorías, cada palabra con 4 pistas, dificultad 1-4 y ninguna pista nombra la palabra.
const RAW = [];
for (const f of ["adivina-1.js", "adivina-2.js", "adivina-3.js", "adivina-4.js", "adivina-5.js"])
  new Function("ADIVINA_RAW", fs.readFileSync(__dirname + "/../" + f, "utf8"))(RAW);
let cats = 0, words = 0; const uniq = new Set();
for (const blk of RAW) {
  let cat = "", inCat = 0;
  const done = () => { if (cat && inCat < 8) throw new Error("Adivina: la categoría " + cat + " tiene menos de 8 palabras"); };
  for (const line of blk.split("\n")) {
    const l = line.trim(); if (!l) continue;
    if (l[0] === "#") { done(); cat = l.slice(1).split("|")[0].trim(); inCat = 0; cats++; continue; }
    const p = l.split("|");
    if (p.length !== 6) throw new Error("Adivina: formato incorrecto en " + cat + ": " + l.slice(0, 40));
    const [w, t, ...c] = p;
    if (!/^[a-záéíóúüñ]+$/i.test(w)) throw new Error("Adivina: palabra con caracteres raros: " + w);
    if (!["1", "2", "3", "4"].includes(t)) throw new Error("Adivina: dificultad inválida en " + w);
    for (const x of c) if (norm(x).includes(norm(w))) throw new Error("Adivina: la pista nombra la palabra: " + w + " -> " + x);
    inCat++; words++; uniq.add(w);
  }
  done();
}
if (cats < 100) throw new Error("Adivina: se esperaban 100 categorías y hay " + cats);
console.log("Adivina: " + cats + " categorías, " + words + " palabras (" + uniq.size + " distintas), pistas OK");
