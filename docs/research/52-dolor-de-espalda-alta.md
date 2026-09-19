# Dolor de espalda alta: la última zona con regla

**Fecha:** 19/09/2026. **Tanda:** T3d del plan de variables. Es la cuarta zona que `27` había dejado
sin regla, después de la cadera (`49`), el tobillo (`50`) y el codo (`51`). Con esta, **todas las
zonas del cuerpo tienen regla**. Solo "otra" sigue con el aviso genérico, porque no dice dónde es.

## Lo que se encontró

### Es común, casi siempre mecánico, y no tiene tratamiento propio — CONFIANZA BAJA

- **Briggs et al. 2009**, revisión sistemática de 33 estudios sobre dolor de la columna dorsal (texto
  completo, PMC2720379):
  - es **frecuente**: entre el 15 y el 35 % en un año, según cómo se lo defina;
  - se asocia con dolor en otras zonas, con factores de postura, psicológicos y del entorno;
  - como en la zona lumbar, los signos de desgaste en las imágenes **no se asocian necesariamente
    con dolor**;
  - las causas estructurales que menciona son la osteoporosis con **fractura vertebral**, la
    espondilitis anquilosante, la artrosis y la enfermedad de Scheuermann.
  - DOI 10.1186/1471-2474-10-77
- No se encontró un ensayo de ejercicio específico para el dolor dorsal. La regla toma el criterio
  de la zona lumbar y del cuello (`09`): **mantenerse activo**.

### Las señales que sí informan — CONFIANZA MEDIA

- **Downie et al. 2013**, revisión sistemática de 14 estudios con 53 señales de alarma en el dolor de
  espalda (BMJ, texto completo, PMC3898572). Muchas señales de las guías **casi no cambian la
  probabilidad**. Las que sí:
  - para **fractura**: edad avanzada, **corticoides por mucho tiempo** (33 % después de la prueba),
    **golpe fuerte** (11 %), moretón o raspón (62 %); con varias juntas, 90 %;
  - para **cáncer**: **haber tenido un cáncer** (33 %).
  - DOI 10.1136/bmj.f7095
  - Es sobre dolor lumbar. Se usa acá porque las dos causas que busca, fractura y metástasis, son de
    la columna entera, y la dorsal es donde más aparece la fractura por osteoporosis (Briggs 2009).
- **El dolor dorsal puede venir del corazón.** El ruleset ya tiene la señal de "dolor u opresión en
  el pecho durante el ejercicio" (`redFlags.chest_pain`). El aviso de la zona la repite en el lugar
  donde el socio la va a leer: dolor que va al pecho o al brazo, con falta de aire o sudor, es una
  urgencia.

## La regla

| Severidad | Qué sale | Por qué |
|---|---|---|
| 3 o 4 (dolor) | nada: el aviso | mecánico e inespecífico; quedarse quieto no ayuda (`09`) |
| 5 ("no puedo"), o lesión desde 3 | **carga directa sobre la columna**: peso muerto e hiperextensiones (`lower_back`), encogimientos (`traps`), caminata del granjero (`carry`) | es lo que carga la columna dorsal en vertical; la regla de lesión pide sacar lo que carga la zona |

**Siguen en el plan:**
- remos y dorsalera, con peso que no duela;
- hip thrust y el resto del glúteo: no cargan la columna dorsal.

**Cuándo consultar (`referIf`):**
- golpe o caída fuerte;
- corticoides por mucho tiempo;
- haber tenido un cáncer;
- dolor también quieto y de noche;
- **falta de aire, sudor o dolor que va al pecho o al brazo: urgencia.**

Confianza `low`, como las demás reglas de zona.

## Lo que salió al escribirla

- **Una clave repetida en el JSON.** Al insertar la regla, el `referIf` del codo quedó duplicado en
  el objeto de la espalda alta. `JSON.parse` se queda con el último valor sin avisar, así que la
  espalda alta habría mostrado la señal del codo. Biome lo detecta (`noDuplicateObjectKeys`) y
  `npm run check` lo frena: comprobado agregando una clave duplicada a propósito.

## Cómo se prueba

- El barrido suma a la dimensión molestia: espalda alta con dolor 4 y con lesión 3.
- Unitario:
  - con 4 no sale nada;
  - con 5 salen el peso muerto y los encogimientos, y siguen el remo y el hip thrust;
  - con una lesión de 3 sale el peso muerto;
  - la señal de "cuándo consultar" es la de la espalda alta.
- Matriz: el test de "dos zonas sin regla" se reemplaza por uno que exige que **todas** las zonas
  menos "otra" tengan regla, y que "otra", marcada dos veces, avise una sola vez.
- Falsificado: con `avoidFrom` en 3, falla el unitario.
