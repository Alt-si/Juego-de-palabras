"use strict";
// Palabras por categoría (pista). Se agrupan por cantidad de letras al cargar.
const RAW = {
  Animal: "gato pato lobo vaca rana foca perro tigre cebra burro ratón pulpo oveja pájaro conejo jirafa delfín caballo ballena gallina tortuga hormiga gaviota leopardo elefante mariposa cocodrilo murciélago hipopótamo dinosaurio golondrina rinoceronte",
  Hogar: "casa mesa taza vaso silla plato cocina ventana cuchara tenedor botella martillo cuchillo escalera escritorio refrigerador",
  Cuerpo: "mano pelo boca dedo",
  Naturaleza: "agua lago hoja nieve playa selva campo montaña cascada desierto bosque",
  Fruta: "lima pera uvas limón mango melón banana naranja manzana frutilla mandarina",
  Color: "rojo azul gris verde negro blanco marrón dorado violeta",
  Clima: "nube lluvia viento tormenta relámpago invierno primavera",
  Transporte: "tren moto bote bicicleta carretera ambulancia aeropuerto helicóptero semáforo estación",
  Comida: "sopa miel queso pizza comida helado chocolate mantequilla",
  Objeto: "libro lápiz reloj papel carta radio cámara mochila billete teclado pantalla teléfono calendario diccionario telescopio",
  Lugar: "cine banco calle plaza ciudad camino jardín escuela mercado hospital farmacia biblioteca",
  Espacio: "luna cohete cometa planeta estrella astronauta",
  Mundo: "mundo tierra fuego viaje",
  Acción: "correr saltar dormir cantar bailar sonrisa",
  Familia: "abuelo padres hombre familia hermano sobrino compañero",
  Deporte: "pelota fútbol deporte carrera campeonato basquetbol",
  Ropa: "zapatos sombrero pantalón camisa",
  Arte: "pintura guitarra trompeta cantante escultura teatro música",
  Varios: "trabajo estudio lectura amistad alegría felicidad esperanza maravilla aventura sorpresa tesoro pirámide pesadilla vacaciones cumpleaños campamento arquitecto invitación televisión plataforma ciudadano navegante periódico",
};
const strip = (s) => s.replace(/ñ/g, "\u0001").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\u0001/g, "ñ");
const letters = (w) => strip(w.toLowerCase()).toUpperCase();
// Se suman las palabras de words-extra.js (sin repetir ni salirse de 4 a 12 letras)
{
  const have = new Set(Object.values(RAW).flatMap((l) => l.split(/\s+/)).map(letters));
  if (typeof RAW_EXTRA !== "undefined") for (const [c, l] of Object.entries(RAW_EXTRA)) {
    const out = [];
    for (const x of l.split(/\s+/)) { const L = letters(x); if (L.length < 4 || L.length > 12 || have.has(L)) continue; have.add(L); out.push(x); }
    const k = c.replace(/ \d+$/, ""); RAW[k] = (RAW[k] ? RAW[k] + " " : "") + out.join(" ");
  }
}
const POOL = {};   // largo -> [{w, c, L}]
const ALL = new Map();
for (const [c, list] of Object.entries(RAW)) for (const w of list.split(/\s+/)) {
  const L = letters(w), n = L.length;
  (POOL[n] ||= []).push({ w, c, L });
  const key = [...L].sort().join("");
  (ALL.get(key) || ALL.set(key, new Set()).get(key)).add(L);
}
