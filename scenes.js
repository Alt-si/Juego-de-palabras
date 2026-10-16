// Fondos ilustrados (SVG generados por código). Cambian con el nivel.
// "Mundos" para Anagrama y Palabras escondidas; "Escenas de misterio" (con un gran signo de pregunta) para Adivina.
(function () {
  const enc = (inner) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 800' preserveAspectRatio='xMidYMax slice'>${inner}</svg>`)}")`;
  const sky = (a, b) => `<defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient></defs><rect width='400' height='800' fill='url(#s)'/>`;
  const hill = (y, c, o = 1, k = 60) => `<path d='M0 ${y} Q100 ${y - k} 200 ${y + 10} T400 ${y - 10} V800 H0Z' fill='${c}' opacity='${o}'/>`;
  const circ = (x, y, r, c, o = 1) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${c}' opacity='${o}'/>`;
  const stars = (n, seed = 7, c = "#fff", maxY = 520) => { let s = "", r = seed; for (let i = 0; i < n; i++) { r = (r * 9301 + 49297) % 233280; const x = (r / 233280) * 400; r = (r * 9301 + 49297) % 233280; const y = (r / 233280) * maxY; s += `<circle cx='${x | 0}' cy='${y | 0}' r='${(i % 3) + 1}' fill='${c}' opacity='.8'/>`; } return s; };
  const tri = (x, y, w, h, c, o = 1) => `<path d='M${x} ${y} L${x + w / 2} ${y - h} L${x + w} ${y}Z' fill='${c}' opacity='${o}'/>`;
  const cloud = (x, y, s = 1) => `<g opacity='.85' fill='#fff'><ellipse cx='${x}' cy='${y}' rx='${40 * s}' ry='${16 * s}'/><ellipse cx='${x + 25 * s}' cy='${y - 10 * s}' rx='${28 * s}' ry='${16 * s}'/><ellipse cx='${x - 22 * s}' cy='${y - 6 * s}' rx='${22 * s}' ry='${12 * s}'/></g>`;

  const WORLDS = [
    ["Amanecer", () => sky("#fde68a", "#fecaca") + circ(200, 560, 110, "#fb923c", .55) + circ(200, 560, 70, "#fdba74", .6) + hill(660, "#fdba74", .7) + hill(720, "#fb7185", .5, 40)],
    ["Pradera", () => sky("#bfdbfe", "#ecfccb") + cloud(90, 140) + cloud(300, 220, 1.2) + hill(620, "#86efac", .9, 80) + hill(700, "#4ade80", .8)],
    ["Océano", () => sky("#bae6fd", "#e0f2fe") + cloud(280, 150) + `<path d='M0 640 Q50 610 100 640 T200 640 T300 640 T400 640 V800 H0Z' fill='#38bdf8' opacity='.55'/><path d='M0 700 Q50 670 100 700 T200 700 T300 700 T400 700 V800 H0Z' fill='#0ea5e9' opacity='.5'/><path d='M180 600 L180 520 L240 590Z' fill='#fff' opacity='.9'/><path d='M170 604 H250 L235 620 H185Z' fill='#7c3aed' opacity='.6'/>`],
    ["Bosque", () => sky("#d1fae5", "#a7f3d0") + [0, 60, 130, 200, 270, 330].map((x, i) => tri(x - 20, 790, 110, 260 + (i % 3) * 60, "#15803d", .35)).join("") + hill(740, "#16a34a", .5, 30)],
    ["Desierto", () => sky("#fef3c7", "#fed7aa") + circ(300, 180, 60, "#f59e0b", .5) + hill(640, "#fbbf24", .55, 70) + hill(720, "#f59e0b", .5, 50) + `<path d='M70 700 V620 M70 650 H45 V625 M70 640 H95 V610' stroke='#16a34a' stroke-width='9' fill='none' stroke-linecap='round' opacity='.6'/>`],
    ["Montañas", () => sky("#e0f2fe", "#f1f5f9") + tri(-40, 720, 300, 380, "#94a3b8", .6) + tri(120, 720, 320, 430, "#64748b", .5) + `<path d='M110 340 L88 388 L110 376 L132 392Z M280 290 L254 352 L280 338 L306 356Z' fill='#fff' opacity='.9'/>` + hill(730, "#e2e8f0", .9, 30)],
    ["Noche estrellada", () => sky("#c7d2fe", "#e9d5ff") + stars(60) + circ(300, 170, 48, "#fef9c3", .95) + circ(318, 160, 44, "#c7d2fe", .95) + hill(700, "#818cf8", .45)],
    ["Ciudad", () => sky("#fbcfe8", "#fed7aa") + [20, 70, 120, 175, 230, 280, 330].map((x, i) => `<rect x='${x}' y='${620 - (i % 4) * 60}' width='42' height='${300 + (i % 4) * 60}' fill='#6d28d9' opacity='.28'/>`).join("") + `<g fill='#fde68a' opacity='.7'>${[40, 90, 140, 250].map((x) => `<rect x='${x}' y='660' width='8' height='10'/><rect x='${x}' y='700' width='8' height='10'/>`).join("")}</g>`],
    ["Espacio", () => sky("#c4b5fd", "#fbcfe8") + stars(70, 3) + circ(110, 220, 56, "#f472b6", .6) + `<ellipse cx='110' cy='220' rx='90' ry='16' fill='none' stroke='#fff' stroke-width='5' opacity='.6' transform='rotate(-20 110 220)'/>` + circ(300, 520, 80, "#60a5fa", .45) + circ(280, 500, 20, "#fff", .4)],
    ["Aurora", () => sky("#a5f3fc", "#c4b5fd") + `<path d='M0 260 Q100 150 200 260 T400 240 V340 Q300 230 200 340 T0 360Z' fill='#4ade80' opacity='.45'/><path d='M0 340 Q100 250 200 340 T400 320 V400 Q300 310 200 400 T0 420Z' fill='#f0abfc' opacity='.4'/>` + stars(40, 11) + hill(690, "#fff", .85, 50) + hill(750, "#e0e7ff", .9, 30)],
    ["Volcán", () => sky("#fecaca", "#fed7aa") + `<path d='M60 780 L170 470 H230 L340 780Z' fill='#7c2d12' opacity='.4'/>` + circ(200, 465, 40, "#f97316", .6) + `<path d='M195 470 Q150 650 120 780 M205 470 Q250 650 290 780' stroke='#ea580c' stroke-width='10' fill='none' opacity='.5' stroke-linecap='round'/>` + circ(120, 300, 30, "#fff", .5) + circ(280, 230, 40, "#fff", .45)],
    ["Cristales", () => sky("#fbcfe8", "#a5f3fc") + [[40, 760, 70, 200, "#a78bfa"], [130, 780, 60, 300, "#38bdf8"], [210, 770, 80, 240, "#f472b6"], [300, 780, 70, 320, "#34d399"]].map(([x, y, w, h, c]) => `<path d='M${x} ${y} L${x + w / 2} ${y - h} L${x + w} ${y}Z' fill='${c}' opacity='.45'/>`).join("") + stars(30, 5, "#fff", 400)],
  ];

  const q = (c1, c2, y = 600, o = 0.2) => `<defs><linearGradient id='q' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><text x='200' y='${y}' font-family='Georgia,serif' font-size='620' font-weight='900' text-anchor='middle' fill='url(#q)' opacity='${o}'>?</text>`;
  const fog = (y, o = 0.5) => `<ellipse cx='80' cy='${y}' rx='220' ry='34' fill='#fff' opacity='${o}'/><ellipse cx='330' cy='${y + 40}' rx='240' ry='40' fill='#fff' opacity='${o}'/>`;
  const MYST = [
    ["La lupa", () => sky("#e0e7ff", "#ddd6fe") + q("#6366f1", "#a855f7") + `<circle cx='170' cy='620' r='86' fill='#fff' fill-opacity='.35' stroke='#4338ca' stroke-width='16' opacity='.55'/><path d='M232 682 L330 780' stroke='#4338ca' stroke-width='26' stroke-linecap='round' opacity='.55'/>` + fog(760)],
    ["Huellas", () => sky("#fef3c7", "#fde68a") + q("#d97706", "#92400e") + [[110, 700], [170, 640], [120, 580], [190, 520], [140, 460], [210, 400]].map(([x, y], i) => `<ellipse cx='${x + (i % 2) * 0}' cy='${y}' rx='15' ry='26' fill='#78350f' opacity='.35' transform='rotate(${i % 2 ? 15 : -15} ${x} ${y})'/>`).join("")],
    ["El detective", () => sky("#cbd5e1", "#e2e8f0") + q("#475569", "#0f172a") + `<ellipse cx='200' cy='640' rx='130' ry='20' fill='#1e293b' opacity='.45'/><path d='M120 640 Q125 560 200 555 Q275 560 280 640Z' fill='#1e293b' opacity='.5'/><rect x='120' y='610' width='160' height='16' fill='#b91c1c' opacity='.45'/>` + fog(740)],
    ["La cerradura", () => sky("#fbcfe8", "#e9d5ff") + q("#db2777", "#7c3aed", 560) + `<circle cx='200' cy='560' r='60' fill='#4c1d95' opacity='.45'/><path d='M170 600 L230 600 L248 740 L152 740Z' fill='#4c1d95' opacity='.45'/>`],
    ["La mansión", () => sky("#c7d2fe", "#a5b4fc") + q("#4f46e5", "#1e1b4b", 580, .16) + circ(320, 140, 44, "#fef9c3", .9) + `<path d='M60 780 V560 L120 500 L180 560 V480 L230 420 L280 480 V560 L340 600 V780Z' fill='#1e1b4b' opacity='.5'/><rect x='110' y='620' width='20' height='28' fill='#fde68a' opacity='.8'/><rect x='230' y='560' width='20' height='28' fill='#fde68a' opacity='.8'/>` + fog(770, .6)],
    ["Niebla y farol", () => sky("#bae6fd", "#cbd5e1") + q("#0ea5e9", "#334155") + `<rect x='296' y='420' width='10' height='360' fill='#1e293b' opacity='.5'/><path d='M280 420 H322 L312 380 H290Z' fill='#1e293b' opacity='.55'/><circle cx='301' cy='400' r='60' fill='#fde68a' opacity='.5'/>` + fog(640, .7) + fog(740, .8)],
    ["Mapa del tesoro", () => sky("#fef3c7", "#fed7aa") + q("#b45309", "#7c2d12", 600, .16) + `<path d='M40 700 Q120 620 160 660 T260 560 T340 480' stroke='#92400e' stroke-width='6' stroke-dasharray='14 12' fill='none' opacity='.5'/><path d='M320 460 L360 500 M360 460 L320 500' stroke='#b91c1c' stroke-width='12' stroke-linecap='round' opacity='.7'/>`],
    ["El antifaz", () => sky("#ede9fe", "#fbcfe8") + q("#7c3aed", "#be185d") + `<path d='M70 600 Q200 520 330 600 Q300 690 240 660 Q200 620 160 660 Q100 690 70 600Z' fill='#312e81' opacity='.45'/><ellipse cx='140' cy='620' rx='28' ry='16' fill='#fff' opacity='.7'/><ellipse cx='260' cy='620' rx='28' ry='16' fill='#fff' opacity='.7'/>`],
    ["La llave", () => sky("#fef9c3", "#fde68a") + q("#ca8a04", "#713f12") + `<circle cx='130' cy='620' r='56' fill='none' stroke='#713f12' stroke-width='22' opacity='.45'/><path d='M186 620 H340 M300 620 V670 M338 620 V660' stroke='#713f12' stroke-width='22' stroke-linecap='round' opacity='.45'/>`],
    ["La caja fuerte", () => sky("#cbd5e1", "#94a3b8") + q("#334155", "#020617", 600, .14) + `<rect x='80' y='470' width='240' height='260' rx='18' fill='#1e293b' opacity='.5'/><circle cx='200' cy='600' r='54' fill='none' stroke='#e2e8f0' stroke-width='10' opacity='.7'/><path d='M200 600 L200 560' stroke='#e2e8f0' stroke-width='8' stroke-linecap='round' opacity='.8'/>`],
    ["El laboratorio", () => sky("#cffafe", "#bbf7d0") + q("#0891b2", "#15803d") + `<path d='M110 780 V620 L80 560 H170 L140 620 V780Z' fill='#16a34a' opacity='.45'/><path d='M260 780 L230 640 H310 L340 780Z' fill='#7c3aed' opacity='.4'/><circle cx='300' cy='590' r='12' fill='#fff' opacity='.6'/><circle cx='285' cy='560' r='8' fill='#fff' opacity='.6'/>`],
    ["La puerta secreta", () => sky("#fde68a", "#fbcfe8") + q("#f59e0b", "#db2777") + `<path d='M120 780 V540 Q200 440 280 540 V780Z' fill='#78350f' opacity='.45'/><circle cx='252' cy='660' r='10' fill='#fde68a' opacity='.9'/><path d='M60 780 V700 H110 V780 M290 780 V700 H340 V780' fill='#92400e' opacity='.4'/>`],
  ];

  const cache = {};
  const get = (list, i) => { const k = list === WORLDS ? "w" : "m"; const idx = ((i - 1) % list.length + list.length) % list.length; return cache[k + idx] || (cache[k + idx] = enc(list[idx][1]())); };
  const idxOf = (level, per) => Math.floor((Math.max(1, level) - 1) / per);
  window.SCENES = {
    worldCount: WORLDS.length, mystCount: MYST.length,
    worldIndex: (lv) => idxOf(lv, 3) % WORLDS.length,
    worldName: (lv) => WORLDS[idxOf(lv, 3) % WORLDS.length][0],
    world: (lv) => get(WORLDS, idxOf(lv, 3) + 1),
    mysteryIndex: (lv) => idxOf(lv, 2) % MYST.length,
    mysteryName: (lv) => MYST[idxOf(lv, 2) % MYST.length][0],
    mystery: (lv) => get(MYST, idxOf(lv, 2) + 1),
    apply(css) { const b = document.body; b.style.setProperty("--scene", css || "none"); b.classList.toggle("scened", !!css); },
  };
})();
