# Interferencia: dos reglas sin respaldo y la única que importa, ausente

Auditoría del 9 de septiembre de 2026, sexta iteración de la revisión del motor.

## Primero: el barrido que el patrón repetido ameritaba

En las iteraciones 2 y 5 apareció tres veces el mismo problema — contenido escrito en el ruleset,
validado por zod, que **no lee nadie**. Antes de auditar cardio, se hizo el barrido completo:
recorrer las 114 claves de contenido del ruleset activo y buscar cada una en `packages/engine/src`
y `apps/web/src`, descontando el esquema y los valores de enum del dominio.

**Doce bloques declarados y muertos:**

| Clave | Qué contiene |
|---|---|
| `interference` + `avoidIntervalsSameDayAsLowerBody` + `minHoursBetweenSessions` | reglas de cardio contra fuerza |
| `redFlags` | 6 señales de alarma médicas |
| `specialPopulations` + `requiresClearance` | embarazo, hipertensión no controlada, diabetes |
| `severityScale` + `nprs` | las anclas de la escala de dolor |
| `clearedMessage` | qué decirle a quien pasó el PAR-Q |
| `optimalSetsPerMuscle` | el rango óptimo de series (solo se usan el mínimo y el máximo) |
| `sessionsPerMusclePerWeek` | frecuencia por músculo |
| `rotationWeeks` | cada cuánto rotar ejercicios |
| `hrPercentMax` | zonas de frecuencia cardíaca |
| `keepLoad` | si la descarga mantiene la carga |

**Uno de esos lo agregué en la iteración 2**, en el mismo documento donde denuncié este patrón:
`severityScale` se escribió para anclar la escala de dolor al NPRS 0-10 y **no se consume en ningún
lado**. Vale dejarlo escrito: el problema no es que alguien haya sido descuidado, es que **escribir
contenido en el ruleset es más barato que conectarlo**, y nada en el proyecto avisa cuando quedan
desconectados. Un test que compare declarado contra consumido resolvería la clase entera de
problemas; queda propuesto.

## La interferencia: qué dice el ruleset y qué dice la evidencia

El bloque `cardio.interference` declara dos reglas:

```json
{ "avoidIntervalsSameDayAsLowerBody": true, "minHoursBetweenSessions": 6 }
```

Ninguna de las dos tiene fuente en `docs/research/`, y ninguna se aplica.

### El efecto de interferencia es chico y a nivel de fibra — CONFIANZA MEDIA

Metaanálisis de **15 estudios** comparando entrenamiento concurrente contra fuerza sola, midiendo
tamaño de fibra muscular:

| Desenlace | SMD (IC 95 %) | p |
|---|---|---|
| Fibras I y II combinadas | **−0,23 (−0,46 a −0,00)** | **0,050** |
| Fibras tipo I | −0,34 (−0,72 a 0,04) | 0,078 |
| Fibras tipo II | −0,13 (−0,39 a 0,12) | 0,315 |

El efecto global roza el cero exactamente, y ninguno de los dos tipos de fibra por separado alcanza
significación. Los propios autores encuadran el resultado contra la literatura previa: **la
hipertrofia de músculo entero no se ve afectada** por entrenar en concurrencia; lo que aparece es
un efecto pequeño a nivel de fibra.

Para un socio de gimnasio de barrio, eso significa que la interferencia es, en la práctica,
irrelevante. No es razón para reordenarle la semana.

### Lo único que sí discrimina es la modalidad — CONFIANZA MEDIA

En los análisis de subgrupo:

- **Correr, fibras tipo I: SMD −0,81 (IC 95 % −1,26 a −0,36)** — interferencia real y significativa.
- **Pedalear: sin efecto negativo.**

La explicación propuesta es la misma que apareció en `07`: **correr tiene componente excéntrico** y
produce daño muscular; pedalear casi no. Es la tercera vez que el mecanismo excéntrico explica un
hallazgo en esta investigación.

Y lo que **no** discriminó nada:

> "Ninguno de los otros análisis de subgrupo (frecuencia de entrenamiento concurrente, estado de
> entrenamiento, modalidad de entrenamiento y orden de ejercicios en la sesión conjunta) reveló
> diferencias entre grupos."

**Eso liquida las dos reglas del ruleset.** Ni el orden dentro de la sesión, ni entrenar el mismo
día contra días separados mostraron diferencia alguna. `avoidIntervalsSameDayAsLowerBody` y
`minHoursBetweenSessions: 6` prescriben precisamente lo que el metaanálisis no encontró.

> Lundberg TR, Feuerbacher JF, Sünkeler M, Schumann M. *The Effects of Concurrent Aerobic and
> Strength Training on Muscle Fiber Hypertrophy: A Systematic Review and Meta-Analysis.* Sports Med.
> 2022. DOI 10.1007/s40279-022-01688-x

**Sobre el `minHoursBetweenSessions: 6`:** existe un argumento mecanicista —la AMPK sube tras
trabajo aeróbico intenso y tarda al menos 3 horas en volver a la basal— pero es una señal molecular,
no un desenlace de fuerza o tamaño medido. Un marcador que se normaliza no es lo mismo que una
adaptación que se pierde, y el metaanálisis, que sí mide desenlaces, no encuentra efecto del
espaciado. El 6 no sale de ninguna de las dos cosas.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| `avoidIntervalsSameDayAsLowerBody: true` | **se cae** | El subgrupo de misma sesión contra días separados no mostró diferencias. |
| `minHoursBetweenSessions: 6` | **se cae** | Ni el metaanálisis lo respalda ni el argumento de AMPK da 6 horas. Es un número sin origen. |
| Que la modalidad importe | **se incorpora** | Correr interfiere (SMD −0,81 en fibras I); pedalear no. Es lo único que discriminó. |
| La magnitud del efecto | **se declara** | −0,23 rozando el cero, y nulo a nivel de músculo entero. No amerita reordenar la semana de nadie. |

## Lo que se cambió

`cardio.interference` pasó de dos reglas sin respaldo y sin uso a **una nota que el motor emite**
cuando el plan mezcla cardio con trabajo de tren inferior: dice que el efecto es chico, que a nivel
de músculo entero no aparece, y que si va a hacer cardio cerca de la pierna, la bicicleta y el
elíptico molestan menos que la cinta.

Eso es lo que la evidencia sostiene, y encima es accionable en un gimnasio: el socio elige máquina,
no reordena su semana.

## Lo que esta investigación NO cubre

- **El rendimiento de resistencia.** Todo lo de acá mide fuerza y tamaño muscular. Si la
  concurrencia perjudica al que entrena para correr, no se responde.
- **Marcar la modalidad en el catálogo.** La distinción correr/pedalear se le dice al socio en texto,
  porque no existe un campo que separe cardio de impacto de cardio sin impacto. Agregarlo es el
  mismo patrón que `is_explosive` — columna, catálogo y mapeadores — y no se hizo acá.
- **Los otros once bloques muertos.** Se listaron y midieron; conectarlos o borrarlos es una
  decisión por bloque, y varios (como `redFlags`) tocan la interfaz, no el motor.
