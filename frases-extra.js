// Más refranes y dichos para "Frases encriptadas" (se suman a frases.js sin repetir).
(function () {
  const extra = `A falta de pan buenas son tortas
A quien madruga Dios lo ayuda
Al mal tiempo buena cara
Aunque la mona se vista de seda mona se queda
Barriga llena corazón contento
Bien está lo que bien acaba
Cría cuervos y te sacarán los ojos
Cuando el río suena agua lleva
De tal palo tal astilla
Del dicho al hecho hay mucho trecho
Donde manda capitán no manda marinero
El hábito no hace al monje
El que mucho abarca poco aprieta
El que ríe último ríe mejor
El ojo del amo engorda al caballo
En boca cerrada no entran moscas
En casa de herrero cuchillo de palo
Entre dos que se pelean el que se mete se lleva la peor parte
Genio y figura hasta la sepultura
La curiosidad mató al gato
La esperanza es lo último que se pierde
La unión hace la fuerza
La práctica hace al maestro
Lo barato sale caro
Lo que abunda no daña
Los trapos sucios se lavan en casa
Mal de muchos consuelo de tontos
Más sabe el diablo por viejo que por diablo
Más vale pájaro en mano que cien volando
Más vale prevenir que curar
Nadie es profeta en su tierra
No dejes para mañana lo que puedas hacer hoy
No por mucho madrugar amanece más temprano
No todo lo que brilla es oro
Ojo por ojo diente por diente
Piensa mal y acertarás
Quien a buen árbol se arrima buena sombra lo cobija
Quien algo quiere algo le cuesta
Quien bien te quiere te hará llorar
Quien calla otorga
Quien canta sus males espanta
Quien mucho duerme poco aprende
Quien no llora no mama
Quien tiene boca se equivoca
Quien tiene un amigo tiene un tesoro
Rio revuelto ganancia de pescadores
Sobre gustos no hay nada escrito
Tanto va el cántaro a la fuente que al fin se rompe
Todos los caminos llevan a Roma
Una golondrina no hace verano
Una imagen vale más que mil palabras
Un clavo saca otro clavo
Uno propone y Dios dispone
Zapatero a tus zapatos
A Dios rogando y con el mazo dando
A lo hecho pecho
A palabras necias oídos sordos
Agua que no has de beber déjala correr
Al César lo que es del César
Año de nieves año de bienes
Cada loco con su tema
Cada oveja con su pareja
Cuentas claras conservan la amistad
De noche todos los gatos son pardos
Del árbol caído todos hacen leña
Dios aprieta pero no ahorca
El amor es ciego
El que se fue a Sevilla perdió su silla
El tiempo es oro
El que avisa no traiciona
El pez grande se come al chico
En el país de los ciegos el tuerto es rey
Es mejor tarde que nunca
Lo prometido es deuda
Lo que se hereda no se hurta
Los años no vienen solos
Más ven cuatro ojos que dos
Mucho ruido y pocas nueces
Ni tanto que queme al santo ni tan poco que no lo alumbre
No hay peor sordo que el que no quiere oír
No hay rosa sin espinas
No hay peor ciego que el que no quiere ver
No se ganó Zamora en una hora
Nunca es tarde si la dicha es buena
Obras son amores y no buenas razones
Panza llena corazón contento
Pueblo chico infierno grande
Quien da primero da dos veces
Quien mal anda mal acaba
Quien parte y reparte se queda con la mejor parte
Si quieres paz prepárate para la guerra
Siempre llueve sobre mojado
Sin pan ni vino no se hace el camino
Una mano lava la otra y las dos lavan la cara
Vísteme despacio que estoy apurado
Ya que estamos en el baile bailemos
La suerte de la fea la linda la desea
Las cuentas claras y el chocolate espeso
Los amigos se conocen en las malas
Cuando una puerta se cierra otra se abre
La vida es una caja de sorpresas
Después de la tormenta llega la calma
Gota a gota se llena el vaso
Rodando se encuentran los melones
Poco a poco se anda lejos
Ande o no ande caballo grande
A cada chancho le llega su San Martín
Al pan pan y al vino vino
Al que no quiere caldo se le dan dos tazas
El que nace barrigón ni que lo fajen chiquito
Tiene la sartén por el mango
Hacer la vista gorda
Hablando se entiende la gente
Se hace camino al andar
Nadie sabe lo que tiene hasta que lo pierde
La excepción confirma la regla
La ocasión hace al ladrón
Lo cortés no quita lo valiente
Ver para creer
Pan para hoy hambre para mañana
Amor con amor se paga
Cuando el gato no está los ratones bailan
Con paciencia y con calma se sube una palma
Mejor solo que mal acompañado
Hecha la ley hecha la trampa
Dos cabezas piensan mejor que una
Vale más una verdad que mil mentiras
Los que callan no siempre otorgan
Haz el bien sin mirar a quién
Cada cual cosecha lo que siembra
La mejor defensa es un buen ataque
No hay mejor maestra que la experiencia
Detrás de la tormenta sale el sol
Con la vara que midas serás medido
Hay que dar tiempo al tiempo`.split("\n");
  const n = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-zñ]/g, "");
  const have = new Set(FRASES_RAW.map((x) => n(x.split("|")[0])));
  for (const t of extra) { const k = n(t); if (k && !have.has(k)) { have.add(k); FRASES_RAW.push(t + "|Refrán"); } }
})();
