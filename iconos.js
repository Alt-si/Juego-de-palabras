// Ilustraciones propias (dibujadas con formas geométricas simples, sin derechos de terceros) para "¿Qué ves?".
// Cada icono es el interior de un SVG de 100x100.
const ICONS = {};
const ic = {
  c: (x, y, r, f, a = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${a}/>`,
  e: (x, y, rx, ry, f, a = "") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${a}/>`,
  r: (x, y, w, h, f, rx = 0, a = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${a}/>`,
  p: (d, f, a = "") => `<path d="${d}" fill="${f}" ${a}/>`,
  s: (d, col, w = 4, a = "") => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${a}/>`,
  eye: (x, y, r = 3.2) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#222"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff"/>`,
  rot: (deg, x, y) => `transform="rotate(${deg} ${x} ${y})"`,
};
const iconSvg = (name) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true">${ICONS[name]}</svg>`;
