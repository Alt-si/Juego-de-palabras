"use strict";
// ¿Qué ves?: enigmas de 2 o 3 imágenes (emojis). Hay que descubrir qué palabra o frase (1 a 3 palabras) las relaciona.
// Formato: dificultad(1-4) | imágenes separadas por espacio | respuesta. Los encabezados «# Rubro» agrupan.
const ENIG_RAW = `
# Palabra compuesta
2|🛑 💧|paraguas
2|🔄 ☀️|girasol
2|🔓 🥫|abrelatas
1|🛑 ☀️|parasol
2|🛑 ⚡|pararrayos
2|🆘 ❤️|salvavidas
2|✂️ 💅|cortauñas
2|🎶 💿|tocadiscos
2|🏢 ☁️|rascacielos
2|🕛 🌙|medianoche
2|🕛 ☀️|mediodía
2|⬆️ 🔊|altavoz
3|😱 🐦|espantapájaros
2|🍽️ 🧼|lavaplatos
2|🧼 👕|lavarropas
3|🏹 👁️|arcoíris
# Frase hecha
1|🌙 🍯|luna de miel
2|❤️ 🥇|corazón de oro
2|👁️ 🦅|ojo de águila
3|🍞 😋|pan comido
2|🤕 💊|dolor de cabeza
2|💡 🟢|luz verde
3|⏳ 💰|tiempo es oro
2|🕔 🚗|hora pico
2|🌍 🔄|vuelta al mundo
3|🩹 🆘|primeros auxilios
2|💧 🍬|agua dulce
3|🦶 🏃|pie de atleta
3|✋ 👷|mano de obra
2|👁️ ↔️ 👁️|ojo por ojo
3|👅 🤟|lengua de señas
2|🙌 ⬆️|manos arriba
3|😐 🃏|cara de póker
2|⏱️ 🔢 🚀|cuenta regresiva
3|🪂 ⬇️|caída libre
2|🌙 🎄|nochebuena
2|🎅 🛷|papa noel
3|🌲 ⭐ 🎁|árbol de navidad
# Película o serie
1|🦁 👑|el rey león
2|🔍 🐠|buscando a nemo
1|🤠 🚀 🧸|toy story
2|🕷️ 👨|hombre araña
1|🧙 ⚡ 👓|harry potter
1|❄️ 👸 ⛄|frozen
2|🐀 👨‍🍳 🧀|ratatouille
1|🚢 🧊 💔|titanic
2|🦖 🌴 🥚|jurassic park
1|🐘 🎪|dumbo
1|🦈 🌊|tiburón
2|🏴‍☠️ 🦜 🌊|piratas del caribe
1|🧜‍♀️ 🦀|la sirenita
1|🏎️ ⚡ 🏁|cars
2|🚗 ⚡ ⏰|volver al futuro
2|🕶️ 💊 💻|matrix
2|⭐ ⚔️ 🚀|star wars
2|🦍 🏙️|king kong
3|🐼 🥋|kung fu panda
2|🧚 🏴‍☠️ 🐊|peter pan
3|🎩 🍫 🏭|willy wonka
2|🧙 🐉 💍|el hobbit
# Cuento
1|🧒 🔴 🐺|caperucita roja
2|3️⃣ 🐷 🏠|los tres chanchitos
1|🤥 🪵 👃|pinocho
1|👠 🎃 🕛|cenicienta
2|🧞 🪔|aladino
2|🦆 🦢|el patito feo
3|👱‍♀️ 🐻 🥣|ricitos de oro
2|👑 🌹 🦊|el principito
2|🍎 👸 🧙|blancanieves
2|🥖 🏠 🍬|hansel y gretel
2|👸 🐸|el príncipe rana
2|🧚 💤 🏰|la bella durmiente
2|🐺 🏠 🌬️|el lobo feroz
2|🐢 🐇 🏁|liebre y tortuga
3|🐜 🎻|cigarra y hormiga
# Comida y bebida
2|🐶 🔥|perro caliente
1|🍕 🧀 🍅|pizza
1|🍞 🧀 🥓|sándwich
3|🥔 🥚 🍳|tortilla de papas
3|🍫 🥛 ☕|chocolatada
2|🍓 🥛 🍦|helado
2|🍇 🍷|vino
2|🍝 🍅 🧀|fideos
3|🥔 🍟 🍔|comida rápida
2|🌽 🍿|pochoclo
2|🍫 🍌 🍨|banana split
2|🍯 🐝|miel
3|🍋 💧 🍬|limonada
3|🥬 🍅 🥕|ensalada
2|🍞 🧈 ☕|merienda
2|🥞 🍯|panqueque
3|🍏 🥧|tarta de manzana
2|🍳 🥓|huevos con panceta
# Profesión
1|🔥 🚒 👨‍🚒|bombero
2|🍞 🥖 🌾|panadero
2|🔧 🚗 🛢️|mecánico
1|✈️ 👨‍✈️|piloto
2|🎓 📚 👩‍🏫|maestra
2|⚖️ 📜 🗣️|abogado
2|🥕 🔪 👨‍🍳|cocinero
1|📸 📷 🎞️|fotógrafo
2|🚓 👮 🚨|policía
3|🔬 🧪 👨‍🔬|científico
2|🌾 🚜 👨‍🌾|granjero
2|💈 ✂️|peluquero
3|🏗️ 👷 📐|arquitecto
2|📰 🎤 📝|periodista
3|💻 ⌨️ 👨‍💻|programador
2|🐶 💉 🩺|veterinario
2|👨‍🚀 🌕 🚀|astronauta
# Ciudad o país
1|🗼 🥖 🌹|parís
2|🗽 🍎|nueva york
2|🗿 🏝️|isla de pascua
2|🍕 🏛️ 🍝|roma
2|🎡 🕰️ 🌧️|londres
2|🥋 🌸 🍣|japón
2|🐨 🦘|australia
2|🐫 🔺 ☀️|egipto
2|🏔️ 🧀 ⏰|suiza
2|⚽ 🎭 🏖️|brasil
1|💃 🐂 🥘|españa
2|🌮 🌵 🎺|méxico
3|🍷 🏔️ 🍇|mendoza
3|🛶 🏙️ 🌷|ámsterdam
3|🎻 🏰 🎼|viena
3|🌉 🚋 🌫️|san francisco
3|🎬 🌴 ⭐|hollywood
3|🚤 🏛️ 🎭|venecia
# Deporte
2|🏊 🚴 🏃|triatlón
2|⛸️ 🏒 🥅|hockey sobre hielo
1|⚽ 🥅|gol
2|🏀 🎯|básquet
1|🎾 🏆|tenis
2|🥊 🔔|boxeo
2|🏎️ 🏁 🔧|fórmula uno
2|🏉 🤼 🏟️|rugby
2|⛳ 🏌️|golf
3|🏓 🎾 🏸|deportes de raqueta
2|🚴 🏔️|ciclismo
3|🤸 🥇 🎀|gimnasia
2|🏄 🌊 🏝️|surf
3|🏁 ⏱️ 🥇|carrera
# Fiesta
1|🎂 🎈 🎁|cumpleaños
2|💍 👰 🤵|casamiento
1|🎄 🎅 🎁|navidad
2|🎃 👻 🍬|halloween
2|🎆 🥂 🕛|año nuevo
3|🥚 🐰 🍫|pascuas
2|🎓 🎉 📜|graduación
2|🎵 💃 🕺|baile
3|🍾 🥳 🎊|festejo
3|🎊 🎭 🥁|carnaval
2|🍫 💘 🌹|san valentín
3|🥳 🎤 🎶|karaoke
# Argentina
1|🥩 🔥 🍷|asado
1|🧉 🌿 💧|mate
2|🍬 🥛 🍮|dulce de leche
1|🍪 🍫 🥛|alfajor
1|🥟 🧀 🥩|empanada
2|🌭 🥖 🔥|choripán
2|💃 🕺 🌹|tango
2|🐎 🧉 🤠|gaucho
3|🌽 🥘 🌿|locro
3|🥃 🥤 🧊|fernet con coca
3|🏟️ 🍫|bombonera
3|🏠 🌸 🏛️|casa rosada
2|🐄 🥩 🌾|pampa
3|🐋 🌊 🐧|península valdés
# Cosas de todos los días
2|🏖️ ☀️ 🍹|vacaciones
1|❄️ 🧣 ☕|invierno
1|🌸 🐝 🌷|primavera
1|🍂 🍁 🌧️|otoño
1|📚 ✏️ 🎒|escuela
1|✈️ 🧳 🌍|viaje
2|🛏️ 🌙 💤|dormir
2|🍳 🥓 ☕|desayuno
2|🛒 🥦 🥛|supermercado
1|💰 🏦 💳|banco
1|💊 🏥 🚑|hospital
1|🌧️ ☔ 🌂|lluvia
1|🎬 🍿 🎟️|cine
2|🏋️ 🚴|gimnasio
2|🚦 🚗 🚸|tránsito
1|🌙 ⭐ 🦉|noche
2|☀️ 🌅 🐓|amanecer
2|🏠 🔑 🏷️|alquiler
2|🐶 🐱 🐹|mascotas
2|🌷 🌳 ⛲|jardín
2|🎒 🏕️ 🔥|campamento
2|📅 ⏰ 📝|agenda
1|🧼 🚿 🛁|baño
2|👗 👠 👜|moda
1|🎤 🎶 🎧|música
2|🎨 🖌️ 🖼️|pintura
3|🔬 🧪 🧫|laboratorio
2|🏛️ 🏺 🗿|museo
2|🐓 🐄 🚜|granja
1|🌊 🏖️ 🐚|playa
2|🎓 📚|universidad
2|🏆 🥇 🏅|campeón
2|🏔️ 🥾|montaña
3|📱 💬 📞|comunicación
# Tecnología
2|📱 🤳 📸|celular
1|💻 🖱️ ⌨️|computadora
2|📶 🌐 💻|internet
2|🔋 🔌 ⚡|energía
3|🤖 🧠 💬|inteligencia artificial
2|🎮 🕹️ 👾|videojuego
2|📺 📡 🛋️|televisión
3|📧 ✉️ 💻|correo
# Naturaleza
2|🌋 🔥 🪨|volcán
2|🌪️ 💨 🏚️|tornado
1|🌳 🌲 🌿|bosque
2|🏜️ 🌵 ☀️|desierto
3|🌊 🌙 🏖️|marea
2|🌌 🔭 ⭐|universo
2|🌱 💧 ☀️|planta
4|🐝 🌻 🍯|polinización
2|🍃 🌬️|viento
# Animales
2|🐘 🧠|memoria de elefante
2|🦇 🌙 🏰|murciélago
3|🐜 🐜 🐜|hormiguero
3|🐝 🐝 🏠|colmena
3|🐺 🌕|lobo
2|🐧 ❄️|pingüino
3|🐟 🐟 🌊|cardumen
3|🐑 🐑 🐑|rebaño
2|🐦 🌳 🥚|nido
`;
const ENIG = [];
function enigParse(raw) {
  let rub = "";
  for (const l of raw.split("\n")) {
    const s = l.trim(); if (!s) continue;
    if (s[0] === "#") { rub = s.slice(1).trim(); continue; }
    const p = s.split("|"); if (p.length < 3) continue;
    ENIG.push({ t: +p[0] || 1, rub, img: p[1].trim().split(/\s+/), w: p[2].trim() });
  }
}
enigParse(ENIG_RAW);
