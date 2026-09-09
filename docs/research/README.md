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
| `05-seguridad-reforzada.md` | refuerza la Parte D de `04` (cribado, señales de alarma, dolor por zona, poblaciones especiales) | **Curable** — tapa el hueco que señalaba la fila de arriba |
| `06-deporte-y-temporada.md` | `sports` (sesgo de selección por deporte) y el multiplicador de volumen por fase de temporada | **Curable con la mitad marcada BAJA** — hecha con búsqueda directa de metaanálisis, no con `PROMPTS.md` |
| `07-dias-pre-y-post-partido.md` | ajuste de la sesión según los días desde el último partido | **Curable la parte posterior, la previa no** — el curso temporal post-partido es ALTA; el tapering previo no aplica a partidos semanales |

**Curado el 8 de septiembre de 2026 a `packages/engine/src/rulesets/v1-research.json`**, que es el
ruleset activo. Cada bloque de `prescription` lleva su `confidence` (la columna "Confianza" de estas
tablas) y, cuando es `low`, un `confidenceNote` que dice en qué es floja — la app lo muestra en
pantalla. El criterio para esas filas, decidido por el usuario: se usa el **extremo conservador** del
rango y queda marcado, en vez de descartarlas o de tomarlas como si fueran sólidas.

Lo que se decidió al curar, y no sale directo de las tablas:

- **Potencia** no propone subir carga sola. Se regula por velocidad de barra, no por repeticiones en
  reserva, y la app no mide velocidad: proponer un aumento por RIR sería aplicarle un criterio que
  no es el suyo. Queda en `rirTarget: null`, que es lo que apaga esa regla en el motor.
- **Resistencia muscular en sala** (`endurance`) es lo más flojo del conjunto: la investigación
  cubre resistencia *aeróbica*, no series de 20 repeticiones. Se usa el extremo liviano de
  hipertrofia, que es el anclaje con evidencia más cercano, y queda marcado como BAJA.
- **Cuando el volumen por sesión choca con el techo semanal, gana el techo.** Por eso fuerza
  avanzada usa 4 series en el principal (el valor documentado) y no 5 (el tope del rango): con 5 y
  tres sesiones semanales, glúteos y dorsales pasaban las 15 series que la misma investigación marca
  como límite útil.
- **`minSetsPerMuscle` del objetivo cardio queda en 0.** La recomendación de la ACSM es de dos
  sesiones semanales de fuerza, no de una cantidad de series por músculo. Poner un número ahí y
  después avisar contra él hubiera sido inventar el umbral y la alarma.

Lo que **no** se curó y sigue pendiente: verificar a mano una muestra de los DOIs. Los valores están
tomados tal como los reporta cada documento; si alguna cita está mal, el número que sostiene también.

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
  mínimo — ver `05` abajo, que refuerza justo esta parte.
- **`05`**: hecha específicamente para tapar el hueco de seguridad que dejaba `04`. Cinco bloques:
  cribado PAR-Q+ (con la tabla de preguntas que bloquean el alta si hay respuesta de riesgo),
  heurísticas de señales de alarma en curso, dolor por zona corporal, poblaciones especiales
  (embarazo, adultos mayores, condiciones crónicas) y el texto de disclaimer. Cada bloque con su
  propia confianza y citas (Riebe 2015/ACSM, ACOG, HealthLink BC, Warburton et al. 2014). Sigue
  aplicando el mismo criterio que las demás: verificar a mano una muestra de citas antes de curar,
  sobre todo acá — es la parte que más protege a un socio real con una condición previa.

## Antes de curar al ruleset

1. Verificar a mano una muestra de los DOIs citados, sobre todo en `03` y `04` — la research está
   mucho mejor que la primera tanda, pero un DOI mal citado no se detecta sin abrirlo.
2. Decidir qué hacer con las filas en confianza BAJA: ¿se usan igual con un valor conservador, o se
   dejan afuera del MVP hasta tener mejor evidencia? Ver la skill `activar-ruleset` para el proceso.
3. Extender `packages/engine/src/ruleset.ts` para que el bloque de cardio use el esquema de
   sesiones (no series/reps) que propone `02`.
