# Anagrama

Menú con tres juegos: **Anagrama** (ordená las letras), **Adivina** (10 pistas: cuantas menos uses, más puntos) y **Palabras escondidas** (hay letras de más; a los 10 s finales se marcan las que lleva la palabra).

Primer juego: ordená las letras y encontrá la palabra. PWA estática (HTML/CSS/JS), funciona sin conexión y se instala en el celular.

- Niveles de 10 palabras cada vez más largas; tiempo por palabra, 3 vidas.
- Premios: monedas, estrellas (1–3), rachas, logros, premio diario, tienda de temas y vida extra.
- Duelo en vivo: los dos juegan a la vez y ven el avance del otro (conexión directa WebRTC con PeerJS, sin servidor propio; la lib se carga desde jsDelivr).
- Duelos: desafiá a un amigo por link (WhatsApp, etc.); juegan las mismas 10 palabras y gana quien sume más puntos. Sin servidor: el link lleva la semilla y tu puntaje.
- Progreso guardado en el dispositivo (localStorage).

Publicar: Settings → Pages → Branch `main` / root.

## Contenido largo y progresión
- **Adivina**: 100 categorías (~1.175 palabras), niveles ilimitados; la dificultad sube con el nivel (palabras más difíciles, más puntos para pasar).
- **Anagrama / Palabras escondidas**: niveles ilimitados, palabras más largas, menos tiempo y más letras de relleno a medida que avanzás.
- **Fondos por nivel**: cada mundo (Anagrama/Escondidas) y cada escena de misterio (Adivina, con signo de pregunta) cambia al subir de nivel. Son ilustraciones SVG generadas, no fotos.

## Frases encriptadas
~300 frases famosas (refranes, citas, cine, deporte). Cada letra se oculta tras un número, un objeto o un color (al azar en cada frase). Cuatro dificultades elegibles desde el menú (Fácil, Medio, Difícil, Experto): cambia el largo de las frases y cuántas letras te regalan; en cada nivel la ronda de 5 frases se vuelve más exigente. Puntaje propio del juego.
