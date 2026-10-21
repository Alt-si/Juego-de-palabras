// Datos de "Adivina": se cargan desde adivina-1.js ... adivina-5.js (100 categorías).
// Formato de cada línea:  palabra|nivel de dificultad (1-4)|pista 1|pista 2|pista 3|pista 4   (de la más vaga a la más clara)
// Las otras 6 pistas (cantidad de letras, primera y última letra, vocales, letra del medio y un esquema) se generan solas.
var ADIVINA_RAW = [];

// Otras formas de escribir la misma respuesta que también se aceptan.
const ALIAS = {
  refrigerador: ["heladera", "nevera", "frigorifico"], banana: ["platano", "banano"], frutilla: ["fresa"], teléfono: ["celular", "movil"],
  moto: ["motocicleta"], pintura: ["cuadro"], hologramas: ["holograma"], viajetiempo: ["viajeeneltiempo", "viajeporeltiempo", "viajeenelTiempo"],
  papanoel: ["santaclaus", "santaclos"], panetone: ["pantone", "panettone"], pochoclo: ["pochoclos", "palomitas"], sanmartín: ["josedesanmartin"],
  cristoredentor: ["cristoredentordelcorcovado"], arbolito: ["arboldenavidad", "arbolnavidad"], bobesponja: ["bobsponja", "bobesponja"], astroboy: ["atom"],
  nochebuena: ["nochebuena"], marcopolo: ["marcopolo"], peterpan: ["peterpan"], pulgarcito: ["pulgarcito"],
};

let ADI = null;
function buildAdivina() {
  if (ADI) return ADI;
  const cats = [], byWord = new Map();
  for (const blk of ADIVINA_RAW) {
    let cur = null;
    for (const line of blk.split("\n")) {
      const l = line.trim(); if (!l) continue;
      if (l[0] === "#") { const [name, icon] = l.slice(1).split("|"); cur = cats.find((c) => c.name === name.trim()); if (!cur) { cur = { name: name.trim(), icon: (icon || "❓").trim(), words: [] }; cats.push(cur); } continue; }
      const p = l.split("|"); if (p.length < 6 || !cur) continue;
      const e = { w: p[0], t: +p[1] || 1, c: p.slice(2, 6), cat: cur.name }; cur.words.push(e);
      if (!byWord.has(e.w)) byWord.set(e.w, e);
    }
  }
  ADI = { cats, byWord, all: [...byWord.values()] };
  return ADI;
}
