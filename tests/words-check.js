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
