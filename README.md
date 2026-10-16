# Anagrama

Menú con dos juegos: **Anagrama** (ordená las letras) y **Palabras escondidas** (hay letras de más; a los 10 s finales se marcan las que lleva la palabra).

Primer juego: ordená las letras y encontrá la palabra. PWA estática (HTML/CSS/JS), funciona sin conexión y se instala en el celular.

- Niveles de 10 palabras cada vez más largas; tiempo por palabra, 3 vidas.
- Premios: monedas, estrellas (1–3), rachas, logros, premio diario, tienda de temas y vida extra.
- Duelo en vivo: los dos juegan a la vez y ven el avance del otro (conexión directa WebRTC con PeerJS, sin servidor propio; la lib se carga desde jsDelivr).
- Duelos: desafiá a un amigo por link (WhatsApp, etc.); juegan las mismas 10 palabras y gana quien sume más puntos. Sin servidor: el link lleva la semilla y tu puntaje.
- Progreso guardado en el dispositivo (localStorage).

Publicar: Settings → Pages → Branch `main` / root.
