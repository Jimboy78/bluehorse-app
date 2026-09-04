# Investigaciones de contenido

Segunda tanda, hecha con los prompts de `PROMPTS.md` (fuentes revisadas por pares, formato JSON
forzado). Comparado con la primera tanda (130 videos de YouTube, 21.868 líneas, 0 rangos de
repeticiones), esta es la que se puede curar al ruleset.

| Archivo | Llena en el ruleset | Estado |
|---|---|---|
| `01-fuerza-hipertrofia-potencia.md` | `prescription.strength`, `.hypertrophy`, `.power` | **Curable directo** — trae el JSON en la forma exacta del esquema |
| `02-cardio-resistencia-recomposicion.md` | `prescription.cardio`, `.endurance`, `.recomposition` | **Requiere extender el esquema primero** — el cardio no cabe en `sets`/`reps` |
| `03-progresion-descarga.md` | `progression`, `regression`, `deload` de todos los objetivos | **Curable, la mejor fuente de las cuatro** — DOIs verificables, señala controversias en vez de taparlas |
| `04-individualizacion-seguridad.md` | `byLevel`, modificadores, calibración, contraindicaciones | **Curable con huecos marcados** — la Parte D (seguridad) es la más floja: hay que reforzarla antes de un socio real |

Nada de esto está aplicado todavía. El ruleset activo sigue siendo `v0-placeholder`.

## Lectura crítica (no tomar como verdad ciega)

- **`01`**: sólido en volumen semanal e intensidad (%1RM), con ALTA confianza y buen respaldo. La
  fila de potencia (`power`) es la más débil — varias filas en BAJA confianza porque hay poco
  consenso sobre volumen/descanso en entrenamiento explosivo. No es un fallo de la investigación,
  es que la literatura misma es más floja ahí.
- **`02`**: la única de las cuatro que trae una propuesta de esquema nueva en vez de forzar el
  formato pedido (acertado: el JSON de series/reps no le sirve al cardio). El bloque de HIIT para
  pérdida de grasa está honestamente marcado "SIN EVIDENCIA SUFICIENTE" en vez de inventar un
  número — es el comportamiento correcto que pedía el prompt.
- **`03`**: la de mejor calidad. Trae 32 citas con DOI, distingue explícitamente entre lo que dice
  un ensayo controlado (Coleman 2024 sobre deload) y lo que dice un consenso de expertos (Bell
  2023), y deja "SIN EVIDENCIA SUFICIENTE" el multiplicador exacto de detraining a 90 días en vez
  de inventarlo. Antes de curar, verificar a mano al menos los 5-6 DOIs que sostienen los números
  más usados (el paso de progresión y el gatillo de deload).
- **`04`**: la más corta y la que más se apoya en "consenso" antes que en metaanálisis puntuales —
  varias filas en confianza MEDIA o BAJA. La Parte D (contraindicaciones y seguridad) es la que
  menos evidencia dura tiene de las cuatro. Es exactamente donde no conviene quedarse con lo
  mínimo: antes de que la app la use alguien que no seas vos, esa parte necesita revisión aparte
  (posiblemente con alguien con formación clínica, no solo con más investigación de IA).

## Antes de curar al ruleset

1. Verificar a mano una muestra de los DOIs citados, sobre todo en `03` y `04` — la research está
   mucho mejor que la primera tanda, pero un DOI mal citado no se detecta sin abrirlo.
2. Decidir qué hacer con las filas en confianza BAJA: ¿se usan igual con un valor conservador, o se
   dejan afuera del MVP hasta tener mejor evidencia? Ver la skill `activar-ruleset` para el proceso.
3. Extender `packages/engine/src/ruleset.ts` para que el bloque de cardio use el esquema de
   sesiones (no series/reps) que propone `02`.
