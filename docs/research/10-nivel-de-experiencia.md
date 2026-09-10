# Nivel de experiencia: cuatro opciones que a veces no cambian nada

Auditoría del 9 de septiembre de 2026, tercera iteración de la revisión del motor.

El nivel es lo primero que se le pregunta al socio después de la edad, con cuatro tarjetas y un
texto que dice que *decide qué ejercicios entran al plan*. Es el parámetro con más superficie
aparente en toda la prescripción: define series, repeticiones, intensidad, descanso y paso de
progresión. Su única fuente en `04-individualizacion-seguridad.md` es **ACSM 2009, sin DOI** — la
misma que ya falló en la iteración de edad.

## Primero, lo que se puede medir sin salir del repo

### El cuarto nivel no existe en ninguna investigación

`EXPERIENCE_LEVELS` tiene cuatro valores: `beginner`, `novice`, `intermediate`, `advanced`. La
fuente citada define **tres**: principiante (<6 meses), intermedio (~6-12 meses), avanzado
(>2 años). Buscando `novice` en los doce documentos de `docs/research/`: **cero ocurrencias**. El
nivel "Novato" se agregó al enum y se le inventaron valores.

### En la mitad de los objetivos, el nivel no cambia la dosis

Comparando la prescripción completa (series, repeticiones, RIR, descanso e intensidad de los tres
roles) que produce cada nivel:

| Objetivo | Prescripciones distintas | |
|---|---|---|
| `strength` | 4 de 4 | |
| `hypertrophy` | 4 de 4 | |
| `recomposition` | ~~2 de 4~~ **4 de 4** | corregido el 10/09/2026, ver abajo |
| `power` | **1 de 4** | **el nivel no cambia nada** |
| `endurance` | **1 de 4** | **el nivel no cambia nada** |
| `cardio` | **1 de 4** | **el nivel no cambia nada** |

En `power`, `endurance` y `cardio` el bloque `byLevel` está literalmente vacío. Un principiante y
alguien con diez años de gimnasio reciben la misma prescripción, palabra por palabra.

Y en los dos objetivos donde sí diferencia, la diferenciación es despareja: `novice` solo redefine
`primary` y la progresión —sus ejercicios secundarios y de aislamiento son los del **intermedio**—,
y `advanced` no define progresión propia.

> **Corrección del 10 de septiembre de 2026.** La fila de `recomposition` decía "2 de 4", y era la
> medición correcta de lo que había. Lo que nadie reconcilió es que `12-objetivo.md` afirmaba en la
> misma época que `recomposition` es **idéntico a hipertrofia**, que da 4 de 4. Las dos cosas no
> podían ser ciertas: este documento estaba midiendo un `byLevel` a medio copiar y el otro estaba
> mirando solo la fila del `default`.
>
> Se resolvió a favor de lo que promete la nota del propio ruleset —"los números son los de
> hipertrofia"— copiando su `byLevel`. La recomposición ahora diferencia igual que la hipertrofia, y
> el detalle de lo que recibía cada nivel está en `12-objetivo.md`.
>
> El resto de este párrafo sigue vigente: `novice` redefine solo `primary` y la progresión, y
> `advanced` no define progresión propia. Eso es igual en los tres objetivos que diferencian, así
> que es la forma establecida y no un descuido.

> **Matiz del 10 de septiembre de 2026, misma fecha.** "`advanced` no define progresión propia" era
> una observación, no una regla, y en un caso tenía consecuencias. `strength.advanced` pisa el RIR
> objetivo de 3 a 2 y heredaba el gatillo 4 del `default`: un avanzado que cumple el plan anota RIR 2,
> nunca llega a 4 y **nunca recibe una suba de carga**. Corregido en `26-acsm-2026.md`, que le da
> progresión propia con el gatillo en 3. `hypertrophy.advanced` y `recomposition.advanced` siguen sin
> progresión propia y está bien: ahí el gatillo heredado sigue alineado con el RIR que prescriben.

**Esto no es necesariamente un error de prescripción, pero sí de honestidad.** Se le presenta al
socio una decisión de cuatro opciones como si individualizara el plan, y en la mitad de los casos
lo único que hace es filtrar qué ejercicios entran por técnica. Que es útil, pero es otra cosa.

## Lo que dice la evidencia sobre clasificar el nivel

### No hay forma objetiva de determinarlo — CONFIANZA MEDIA (consenso)

La revisión que propone el modelo de referencia arranca reconociendo el problema: **no existen
parámetros objetivos para evaluar el estado de entrenamiento**, y de ahí viene la ambigüedad para
decidir volumen y demás variables.

El modelo propone clasificar con **cinco parámetros**, no con uno:

1. tiempo de entrenamiento ininterrumpido actual
2. tiempo de desentrenamiento
3. experiencia de entrenamiento previa
4. **técnica de ejecución**
5. **nivel de fuerza**

Y define cuatro niveles (principiante, intermedio, avanzado, muy avanzado) por el **promedio** de
los parámetros, no por uno solo. Para el nivel de fuerza da cortes concretos: avanzado es sentadilla
de 120-150 % del peso corporal en hombres y 100-130 % en mujeres; muy avanzado, sentadilla por
encima del 150 % o press de banca por encima del 120 % en hombres.

