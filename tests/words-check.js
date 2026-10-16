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

// Adivina: cada palabra tiene 4 pistas propias y la pista fácil; ninguna nombra la palabra.
const AD = new Function(fs.readFileSync(__dirname + "/../adivina.js", "utf8") + "\nreturn ADIVINA;")();
let nAd = 0;
for (const c in AD) for (const w in AD[c]) {
  nAd++;
  if (AD[c][w].length !== 4) throw new Error("Adivina: " + w + " necesita 4 pistas");
  if (!CLUES[w]) throw new Error("Adivina: falta la pista fácil de " + w);
  for (const t of [...AD[c][w], CLUES[w]]) if (norm(t).includes(norm(w))) throw new Error("Adivina: la pista nombra la palabra: " + w + " -> " + t);
}
console.log("Adivina: " + nAd + " palabras, pistas OK");
