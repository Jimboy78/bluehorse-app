# Énfasis excéntrico por ejercicio: no hay con qué construir la columna

Auditoría del 9 de septiembre de 2026, segunda vuelta, hueco 3 de 6.

Hueco abierto en `07-dias-pre-y-post-partido.md`. Cerca de un partido el motor baja el volumen y saca
lo explosivo (`isExplosive`, que sí existe como columna del catálogo). Lo que **no** puede hacer es
sacar los ejercicios de énfasis excéntrico marcado — cambiar *qué* ejercicio se hace, no cuánto —
porque no hay forma de saber cuáles son.

La pregunta era si existe un criterio con respaldo para marcar esa columna, o si hay que declararlo
como criterio propio.

**Veredicto: no hay clasificación publicada, y el criterio que se propuso para reemplazarla no se
sostiene. La columna no se construye.**

## Lo que dice la evidencia

### No existe una clasificación publicada ejercicio por ejercicio — CONFIANZA ALTA en la ausencia

Lo más cercano es una taxonomía de entrenamiento excéntrico:

> Burgos-Jara C, Cerda-Kohler H, Aedo-Muñoz E, Miarka B. *Eccentric Resistance Training: A
> Methodological Proposal of Eccentric Muscle Exercise Classification Based on Exercise Complexity,
> Training Objectives, Methods, and Intensity.* Appl Sci. 2023;13(13):7969.
> DOI 10.3390/app13137969 — **verificado en Crossref**

Como dice su propio título, clasifica por **complejidad, objetivo, método e intensidad**. No ordena
ejercicios por daño inducido, que es lo que la app necesitaría. No sirve.

### El criterio propuesto para reemplazarla se apoya en un artefacto del corpus — DESCARTADO

La regla que llegó del informe era: monoarticular pesa más que poliarticular, y venía con un número
concreto — 64,1 % de los grupos en el clúster de daño ALTO contra 35,9 % — atribuido a un
metaanálisis de 141 estudios y 3.089 participantes.

**Se abrió el paper.** El estudio existe y el tamaño es correcto, pero:

1. **El contraste real es 64,1 % contra 47,5 %**, no contra 35,9 %. El 35,9 salió de restarle 64,1 a
   100, que no es lo que compara el paper: 47,5 % es la proporción **esperada** de monoarticulares en
   el corpus entero.
2. **El paper no compara ejercicios.** Su objetivo, textual, es "characterize the magnitude and
   time-course of commonly used indirect markers of EIMD over different levels of muscle function
   loss" — cuál de los marcadores indirectos de daño conviene usar según el momento. Su conclusión es
   sobre marcadores, no sobre ejercicios.
3. **Lo que esa sobre-representación describe es qué eligen los investigadores.** Que los ejercicios
   monoarticulares y los ergómetros isocinéticos abunden en el clúster de daño alto significa que son
   las herramientas con las que se induce daño en un laboratorio, no que sean los ejercicios que más
   dañan en un gimnasio. Es un sesgo de selección del corpus.

> Chalchat E, Gaston AF, Charlot K, et al. *Appropriateness of indirect markers of muscle damage
> following lower limbs eccentric-biased exercises: A systematic review with meta-analysis.* PLOS
> ONE. 2022;17(8):e0271233. DOI 10.1371/journal.pone.0271233 — **verificado, paper abierto y leído**

### Lo que sí quedó verificado, y no alcanza

- La velocidad de la contracción excéntrica sí modula el daño: ciclismo excéntrico a 210°/s dejó el
  torque en 77,7 ± 13,5 % inmediatamente y todavía en 73,4 ± 18,4 % al día 4, contra 106,6 ± 15,9 %
  y 91,5 % a 30°/s (n = 11).
  > Ueda H, Tsuchiya Y, Ochi E. *Fast-Velocity Eccentric Cycling Exercise Causes Greater Muscle
  > Damage Than Slow Eccentric Cycling.* Front Physiol. 2020;11:596640.
  > DOI 10.3389/fphys.2020.596640 — **verificado en Crossref**

  Pero la velocidad la pone quien entrena, no el ejercicio. **No es una propiedad del catálogo.**

- El capítulo de referencia sobre el mecanismo sigue siendo válido y ya estaba citado en `07`.
  > Nosaka K, Chen TC. *Muscle Damage Induced by Eccentric Exercise, Recovery and Adaptations.*
  > DOI 10.1007/978-3-031-44270-4_8 — **verificado en Crossref**

## Qué se cambió

**Nada.** No se agregó la columna al catálogo ni ningún campo al ruleset.

Marcar 58 estaciones a mano con un criterio que no tiene respaldo produciría una columna que
*parece* dato y es opinión — y que además decidiría qué sale del plan de alguien que juega un partido
mañana. Eso es peor que no tenerla: `07` ya declara la limitación, y una columna inventada la
taparía.

La alternativa honesta, si el énfasis excéntrico importa de verdad, es declarar el criterio como
propio y decirlo en pantalla. Pero eso es una decisión de producto sobre trabajo de catálogo, no un
resultado de investigación.

## Lo que esta investigación NO cubre

- **Cuánto tarda en recuperarse la fuerza tras una sesión de énfasis excéntrico marcado.** El informe
  dio una línea de tiempo (24-48 h el pico, ~7 días la recuperación) pero sin cita verificable por
  tramo. `07` ya tiene sus propias ventanas medidas para el día después del partido, que es el caso
  que la app maneja.
- **El "eccentric overload" que el ACSM 2026 respalda para hipertrofia.** Es la variable opuesta a
  este hueco —buscar el estímulo excéntrico en vez de evitarlo— y tampoco se puede expresar sin una
  marca por ejercicio. Ver `16-tiempo-bajo-tension.md`.
- **Si el daño escala de forma continua o por categorías.** Sin clasificación publicada, la pregunta
  queda abierta.
- **Peso libre contra máquina, unilateral contra bilateral, recorrido completo contra parcial.** Son
  las candidatas que quedaron sin evaluar con evidencia propia. El informe las ordenó, pero apoyado
  en el artefacto de corpus descrito arriba y en una cita que resuelve a otro paper (ver la nota al
  pie). Nada de ese ordenamiento entró acá.

## Nota sobre las fuentes de esta iteración

El informe atribuyó a "Chen 2007" el DOI `10.1152/japplphysiol.00664.2006` como respaldo de que la
amplitud de recorrido predice el daño muscular. Ese DOI **resuelve a un paper de modelos windkessel
de propiedades arteriales**, sin relación con el tema. Y el paper que sí lleva ese título —*Intensity
and volume of eccentric exercise, not stretch amplitude, determines changes in muscle damage*— dice
en su propio título lo contrario de lo que se le atribuía.

También presentó como "64,1 % contra 35,9 %" un contraste que en el paper es 64,1 % contra 47,5 %,
y describió el metaanálisis de Chalchat como si comparara ejercicios cuando compara marcadores de
daño. Nada de eso entró.