Es un modelo de consenso publicado en una revista de la NSCA, no un experimento. Sirve como
referencia de **qué preguntar**, no como prueba de que cuatro niveles produzcan cuatro dosis.

> Santos Junior ERT et al. *Classification and Determination Model of Resistance Training Status.*
> Strength Cond J. 2021;43(5). DOI 10.1519/SSC.0000000000000627

**Contraste directo con lo que hace la app:** el onboarding pregunta *"¿Cuánto hace que entrenás?"*
con cuatro descripciones subjetivas ("la técnica ya te sale sola", "conocés tus cargas"). De los
cinco parámetros del modelo, captura de forma difusa tres y **ninguno de forma medible**. Los dos
que el modelo considera más objetivos —técnica y nivel de fuerza— son justamente los que quedan
librados a la autoevaluación.

### La mejor evidencia de dosis-respuesta solo distingue DOS estados — CONFIANZA ALTA

Metaanálisis de meta-regresiones multinivel: **67 estudios, 2058 participantes** (79,1 % varones;
edad media 25,2 ± 5,2 años), 28 estudios con no entrenados y 39 con entrenados.

En todos los modelos, el estado de entrenamiento entra como **covariable de ajuste binaria**
(entrenado / no entrenado). No como un gradiente de cuatro niveles: **la literatura que mejor
mide la dosis-respuesta no tiene resolución para más de dos estados.**

Resultados principales:

| Relación | Probabilidad posterior de pendiente > 0 | Forma |
|---|---|---|
| Volumen → hipertrofia | **100 %** | rendimientos decrecientes |
| Volumen → fuerza | **100 %** | rendimientos decrecientes **más pronunciados** |
| Frecuencia → hipertrofia | < 100 %, compatible con efecto **nulo** | — |
| Frecuencia → fuerza | **100 %** | rendimientos decrecientes |

Medianas de los protocolos incluidos: para hipertrofia, **10,5 series/semana**, 2 sesiones/semana,
~10 repeticiones; para fuerza, **6 series/semana**, 2 sesiones/semana, 10 repeticiones.

Esas medianas respaldan el `weeklyVolume.optimalSetsPerMuscle: [6, 12]` que ya tiene el ruleset:
cae justo sobre el rango observado. Es de las pocas cosas que esta auditoría encontró bien puesta.

*Limitación relevante para nosotros:* la muestra es 79 % varones y de edad media 25 años. Aplicarlo
a un gimnasio de barrio con socios de 50 y 60 es extrapolación, y así hay que decirlo.

> Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC. *The Resistance Training Dose
> Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle
> Hypertrophy and Strength Gains.* Sports Med. 2025. DOI 10.1007/s40279-025-02344-w

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Usar el nivel para **filtrar ejercicios por técnica** | **se mantiene** | Es la función mejor sostenida: la técnica es uno de los cinco parámetros del modelo de clasificación, y no depende de una dosis-respuesta que no existe. |
| Usar el nivel para diferenciar **la dosis en 4 escalones** | **queda declarado como consenso** | La mejor evidencia disponible solo distingue dos estados. Cuatro escalones son plausibles, no medidos. |
| El nivel `novice` | **sin fuente** | No aparece en ninguna investigación del proyecto. Se conserva porque sacarlo obliga a migrar datos de socios, pero queda marcado. |
| `byLevel` vacío en `power`, `endurance`, `cardio` | **se corrige la presentación** | No se puede seguir presentando como individualizado algo que no lo es (regla dura 4). |
| `weeklyVolume.optimalSetsPerMuscle: [6, 12]` | **confirmado** | Cae sobre las medianas observadas: 6 series/semana para fuerza, 10,5 para hipertrofia. |
| La autoevaluación como único input | **insuficiente, y no se corrige acá** | El modelo pide cinco parámetros; el onboarding captura tres de forma difusa. Cambiarlo es rediseñar el alta. |

## Lo que se cambió

El motor ahora **avisa cuando el nivel declarado no cambia la dosis** para el objetivo elegido, con
el texto en el ruleset (`modifiers.experienceLevel.noDoseEffectNote`). No es una advertencia de
seguridad: es la regla dura 4 aplicada a la individualización. Si el plan no se ajusta por nivel,
el plan lo dice.

## Lo que esta investigación NO cubre

- **Si cuatro escalones de dosis son mejores que dos.** Nadie lo midió. No hay con qué decidirlo, y
  por eso no se tocaron los valores de `strength` ni `hypertrophy`.
- **Cómo medir el nivel de fuerza del socio** para usar los cortes del modelo (sentadilla al 120 %
  del peso corporal, etc.). Requiere un test de 1RM estimado que hoy no existe en el alta, y
  `04` ya advierte que el autorreporte de cargas subestima.
- **Frecuencia por objetivo.** Pelland encuentra que la frecuencia importa para fuerza y es
  compatible con nulo para hipertrofia. El motor deja que el socio elija la frecuencia sin decirle
  eso. Es una brecha concreta y queda anotada para una iteración propia.
- **La brecha demográfica.** Toda la dosis-respuesta viene de muestras de ~25 años y mayoría
  varones. Para un gimnasio con socios de 50-60 es extrapolación declarada.
