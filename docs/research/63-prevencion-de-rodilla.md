# Prevención de rodilla en los deportes de giro

**Fecha:** 19/09/2026. **Tanda:** T5b del plan de variables. Sigue a `62`, que armó la
infraestructura de la prevención por deporte con los isquios.

## La pregunta

En los deportes con giros, cambios de dirección y saltos, la lesión que más cuesta es la rotura del
ligamento cruzado anterior. ¿Qué parte de su prevención se puede hacer en el gimnasio, con qué
dosis, y qué pasa en temporada y cerca del partido?

## Lo que dice la evidencia

Los resúmenes se leyeron en Europe PMC. El texto completo de Sugimoto 2014 se leyó en PMC.

- **Huang et al. 2020**, *Am J Sports Med*, metaanálisis de **8 ensayos aleatorizados** de alta
  calidad, controlando el tiempo de exposición y los conglomerados: los programas de prevención
  bajan las roturas de ligamento cruzado un **53 %** (IRR 0,47; 0,30-0,73). DOI
  10.1177/0363546519870175.
- **Watson et al. 2026**, *Am J Sports Med*, 18 estudios con 25.166 deportistas de handball, fútbol,
  básquet y vóley (más del 85 % mujeres, edad media 19): RR **0,46** (0,36-0,57). DOI
  10.1177/03635465251376670.
- **Al Attar et al. 2022**, *J Physiother*, 9 ensayos por conglomerados con 14.394 participantes:
  - los programas **con pliométricos** bajan el riesgo un **60 %** frente a una entrada en calor
    sin ellos (IRR 0,40; 0,26-0,63);
  - el efecto es más claro en la lesión sin contacto (IRR 0,34);
  - también en varones (0,21) y en mujeres (0,51).
  - DOI 10.1016/j.jphys.2022.09.001.
- **Sugimoto et al. 2014**, *Sports Med*, 14 estudios en mujeres deportistas (texto completo,
  PMC3969416). Definen:
  - **duración**: corta, menos de 20 minutos por sesión; larga, más de 20;
  - **frecuencia en temporada**: una vez por semana, o dos o más;
  - **volumen semanal en temporada**: bajo (hasta 15 minutos), moderado (15-30) y alto (más de
    30).

  Todo baja el riesgo, y más cuanto más: sesión larga OR 0,35 contra corta 0,61; dos o más veces
  por semana 0,35 contra una vez 0,62; volumen alto 0,32, moderado 0,46, **bajo 0,66**. DOI
  10.1007/s40279-013-0135-9.
- **Halvorsen et al. 2023**, *HSS J*, 15 estudios: solo la adherencia alta (76 % o más de las
  sesiones) baja las lesiones. DOI 10.1177/15563316221140860.
- **Taylor et al. 2015**, *Br J Sports Med*, 13 estudios, metarregresión por componente: más peso
  del equilibrio se asoció a **más** riesgo, y más estiramiento a menos. Es una asociación entre
  programas, no un ensayo, pero alcanza para no armar un bloque de rodilla solo con equilibrio.
  DOI 10.1136/bjsports-2013-092358.
- **Frontiers in Public Health 2026**: OR 0,456, con más efecto en los jóvenes. DOI
  10.3389/fpubh.2026.1801019.
- La **guía de práctica clínica** de JOSPT (Arundale et al. 2023) actualiza la de 2018 sobre la
  prevención de rodilla con ejercicio. Su texto no está abierto; de ella se cita solo que existe y
  qué cubre. DOI 10.2519/jospt.2023.0301.

### Qué quiere decir

- El efecto está bien sostenido: cerca de la mitad de las roturas.
- Lo que más pesa son los **saltos con técnica de aterrizaje**, no el equilibrio suelto.
- La dosis de los ensayos es la de un programa entero de **más de 20 minutos, dos o más veces por
  semana**, casi siempre en la cancha como entrada en calor del equipo. El gimnasio no reemplaza
  eso; puede sumar la parte de aterrizar bien. Aun con volumen bajo el riesgo baja (Sugimoto: OR
  0,66).
- La frecuencia se sostiene en temporada: dos o más veces por semana rinde más que una. Es lo
  contrario del nórdico, que baja a una.

## Lo que decidió el dueño (19/09/2026)

- **Al catálogo entran dos ejercicios de aterrizaje:**
  - "Aterrizaje desde cajón": se deja caer de un cajón bajo y clava en dos pies, dos segundos;
  - "Salto lateral a un pie con aterrizaje clavado".

  Se marcan **explosivos**. Así los saca todo lo que ya saca los saltos: las molestias, las
  operaciones sin saltos, el suelo pélvico, el embarazo y "no puedo saltar".
- **En toda sesión de pierna, también en temporada:** dos ejercicios de 2 × 5-8 aterrizajes, 60 s
  de pausa. Son unos 5 minutos.
