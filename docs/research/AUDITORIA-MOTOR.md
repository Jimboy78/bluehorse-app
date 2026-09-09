# Auditoría del motor: un parámetro por vez

Revisión sistemática de **todo lo que el motor mira para armar un plan**. Para cada entrada:
¿existe?, ¿está respaldada por evidencia primaria con DOI?, ¿el número que usa el ruleset es el que
dice esa evidencia?, ¿cambia algo en el plan de verdad?

Regla de la auditoría: **un parámetro por iteración, hasta el fondo**. Vale más cerrar uno con su
metaanálisis y sus tests que dejar diez a medias. Lo que no tiene respaldo se dice, no se maquilla.

## Inventario: qué mira el motor hoy

Medido contando usos reales en `packages/engine/src/`, no leyendo la documentación.

| Entrada | ¿La usa? | Estado |
|---|---|---|
| `experienceLevel` | sí | ✅ **auditado** — `10-nivel-de-experiencia.md` |
| `goal` | sí | pendiente |
| `birthDate` (edad) | sí | ✅ **auditado** — `08-edad.md` |
| `sport` | sí | auditado en `06`; queda como dato, sin promesas |
| `seasonPhase` | sí | auditado en `06` |
| día de partido | sí | auditado en `07`; falta el marcador de énfasis excéntrico |
| `constraints` (dolor / lesión) | sí | ✅ **auditado** — `09-dolor-y-lesiones.md` |
| `sessionsPerWeekTarget` | sí | pendiente — **prioridad alta**, ver brecha de frecuencia en `10` |
| `baselines` | sí | pendiente |
| `daysSinceLastSession` | sí | pendiente |
| `sex` | **no (0 usos)** | pendiente — decidir si se saca del formulario |
| `weightKg` | **no (0 usos)** | pendiente |
| `heightCm` | **no (0 usos)** | pendiente |
| `sessionMinutesTarget` | **no (0 usos)** | pendiente — se le pide al socio y no hace nada |
| `preSleep` / `preEnergy` | **no (0 usos)** | pendiente — se registran y no alimentan nada |
| `sessionFeel` | **no (0 usos)** | pendiente |
| `redFlags` (señales de alarma) | **están en el ruleset, no se muestran** | pendiente — es plomería, no evidencia |
| `specialPopulations` (embarazo, hipertensión…) | **están en el ruleset, sin ninguna consecuencia** | pendiente — iteración propia |
| lesión **aguda** vs dolor crónico | **no se distinguen** | pendiente — brecha abierta en `09` |
| fragilidad | **no existe el campo** | abierto — ver `08-edad.md` |
| tiempo bajo tensión | **no se prescribe** | abierto — predictor fuerte en `08-edad.md` |

## Iteraciones

### 1 · Edad — cerrada el 2026-09-09

`docs/research/08-edad.md`. Tres de los cuatro números del modificador no se sostenían.

- El ruleset aplicaba a **todo** socio de 60+ la recomendación pensada para el subgrupo **frágil**:
  −20 % de intensidad, +2 repeticiones, +30 % de descanso. Origen: consenso ACSM 2009, sin DOI.
- Dos metaanálisis independientes dicen lo contrario. Borde 2015 (25 ECAs, 819 participantes,
  60-90 años, DOI 10.1007/s40279-015-0385-9) mide el óptimo en **70-79 % 1RM** y **7-9
  repeticiones**, con la intensidad como predictor más fuerte (p < 0,01). Un segundo metaanálisis
  (18 ECAs, 1283 participantes) encuentra la alta intensidad superior en prensa (SMD 0,95) y
  extensión (SMD 0,63), **sin más caídas ni más eventos adversos**.
- Impacto medido antes de corregir: **34 de 36** combinaciones caían fuera de la ventana. Un
  principiante de 65 con objetivo hipertrofia quedaba prescrito al **28-44 % 1RM** en aislamiento.
- Bug encontrado de paso: `Math.max(repsMax, repsMin + delta)` **colapsaba el rango a un punto**
  (potencia quedaba en 3-3 repeticiones; fuerza/novato en 6-6).
- Se reemplazaron los multiplicadores por ventanas y se acotó a los objetivos medidos. 4 tests
  nuevos, 291 en verde.
- **Abierto:** después de los 60 el nivel de experiencia ya no diferencia intensidad ni
  repeticiones. Declarado en `08-edad.md`.

### 2 · Dolor y lesiones — cerrada el 2026-09-09

`docs/research/09-dolor-y-lesiones.md`. Dos problemas distintos, uno de evidencia y uno de plomería.

