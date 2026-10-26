const V="anagrama-v50",SHELL=["./","index.html","styles.css","words.js","words-extra.js","clues.js","adivina.js","adivina-1.js","adivina-2.js","adivina-3.js","adivina-4.js","adivina-5.js","adivina-6.js","adivina-7.js","adivina-8.js","adivina-9.js","adivina-10.js","adivina-11.js","adivina-12.js","frases.js","frases-extra.js","cripto.js","enigmas.js","enigmas-2.js","quever.js","duelos.js","serie.js","diario.js","voz.js","frutti-data.js","frutti-data2.js","frutti.js","aprende.js","instalar.js","privacidad.html", "scenes.js","progreso.js","game.js","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!=="dly-state").map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});

// Aviso diario de la palabra del día (solo si el jugador lo activó; se omite si ya la resolvió hoy)
self.addEventListener("periodicsync",e=>{if(e.tag!=="palabra-del-dia")return;e.waitUntil((async()=>{
  const hoy=new Date(Date.now()-3*3600e3).toISOString().slice(0,10);
  try{const c=await caches.open("dly-state"),r=await c.match("hoy");if(r&&(await r.text())===hoy)return}catch{}
  await self.registration.showNotification("🧩 Palabra del día",{body:"¿Podés descubrir la palabra escondida de hoy?",icon:"icons/icon-192.png",badge:"icons/icon-192.png",tag:"palabra-del-dia",data:{url:"./#dia"}})})())});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(cs=>{
  for(const c of cs){if("focus" in c){c.postMessage({go:"dia"});return c.focus()}}
  return clients.openWindow("./#dia")}))});
