"use strict";
// Más enigmas para ¿Qué ves? (ver enigmas.js para el formato).
enigParse(`
# Película o serie
2|👻 🔫 🚫|cazafantasmas
1|🦇 🌃 🃏|batman
2|🛡️ ⭐ 💪|capitán américa
3|🐉 👑 ⚔️|juego de tronos
2|🐭 🎩 🏰|mickey mouse
1|🧽 🍍 🌊|bob esponja
2|🏠 👨‍👩‍👧‍👦 🍩|los simpson
3|🧊 🐿️ 🌰|era del hielo
2|🕵️ 🔎 🎩|sherlock holmes
# Personaje o famoso
1|⚽ 🔟 🐐|messi
2|🍎 🌳 ⬇️|newton
3|🎨 👂 🌻|van gogh
2|🧛 🦇 🏰|drácula
# Lugar
2|🛒 🏬 👕|shopping
2|🚆 🎫 🕐|estación
2|✈️ 🧳 🛄|aeropuerto
3|⛽ 🚗 🏪|estación de servicio
1|🍺 🎶 🍟|bar
2|⛪ 🔔 🕯️|iglesia
2|🏰 👑 🛡️|castillo
2|📚 🤫 🪑|biblioteca
1|🏟️ ⚽ 📣|estadio
3|🎢 🎡 🍭|parque de diversiones
2|🦁 🐘 🦒|zoológico
2|🍞 🥐 🥖|panadería
1|🌳 🦆 🚲|parque
1|🏨 🛎️ 🧳|hotel
# Objeto
2|⏰ 🛏️ 🔔|despertador
1|🔑 🚪 🏠|llave
2|🔦 🌑 🔋|linterna
3|🧭 ⛰️ 🗺️|brújula
2|👓 🕶️ 👀|anteojos
2|🧦 👟 🧶|medias
2|🔨 🧰 🔧|herramientas
1|⌚ ⏳ 🕰️|reloj
3|🦆 🛁|patito de goma
1|🕯️ 🎂 🔥|vela
2|🧲 🔩 🧱|imán
3|🧴 ☀️ 🏖️|protector solar
2|📦 🚚 📬|paquete
1|🍼 👶 😴|bebé
# Música y arte
1|🎸 🥁 🎤|banda
2|🎻 🎺 🎼|orquesta
# Sentimiento o idea
2|😢 💧 💔|tristeza
2|😡 🔥 👊|enojo
1|😱 👻 🌑|miedo
1|😍 ❤️ 💌|amor
1|🤔 💡 🧠|idea
2|⏰ 🏃 😰|apuro
1|💤 😴 🛌|sueño
3|🎓 🧠 📖|sabiduría
1|💪 🏋️ 🥇|fuerza
3|🐢 🕰️ 🧓|paciencia
2|🍀 🎲 🎰|suerte
1|😂 🤣 🎭|risa
1|👭 🤝 ❤️|amistad
1|👴 👵 ❤️|abuelos
1|👨‍👩‍👧 🏠 ❤️|familia
2|🤝 💼 💰|negocio
1|🕊️ 🌍|paz
# Pareja de opuestos o compañeros
1|🌙 ☀️|día y noche
2|🔥 💧|fuego y agua
2|🐶 🐱 ⚡|perro y gato
2|✌️ ❤️ 🌸|paz y amor
2|☀️ 🌧️|sol y lluvia
# Ciencia y sociedad
3|♻️ 🗑️ 📦|reciclaje
3|🌞 🔋 🏠|energía solar
3|🌍 💥 🏚️|terremoto
2|⚓ 🚢 🏗️|puerto
2|🗺️ ❌ 💰|tesoro
2|🌬️ ⛵ 🌊|velero
3|🔭 🪐 🌌|astronomía
4|🧬 🧪 👶|genética
3|⚖️ 🏛️ 👨‍⚖️|justicia
3|📈 💵 🏦|economía
3|🗳️ 🏛️ 🤝|elecciones
4|📜 🖋️ ⚖️|constitución
3|🛰️ 🌍 📡|satélite
3|🧩 🧠 🤔|rompecabezas
3|💻 🕵️ 🔓|hacker
3|🛸 👽 🌌|extraterrestre
3|🧛 🐺 🧟|monstruos
# Comida y bebida
3|🍷 🧀 🍇|vino y queso
3|🥢 🍜 🏮|comida china
2|🌮 🌶️ 🥑|tacos
2|🍣 🥢 🍚|sushi
2|🍅 🧅 🌶️|salsa
3|🐔 🍗 🍟|pollo frito
1|🍔 🍟 🥤|hamburguesa
# Deporte
2|⚽ 🏆 🌍|mundial
3|🏅 🔥 🏟️|juegos olímpicos
2|🥇 🥈 🥉|podio
2|🎽 👟 ⏱️|maratón
2|🏐 🏖️ 🏆|vóley
2|⚾ 🧢 🥎|béisbol
3|🏹 🎯 🥇|tiro con arco
2|🛹 🏙️ 🤸|skate
2|🎿 ⛷️ 🏔️|esquí
2|🤼 🥋 🥇|lucha
2|🤿 🐠 🌊|buceo
3|🏇 🐎 🎩|equitación
2|🚣 🛶 🌊|remo
# Argentina
3|🌽 🧀 🥘|humita
2|🥩 🍞 🍋|milanesa
4|🍕 🧅 🧀|fugazzeta
2|🥐 ☕ 🌙|medialuna
2|🚌 🛑 👥|colectivo
3|🥩 🔪 🔥|parrilla
# Fiesta
1|🎁 🎀 💝|regalo
`);
