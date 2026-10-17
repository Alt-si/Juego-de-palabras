const V="anagrama-v11",SHELL=["./","index.html","styles.css","words.js","clues.js","adivina.js","adivina-1.js","adivina-2.js","adivina-3.js","adivina-4.js","adivina-5.js","frases.js","cripto.js","quever.js","imagenes.js","scenes.js","game.js","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