**Plomería, y es lo más serio de toda la auditoría hasta acá:** `referIf` (cuándo ir al médico),
`redFlags` (6 señales de alarma) y `specialPopulations` (embarazo, hipertensión no controlada,
diabetes con complicaciones) estaban escritos, versionados y validados por zod, y **no los
consumía nadie**. Un ruleset que aparenta cobertura que la app no entrega es peor que uno
incompleto. `referIf` ya se emite; los otros dos siguen pendientes.

**Evidencia:** la regla lumbar sacaba, con dolor 3 de 5, todo el patrón `hinge` y todo trabajo de
`lower_back` — que es exactamente lo que tres metaanálisis usan como tratamiento.

- Ejercicio **con** dolor contra ejercicio sin dolor, 7 ECAs / 385 participantes: SMD −0,28
  (IC −0,49 a −0,08) a corto plazo **a favor del que permite dolor**; sin diferencia a largo plazo.
  Calidad baja. DOI 10.1136/bjsports-2016-097383
- Extensión lumbar cargada, 8 ECAs / 381 participantes: dolor g = −0,633 (IC −1,06 a −0,20),
  p = 0,004. Certeza muy baja. DOI 10.1038/s41598-025-90699-5
- Carga externa contra ejercicio sin carga, 13 ECAs / 778 participantes: MD −0,52 en 0-10
  (IC −0,92 a −0,08) más allá de 7 semanas. Los autores concluyen que cargar es **seguro y
  factible**, y que lo que decide el resultado es **la exposición y la adherencia**, no la carga.

- Se partió el umbral único en dos: `monitorFrom` (se avisa, no se saca nada) y `avoidFrom` (se
  saca). El lumbar moderado pasó de bloquear a monitorear.
- Se ancló la escala 1-5 al NPRS 0-10 (`safety.severityScale`), que es la que usan las fuentes.
  Antes el socio elegía un número sin anclas y ese número sacaba ejercicios.
- Se agregó `safety.painMonitoring`: hasta 5/10 durante, vuelta a la basal al día siguiente, sin
  escalar semana a semana (Silbernagel, DOI 10.1177/0363546506298279).
- 5 tests nuevos, 296 en verde. Los tests viejos usaban severidad 1 y 4, **salteando justo el 3**
  que era el caso en disputa; por eso el cambio de umbral no rompió nada.

### 3 · Nivel de experiencia — cerrada el 2026-09-09

`docs/research/10-nivel-de-experiencia.md`. Acá no hacía falta buscar papers para encontrar lo
principal: alcanzó con medir el ruleset contra sí mismo.

- **En 3 de 6 objetivos el nivel no cambia absolutamente nada.** En `power`, `endurance` y `cardio`
  el `byLevel` está vacío: los cuatro niveles reciben la misma prescripción palabra por palabra.
  En `recomposition` solo se separa el principiante. Solo `strength` e `hypertrophy` diferencian los
  cuatro.
- **El nivel `novice` no existe en ninguna investigación del proyecto** — cero ocurrencias en los
  doce documentos de `docs/research/`. Se agregó al enum y se le inventaron valores. Se conserva
  porque sacarlo obliga a migrar datos de socios, pero queda marcado.
- **La mejor evidencia dosis-respuesta solo distingue dos estados.** Pelland 2025 (67 estudios,
  2058 participantes, DOI 10.1007/s40279-025-02344-w) usa el estado de entrenamiento como covariable
  **binaria**: entrenado / no entrenado. Cuatro escalones son plausibles, no medidos.
- **No hay forma objetiva de determinar el nivel.** El modelo de referencia (DOI
  10.1519/SSC.0000000000000627) pide **cinco** parámetros — tiempo ininterrumpido, desentrenamiento,
  experiencia previa, técnica y nivel de fuerza — y el onboarding captura tres de forma difusa, con
  autoevaluación. Los dos más objetivos (técnica y fuerza) son los que quedan librados al criterio
  del socio.
- **Lo que sí quedó confirmado:** `weeklyVolume.optimalSetsPerMuscle: [6, 12]` cae justo sobre las
  medianas observadas (6 series/semana para fuerza, 10,5 para hipertrofia). Es de lo poco que esta
  auditoría encontró bien puesto.
- Se agregó `modifiers.experienceLevel.noDoseEffectNote`: cuando el nivel no cambia la dosis, el
  plan lo dice (regla dura 4). 4 tests nuevos, 300 en verde.

### Próxima: frecuencia (`sessionsPerWeekTarget`)

Pelland deja una brecha concreta y accionable: la frecuencia semanal tiene efecto sobre la **fuerza**
(probabilidad posterior 100 %, con rendimientos decrecientes) pero es **compatible con nulo** para
hipertrofia. El motor hoy deja que el socio elija la frecuencia y no le dice nada de eso. Además
hay que revisar cómo se elige la plantilla cuando la frecuencia pedida no tiene una que la cubra:
`pickTemplate` ya emite una advertencia de fallback que conviene auditar.
