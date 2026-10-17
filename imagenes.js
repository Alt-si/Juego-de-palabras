// "¿Qué ves?": imagen (emoji) y la palabra que la nombra, en español rioplatense. Formato "emoji|palabra".
const IMAGENES_RAW = [
"🐶|perro","🐱|gato","🐭|ratón","🐹|hámster","🐰|conejo","🦊|zorro","🐻|oso","🐼|panda","🐨|koala","🐯|tigre","🦁|león","🐮|vaca","🐷|cerdo","🐸|rana","🐵|mono","🐔|gallina","🐧|pingüino","🐦|pájaro","🦆|pato","🦅|águila",
"🦉|búho","🦇|murciélago","🐺|lobo","🐗|jabalí","🐴|caballo","🦄|unicornio","🐝|abeja","🐛|oruga","🦋|mariposa","🐌|caracol","🐞|mariquita","🐜|hormiga","🦟|mosquito","🕷️|araña","🦂|escorpión","🐢|tortuga",
"🐍|serpiente","🦎|lagarto","🦖|dinosaurio","🐙|pulpo","🦑|calamar","🦐|camarón","🦀|cangrejo","🐠|pez","🐬|delfín","🐳|ballena","🦈|tiburón","🐊|cocodrilo","🐆|leopardo","🦓|cebra","🦍|gorila","🐘|elefante",
"🦛|hipopótamo","🦏|rinoceronte","🐪|camello","🦒|jirafa","🦘|canguro","🐂|toro","🐑|oveja","🐐|cabra","🦌|ciervo","🦃|pavo","🕊️|paloma","🦢|cisne","🦩|flamenco","🦜|loro","🐓|gallo","🐣|pollito","🦔|erizo",
"🐿️|ardilla","🐀|rata","🐉|dragón","🍎|manzana","🍐|pera","🍊|naranja","🍋|limón","🍌|banana","🍉|sandía","🍇|uvas","🍓|frutilla","🍈|melón","🍒|cerezas","🍑|durazno","🥭|mango","🍍|ananá","🥥|coco","🥝|kiwi",
"🍅|tomate","🍆|berenjena","🥑|palta","🥦|brócoli","🥒|pepino","🌶️|ají","🌽|choclo","🥕|zanahoria","🥔|papa","🍠|batata","🧄|ajo","🧅|cebolla","🍄|hongo","🥜|maní","🍞|pan","🥐|medialuna","🧀|queso","🥚|huevo",
"🥓|panceta","🥩|carne","🌭|pancho","🍔|hamburguesa","🍕|pizza","🌮|taco","🥗|ensalada","🍣|sushi","🍦|helado","🍩|dona","🍪|galleta","🎂|torta","🍫|chocolate","🍬|caramelo","🍭|chupetín","🍯|miel","🥛|leche","☕|café",
"🍺|cerveza","🍷|vino","🧃|jugo","🍿|pochoclo","🧂|sal","⌚|reloj","📱|celular","💻|computadora","⌨️|teclado","📷|cámara","📺|televisor","📻|radio","🔦|linterna","💡|lamparita","🔋|pila",
"🔑|llave","🔒|candado","🔨|martillo","✂️|tijera","📌|chinche","📎|clip","📖|libro","📚|libros","✏️|lápiz","🖊️|lapicera","📏|regla","🔍|lupa","🔭|telescopio","🔬|microscopio","💊|pastilla","💉|jeringa",
"🌡️|termómetro","🧲|imán","🪑|silla","🛏️|cama","🚪|puerta","🛁|bañera","🚿|ducha","🚽|inodoro","🧼|jabón","🧽|esponja","🧹|escoba","🔔|campana","🎁|regalo","🎈|globo","🎸|guitarra","🎹|piano",
"🥁|tambor","🎺|trompeta","🎻|violín","🎤|micrófono","🎧|auriculares","⚽|pelota","🏀|básquet","⚾|béisbol","🎾|tenis","🏐|vóley","🎲|dado","♟️|ajedrez","🧩|rompecabezas","👓|anteojos","👑|corona","💍|anillo",
"👜|cartera","🎒|mochila","👞|zapato","👟|zapatilla","👢|bota","🧢|gorra","🎩|sombrero","👕|remera","👖|pantalón","👗|vestido","🧦|medias","🧤|guantes","🧣|bufanda","☂️|paraguas","💼|maletín","🛒|carrito",
"💎|diamante","🔥|fuego","💧|gota","⭐|estrella","🌙|luna","☀️|sol","☁️|nube","⚡|rayo","🌈|arcoíris","🌊|ola","🌋|volcán","🌵|cactus","🌴|palmera","🌲|pino","🌻|girasol","🌹|rosa",
"🌷|tulipán","🍀|trébol","🏠|casa","🏰|castillo","⛪|iglesia","🏥|hospital","🏫|escuela","🏭|fábrica","⛺|carpa","🌉|puente","🚗|auto","🚕|taxi","🚌|colectivo","🚓|patrullero","🚑|ambulancia","🚜|tractor",
"🚲|bicicleta","🏍️|moto","🚆|tren","✈️|avión","🚁|helicóptero","🚀|cohete","⛵|velero","🚢|barco","⚓|ancla","🚦|semáforo","🛴|monopatín","👁️|ojo","👂|oreja","👃|nariz","👄|boca","🦷|diente",
"🦴|hueso","🧠|cerebro","✋|mano","🦵|pierna","🦶|pie","👶|bebé","💀|calavera","👻|fantasma","👽|alien","🤖|robot","🧙|mago","🧛|vampiro","🧟|zombi","🧜|sirena","🧚|hada","💣|bomba",
"🏆|trofeo","🥇|medalla","🎨|paleta","⛏️|pico","🪓|hacha","🗡️|espada","🛡️|escudo","🧭|brújula","🗺️|mapa","📅|calendario","📬|buzón","✉️|sobre","📦|caja","⚖️|balanza","🧱|ladrillo","🪜|escalera",
"🕯️|vela","🍼|mamadera","🎃|calabaza"
];
