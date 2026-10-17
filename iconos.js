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
// Efecto de "foto de estudio": iluminación (relieve y brillos), grano sutil y sombra de apoyo.
const ICON_FX = `<defs>
<radialGradient id="bgw" cx="50%" cy="42%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe6f0"/></radialGradient>
<radialGradient id="gs" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="real" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="bl"/>
<feDiffuseLighting in="bl" surfaceScale="3.2" diffuseConstant="1.3" lighting-color="#ffffff" result="df"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>
<feComposite in="SourceGraphic" in2="df" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit"/>
<feSpecularLighting in="bl" surfaceScale="3.2" specularConstant=".75" specularExponent="26" lighting-color="#ffffff" result="sp"><feDistantLight azimuth="225" elevation="50"/></feSpecularLighting>
<feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/>
<feComposite in="lit" in2="sp2" operator="arithmetic" k1="0" k2="1" k3=".8" k4="0" result="lit2"/>
<feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="nz"/>
<feColorMatrix in="nz" type="matrix" values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .12 0" result="nz2"/>
<feComposite in="nz2" in2="SourceAlpha" operator="in" result="nz3"/>
<feBlend in="lit2" in2="nz3" mode="multiply"/>
</filter></defs>`;
const iconSvg = (name) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-hidden="true">${ICON_FX}<ellipse cx="50" cy="93" rx="30" ry="4.5" fill="url(#gs)"/><g filter="url(#real)" transform="translate(50 47) scale(.88) translate(-50 -50)">${ICONS[name]}</g></svg>`;
