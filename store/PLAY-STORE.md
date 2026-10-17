# Publicar «Juegos mentales» en Google Play

## 1. Cuenta de desarrollador (la hacés vos)
- https://play.google.com/console → crear cuenta de desarrollador (pago único de USD 25) y verificar identidad.
- Si es cuenta **personal** nueva: Google exige una **prueba cerrada con 12 testers durante 14 días seguidos** antes de poder publicar en producción. Conviene juntar 12 mails de amigos desde ya.

## 2. Requisito de dominio (para que no se vea la barra del navegador)
La app vive en https://alt-si.github.io/Juego-de-palabras/ (subcarpeta). El archivo de verificación `assetlinks.json` tiene que estar en la RAÍZ del dominio:
`https://alt-si.github.io/.well-known/assetlinks.json`
→ Hay que crear un repo nuevo llamado **alt-si.github.io** (lo creás vos) con Pages activado. Yo preparo el contenido cuando tengamos la huella SHA-256 de la firma (paso 4).

## 3. Generar el paquete (.aab)
Opción más simple: https://www.pwabuilder.com → pegar la URL de la app → «Package for stores» → Android → **Google Play**.
- Package ID sugerido: `io.github.altsi.juegosmentales` (no se puede cambiar después)
- App name: Juegos mentales · Launcher name: Juegos mentales
- Dejar activadas las notificaciones/ubicación en OFF; signing key: «Create new» y **guardar el .keystore y las contraseñas** (si se pierde no se puede actualizar la app). Con Play App Signing, lo que importa es la huella que muestra Play Console.
Se descarga un .zip con el .aab y la clave.

## 4. Huella SHA-256
Play Console → tu app → Configuración → Integridad de la app → Firma de apps → copiar «SHA-256 del certificado de firma de la clave de firma». Pasámela y armo el assetlinks.json.

## 5. Ficha de Play Store (textos listos abajo)
- Ícono: store/icono-512.png · Gráfico destacado: store/grafico-destacado-1024x500.png · Capturas: store/captura-1..5.png (1080x1920)
- Política de privacidad: https://alt-si.github.io/Juego-de-palabras/privacidad.html (completar el email antes)
- Categoría: Juegos → Palabras (o Puzzle). Sin anuncios. Gratis.

### Nombre (máx. 30)
Juegos mentales

### Descripción breve (máx. 80)
Anagramas, adivinanzas, frases y Tutti Frutti con niveles sin fin y duelos.

### Descripción completa
Entrená tu cabeza con seis juegos de palabras e ingenio, con 1000 niveles y más:
🔤 Anagrama: ordená las letras contrarreloj.
🔍 Palabras escondidas: encontrá todas en la grilla.
🕵️ Adivina: 100 categorías, cuantas menos pistas uses, más puntos. ¡Podés responder con tu voz!
🔐 Frases encriptadas: descubrí refranes y frases célebres.
🖼️ ¿Qué ves?: adiviná la palabra de la imagen, con giros y desafíos.
📝 Tutti Frutti: elegí categorías y competí contra un amigo.
⚔ Duelos en vivo o por link, en series de 1, 3, 5 o 10 partidas: gana quien sume más.
🏆 21 rangos, logros, premio diario, temas de color y niveles interminables.
Sin registro, sin anuncios y sin conexión (salvo duelos y voz).

## 6. Formularios de Play Console
- Anuncios: No contiene anuncios.
- Clasificación de contenido (IARC): juego de palabras, sin violencia ni contenido sensible → apta para todos. Hay chat/interacción entre usuarios: NO (solo puntajes).
- Seguridad de los datos: no recopila datos que salgan del dispositivo hacia nosotros; micrófono lo usa el reconocimiento de voz del sistema (no se guarda audio); duelos en vivo usan un servicio de terceros (PeerJS) que ve IPs → declarar «Datos compartidos: ninguno recopilado por la app»; consultar si se prefiere declarar IP como compartida por precaución.
- Público objetivo: 13+ o todo público (si elegís menores de 13 aparecen requisitos extra de Familias).
- Permisos: la app web no declara permisos; el micrófono se pide en tiempo de uso.
- Apps de gobierno / finanzas / salud: No.

## 7. Prueba cerrada → producción
Subir el .aab a «Pruebas cerradas», agregar los 12 testers, esperar 14 días, solicitar acceso a producción.

## 8. Duelos entre Android e iPhone
- Los links de desafío (`#d=`, `#s=`, `#t=`, `#r=`) funcionan en cualquier navegador; no hace falta instalar nada.
- **Android con la app instalada**: el link se abre directo en la app (requiere el assetlinks.json del paso 2).
- **Android sin la app**: se abre en Chrome y, cuando la app esté publicada, muestra un aviso con botón a Google Play → en `instalar.js` poner `PLAY_LIVE = true` (y confirmar `PLAY_ID` con el Package ID real).
- **iPhone/iPad**: se juega en Safari; aparece un aviso para «Agregar a pantalla de inicio». Importante: Safari puede borrar los datos de sitios web no instalados tras ~7 días sin uso, por eso se recomienda agregarla al inicio.
- Todo mensaje de invitación termina con: «Android: bajá la app en Google Play · iPhone: abrí el link en Safari».