- **Cerca del partido, como los explosivos:** salen el día anterior, el del partido y los dos
  siguientes, por la regla de lo explosivo. No hay regla nueva.
- **Aviso** en básquet, handball, vóley y hockey: si el equipo no hace una entrada en calor con
  saltos, aterrizajes y cambios de dirección, que la proponga. Fútbol y futsal siguen con el del
  FIFA 11+.

Deportes del programa: fútbol, futsal, básquet, handball, vóley y hockey (los de giro, decididos
en T5).

## Lo que hace el motor

- **El dato.** `prevention_program` suma `knee`. Los dos ejercicios llevan `prevents: ['knee']`:
  son de bloque, como el nórdico.
- **El ruleset.** `inSeasonSessions` pasa a admitir `null`, que es sin tope en temporada. El
  programa de rodilla lo usa y el de isquios sigue en 1. `removeOn` queda vacío: la regla del día
  (`avoidExplosive`) ya los saca.
- **Dos fugas cerradas.** Los aterrizajes son explosivos, pero no son el trabajo de potencia ni
  entran al par. Había dos lugares que leían `isExplosive` sin mirar si era de bloque:
  - el aviso de potencia (`powerWarnings`): un socio de potencia sin par recibía los aterrizajes y
    el aviso "este plan no trae saltos" dejaba de salir;
  - la razón del aviso por movimientos (`explosivosQueSacaElMovimiento`, `58`): contaba los de
    bloque entre los del par.
- **Todo lo demás es la infraestructura de `62`:**
  - van al final de las sesiones de pierna, sueltos;
  - no suman volumen ni reciben propuestas de carga;
  - se reemplazan solo entre ellos;
  - el ajuste al tiempo deja al menos uno.

### Un hallazgo del barrido que no era de esta tanda

Al sumar el vóley a la dimensión de deporte, el muestreo cambió y el barrido marcó "el tiempo
cambió reps o RIR" en dos socios de rugby y running. No era el motor: el test indexaba la dosis
solo por ejercicio. "Aductores en máquina" iba de secundario en la sesión A (6-12, RIR 1) y de
aislado en la B (8-15, RIR 2). El ajuste sacó el aislado de la B, que es su paso 3, y el test
comparaba la B de antes con la A de después. Ahora indexa por sesión y ejercicio. La guarda sigue
viva: el ajuste tocando el RIR da rojo.

## El dato

- **Esquema:** `alter type prevention_program add value 'knee'`. No es destructivo.
- **Catálogo** (87 ejercicios):
  - "Aterrizaje desde cajón": sentadilla, cuádriceps y glúteos, cajones pliométricos,
    principiante;
  - "Salto lateral a un pie con aterrizaje clavado": zancada, unilateral, sin equipo, novato.
  - Los dos son explosivos y piden `jumping`.
- **Ruleset:** programa `knee` (2 por sesión, 2 × 5-8, 60 s, sin tope en temporada, confianza
  media) y la nota de la entrada en calor para básquet, handball, vóley y hockey.

## Cómo se prueba

- **Unitario:**
  - `contexto.test.ts`: cada programa sale solo en sus deportes, con su dosis y su tope (o sin
    tope), en y fuera de temporada. Un explosivo de bloque no cuenta para la razón del aviso por
    movimientos;
  - `placeholder-engine.test.ts`: dos aterrizajes en cada sesión de pierna, también en temporada,
    sueltos y con su dosis. Salen justo los días que sacan lo explosivo. Una molestia o no poder
    saltar los sacan. No tapan el aviso de potencia.
- **Matriz**, sobre el catálogo real:
  - vóley y fútbol, en y fuera de temporada, con los dos aterrizajes sueltos;
  - la temporada no les pone tope;
  - en los deportes sin giro, nunca;
  - la regla de "todo explosivo va en par" deja afuera a los de bloque.
- **Barrido:**
  - el vóley entra a la dimensión de deporte;
  - la invariante de `62` cubre los dos programas;
  - la cuota sin tope es toda sesión de pierna;
  - la medida de veces por semana en temporada cuenta solo los programas con tope.
  - **Sensibilidad del deporte: 67 %.**
- **Falsificado: 9 de 9 en rojo.** Las mutaciones:
  - rodilla en todos los deportes;
  - tope en temporada;
  - un ejercicio por sesión;
  - el aviso de potencia tapado;
  - el bloque contando para el par;
  - la molestia que no los saca;
  - el partido que no los saca;
  - un solo grupo para todos los bloques en el ajuste al tiempo;
  - el ajuste al tiempo tocando el RIR, para ver que la guarda del barrido corregido sigue viva.

## Lo que queda

- **T5c:** el hombro en los deportes de brazo arriba.
- **La entrada en calor del equipo** es la dosis de los ensayos, y la app solo puede avisarla.
- Ver en el lugar **qué cajón sirve de cajón bajo** para el aterrizaje. La altura no sale de la
  investigación leída acá.
