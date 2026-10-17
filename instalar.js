"use strict";
// Aviso al abrir un desafío desde el navegador: Android → instalar desde Google Play; iPhone → agregar a inicio.
const PLAY_ID = "io.github.altsi.juegosmentales", PLAY_LIVE = false;   // PLAY_LIVE pasa a true cuando la app esté publicada
const PLAY_URL = "https://play.google.com/store/apps/details?id=" + PLAY_ID;
const INV = "\n📲 Android: bajá la app en Google Play · iPhone: abrí el link en Safari";
(function () {
  const ua = navigator.userAgent || "", ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1), android = /Android/.test(ua);
  const app = matchMedia("(display-mode: standalone)").matches || navigator.standalone || (document.referrer || "").startsWith("android-app://");
  if (app || !/^#(r|d|s|t)=/.test(location.hash)) return;
  try { if (sessionStorage.getItem("inst-off")) return; } catch {}
  if (!(ios || (android && PLAY_LIVE))) return;
  const el = document.createElement("div"); el.className = "instbar";
  el.innerHTML = ios
    ? `<span>📲 <b>Tip:</b> tocá <b>Compartir</b> ⬆️ y <b>Agregar a pantalla de inicio</b> para jugar como app y no perder tu progreso.</span><button type="button" aria-label="Cerrar">✕</button>`
    : `<span>📲 Instalá <b>Juegos mentales</b> para jugar el duelo mejor.</span><a href="${PLAY_URL}">Google Play</a><button type="button" aria-label="Cerrar">✕</button>`;
  el.querySelector("button").onclick = () => { el.remove(); try { sessionStorage.setItem("inst-off", "1"); } catch {} };
  document.body.appendChild(el);
})();
