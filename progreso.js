"use strict";
// Progresión larga: la dificultad sube de a poco durante 1000 niveles y después el juego sigue sin fin (∞).
const LV_TOP = 1000;
const lvP = (lv) => Math.min(1, Math.max(0, (lv - 1) / (LV_TOP - 1)));       // avance 0..1 hasta el nivel 1000
const lvOver = (lv) => Math.max(0, lv - LV_TOP);                              // niveles después del 1000
const lvMult = (lv) => 1 + 1.5 * lvP(lv) + Math.min(2, lvOver(lv) / 2000);    // los puntos por palabra crecen con el nivel
const lvPrize = (lv) => Math.round(50 + 12 * Math.sqrt(lv));                  // premio por pasar de nivel
const lvClamp = (n, a, b) => Math.max(a, Math.min(b, n));
const LV_TITLES = [[1, "Novato"], [3, "Aprendiz"], [6, "Curioso"], [10, "Palabrero"], [16, "Aficionado"], [25, "Ingenioso"], [40, "Lingüista"], [60, "Erudito"], [90, "Sabio"], [130, "Maestro"], [180, "Gran maestro"], [250, "Veterano"], [330, "Campeón"], [420, "Titán"], [520, "Sabelotodo"], [640, "Genio"], [760, "Visionario"], [880, "Prodigio"], [1000, "Leyenda"], [1500, "Mítico"], [2000, "Inmortal"], [3000, "Eterno"]];
const LV_TITLES_AD = [[1, "Curioso"], [3, "Aprendiz de detective"], [6, "Rastreador"], [10, "Detective"], [16, "Sabueso"], [25, "Inspector"], [40, "Comisario"], [60, "Maestro de la intriga"], [90, "Detective estrella"], [130, "Gran inspector"], [180, "Mente criminal"], [250, "Sherlock"], [330, "Archivista"], [420, "Oráculo del misterio"], [520, "Mago de las pistas"], [640, "Genio del misterio"], [760, "Visionario"], [880, "Prodigio"], [1000, "Leyenda del misterio"], [1500, "Mítico"], [2000, "Inmortal"], [3000, "Eterno"]];
function lvTitle(lv, list) {
  list = list || LV_TITLES; let t = list[0][1]; for (const x of list) if (lv >= x[0]) t = x[1];
  const last = list[list.length - 1]; if (lv >= last[0] + 1000) t += " ✦" + Math.floor((lv - last[0]) / 1000);
  return t;
}
// Barra de camino hacia el nivel 1000 (y después, ∞)
function lvPath(lv) {
  const pct = Math.min(100, (lv / LV_TOP) * 100);
  return `<span class="lvpath"><i style="width:${Math.max(1, pct)}%"></i></span><small>${lv >= LV_TOP ? `♾️ ¡Pasaste el nivel ${LV_TOP}! El juego no termina` : `🏁 Nivel ${lv} de ${LV_TOP} · después, ¡sin fin!`}</small>`;
}
// Rangos globales: del Novato al Eterno (3.500.000 pts) y después una estrella ✦ por cada millón más.
const GRANKS = [[0, "Novato", "🥚"], [300, "Aprendiz", "🌱"], [1000, "Curioso", "🔎"], [2500, "Ingenioso", "💡"], [5000, "Astuto", "🦊"], [9000, "Erudito", "📚"], [15000, "Genio", "🧠"], [25000, "Maestro mental", "👑"], [40000, "Sabio", "🦉"], [65000, "Gran maestro", "🎓"], [100000, "Veterano", "🎖️"], [150000, "Campeón", "🏅"], [220000, "Titán", "🗿"], [320000, "Prodigio", "⚡"], [450000, "Visionario", "🔭"], [620000, "Oráculo", "🔮"], [850000, "Semidiós", "🌟"], [1150000, "Leyenda", "🏆"], [1600000, "Mítico", "🐉"], [2300000, "Inmortal", "💎"], [3500000, "Eterno", "♾️"]];
const GR_STAR = 1000000;
