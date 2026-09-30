# El catálogo contra el equipo que hay

**Fecha:** 29/09/2026. **Pedido del dueño:** "que veas bien todos los tipos de ejercicios que se
pueden hacer con barras, con pesas, con las máquinas que hay, porque tal vez hay muchos ejercicios
que estamos dejando afuera". No afirmaba que faltaran: pedía verificarlo.

## Lo que se midió

Se cruzaron las 62 estaciones de `supabase/catalog/blue-horse.json` con los 88 ejercicios, por
estación y por músculo primario.

**Cuántos ejercicios tienen cada músculo como primario:**

| músculo | ejercicios | comentario |
|---|---|---|
| glúteos | 38 | sobra |
| cuádriceps | 27 | sobra |
| pecho, abdominales | 9 | bien |
| gemelos | 8 | pero **uno solo con carga** (sentado), el resto son de peso corporal o saltos |
| dorsales, espalda | 6-7 | bien |
| isquiotibiales | 6 | uno es la caminata hacia atrás y otro el swing |
| hombro frontal | 6 | bien |
| tríceps | 3 | y uno es el pase de pecho con wall ball |
| oblicuos, trapecios | 3 | justo |
| bíceps, hombro posterior, lumbares | 2 | flaco |
| hombro lateral, antebrazos | 1 | una sola opción |

**Estaciones que no llevan a ningún ejercicio:** conos de agilidad, foam roller y el árbol de
discos. Los dos primeros no son de entrenamiento de fuerza; el tercero es un soporte.

La conclusión es la del pedido, con un matiz: **no faltan ejercicios en general** —las piernas y
los glúteos están de sobra—, faltan **para los músculos chicos**, y eso se nota justo en "cambiar
ejercicio": con una sola elevación lateral no hay nada que ofrecer cuando las mancuernas están
ocupadas.

## Qué dice la evidencia de los huecos más claros

- **Gemelos de pie.** Entrenar el gemelo con la rodilla estirada lo hace crecer mucho más que
  sentado: gastrocnemio lateral +12,4 % contra +1,7 %, medial +9,2 % contra +0,6 %, sóleo igual
  (Kinoshita et al. 2023, *Front Physiol*, doi:10.3389/fphys.2023.1272106; 14 personas, 12
  semanas, una pierna de cada forma). El catálogo solo tiene la versión sentada con carga. La
  prensa y el Smith permiten la de pie.
- **Peso muerto con barra hexagonal.** Baja el momento en la columna lumbar y la cadera frente a
  la barra recta, y sube el de la rodilla (Swinton et al. 2011, *J Strength Cond Res* 25(7):
  2000-2009). El gimnasio tiene la barra hexagonal y hoy solo se usa para saltar.
- **Hombro lateral y posterior.** La elevación lateral y el press de hombro son los que más
  activan el deltoides medio; el press de banca y las aperturas casi nada (Campos et al. 2020,
  *J Hum Kinet* 75, doi:10.2478/hukin-2020-0033). Para el posterior, las aperturas invertidas con
  agarre neutro activan más que con agarre prono (Schoenfeld et al. 2013, *J Strength Cond
  Res*). Hay poleas de sobra para las dos.
- **Por qué sumar opciones no cambia los resultados:** variar el ejercicio no cambia cuánto
  músculo ni cuánta fuerza se gana (Haugen 2023, ya citado en el ruleset, `selection`), así que
  sumar alternativas equivalentes no cuesta nada en resultados y sí suma adherencia.

## Los 20 que se proponen

Todos con equipo que el catálogo ya tiene. Están cargados en la rama `catalogo-ampliado`
(commit `0b9f5e5`), con nivel, patrón, músculos y consigna.

| músculo | ejercicio | equipo |
|---|---|---|
| hombro lateral | Elevación lateral en polea | cross over |
| hombro posterior | Pájaros con mancuernas · Aperturas invertidas en polea | mancuernas · cross over |
| bíceps | Curl martillo | mancuernas |
| tríceps | Press de banca agarre cerrado · Rompecráneos con barra Z · Extensión sobre la cabeza en polea | banco/Smith · barra Z · cross over |
| isquios / cadera | Peso muerto rumano con barra · Peso muerto con barra hexagonal · Peso muerto con kettlebell · Rumano a una pierna · Curl femoral con pelota suiza · Pull-through en polea | barras · kettlebells · mancuernas · pelota · cross over |
| dorsales | Pullover en polea | cross over, jalón |
| espalda | Remo con pecho apoyado | mancuernas + banco inclinado |
| pecho | Aperturas con mancuernas | mancuernas |
| gemelos | Gemelos en prensa · Gemelos de pie en Smith | prensa · Smith |
| oblicuos | Leñador en polea · Plancha lateral | cross over · colchoneta |

**Verificar en el gimnasio antes de cargar más:** si la *Pec Deck* permite aperturas invertidas
(muchas lo permiten; esta no está relevada), y si las barras de calistenia incluyen paralelas para
fondos.

## Por qué no entraron a main

Cargados, los 20 pasan todas las pruebas —con tres guardas que saltaron y tenían razón: el rumano
con barra no puede compartir ejercicio con el de mancuernas (el peso de la barra se sumaría a una
serie con mancuernas), los ejercicios nuevos por arriba de la cabeza y en el piso van en la lista
escrita a mano del barrido, y "jalón" en el buscador tiene que seguir llevando a la dorsalera—.

Pero la matriz muestra el efecto real: **cambian 723 de 2.692 líneas de prescripción.** No porque
los nuevos ocupen el plan, sino porque el motor elige dentro de cada grupo de candidatos por sorteo
determinístico, y un grupo más grande reordena el sorteo. Algunos cambios son peores:

- **Fuerza, intermedio:** el ejercicio principal de bisagra pasa de peso muerto con barra a peso
  muerto rumano con mancuernas, a 1-5 repeticiones.
- **Principiantes, mayores de 60, posparto:** el primer ejercicio del día pasa a ser el
  pull-through en polea, donde antes estaba el hip thrust en máquina.
- "Peso muerto" como principal pasa de estar en casi todos los perfiles a ninguno; "Remo con barra
  (Pendlay)", de 120 apariciones a 2.

Eso no lo causa el catálogo: lo **destapa**. Antes, que un plan de fuerza tuviera peso muerto con
barra dependía de la suerte del sorteo, no de un criterio. El motor no distingue qué ejercicio sirve
como principal para cada objetivo (con barra y carga alta para fuerza; estable y fácil de aprender
para quien empieza).

## Qué falta decidir

1. **Criterio de "apto como principal"** por objetivo, antes de ampliar el catálogo. Con eso el
   catálogo se puede agrandar sin que el plan cambie por azar.
2. **O** cargar los 20 solo como alternativas ("cambiar ejercicio", Explorar), fuera de la
   selección del plan. Pide una columna nueva en `exercises`.

Hasta decidir, el catálogo de main sigue con 88 ejercicios.
