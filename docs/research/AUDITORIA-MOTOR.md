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
| `experienceLevel` | sí | pendiente |
| `goal` | sí | pendiente |
| `birthDate` (edad) | sí | ✅ **auditado** — `08-edad.md` |
| `sport` | sí | auditado en `06`; queda como dato, sin promesas |
| `seasonPhase` | sí | auditado en `06` |
| día de partido | sí | auditado en `07`; falta el marcador de énfasis excéntrico |
| `constraints` (dolor / lesión) | sí | pendiente — **prioridad alta** |
| `sessionsPerWeekTarget` | sí | pendiente |
| `baselines` | sí | pendiente |
| `daysSinceLastSession` | sí | pendiente |
| `sex` | **no (0 usos)** | pendiente — decidir si se saca del formulario |
| `weightKg` | **no (0 usos)** | pendiente |
| `heightCm` | **no (0 usos)** | pendiente |
| `sessionMinutesTarget` | **no (0 usos)** | pendiente — se le pide al socio y no hace nada |
| `preSleep` / `preEnergy` | **no (0 usos)** | pendiente — se registran y no alimentan nada |
| `sessionFeel` | **no (0 usos)** | pendiente |
| enfermedades / red flags | **no existe el campo** | pendiente — `04` lo pide, no está implementado |
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

### Próxima: dolor y lesiones (`constraints`)

Es la entrada con más consecuencia de seguridad y hoy se resuelve con un `severityAtLeast` cuyo
origen no está verificado. Además `04-individualizacion-seguridad.md` pide detectar red flags
médicas (angina, hipertensión no controlada, infarto reciente) y **no hay ningún campo** que las
capture.
