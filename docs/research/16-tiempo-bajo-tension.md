# Tiempo bajo tensión: no se prescribe

Auditoría del 9 de septiembre de 2026, segunda vuelta, hueco 1 de 6.

Hueco abierto en `08-edad.md`: en la meta-regresión de Borde 2015 el tiempo bajo tensión salió
predictor significativo de la ganancia de fuerza (p < 0,01), con un óptimo reportado de 6,0 segundos
por repetición, y el motor no prescribe tempo en absoluto. La pregunta era si eso es una falta.

**Veredicto: NO SE PRESCRIBE.** Y no por falta de evidencia, que es como cerraron otros huecos de
esta tanda: hay evidencia de primera línea, y dice que no.

## Lo que dice la evidencia

### El TUT no impacta los resultados de forma consistente — CONFIANZA ALTA

Position Stand del American College of Sports Medicine, publicado en abril de 2026. Es una
**revisión de revisiones**: sintetiza 137 revisiones sistemáticas con más de 30.000 participantes, y
actualiza el Position Stand de 2009 que era la fuente del que salían varios de los números que esta
auditoría ya corrigió.

Del apartado de resultados, textual:

> "Training to momentary muscle fatigue, equipment type, exercise complexity, set structure,
> **time under tension**, blood flow restriction, and periodization **did not consistently impact
> training outcomes**."

Y lo que sí:

> "voluntary strength was enhanced by lifting heavier loads (≥80% one-repetition maximum), through a
> complete range of motion, for 2-3 sets, at the beginning of training sessions, and ≥2 sessions/wk.
> Muscle hypertrophy was enhanced by higher volumes (≥10 sets/wk) and eccentric overload. Power was
> enhanced by moderate loads (30%-70% one-repetition maximum), low-to-moderate volume
> (≤24 repetitions⋅sets), Olympic-style weightlifting, and power RT (fast concentric phase)."

> Currier BS, D'Souza AC, Fielding Singh MA, et al. *American College of Sports Medicine Position
> Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance
> in Healthy Adults: An Overview of Reviews.* Med Sci Sports Exerc. 2026;58(4):851-872.
> DOI 10.1249/MSS.0000000000003897 — **verificado, abstract completo leído vía PubMed
> (PMID 41843416)**

### Por qué el hallazgo de Borde no se traslada

Tres razones, en orden de peso:

1. **Es una meta-regresión, no una comparación.** Borde no asignó gente a tempos distintos: modeló
   la asociación entre el TUT reportado y el efecto observado, sobre estudios que diferían también
   en carga, series y frecuencia. Una asociación en esas condiciones no separa el tempo del volumen.
2. **La población es 60-90 años.** Es el mismo estudio del que salió la ventana de intensidad de
   `modifiers.olderAdults`, y allí se usó porque midió directamente esa edad. Acá el problema es el
   inverso: el efecto no está replicado fuera de esa población.
3. **Un tempo más lento con la misma carga cambia el volumen.** Si el TUT sube porque cada
   repetición dura más, el trabajo total cambió; atribuirle el efecto al tempo es atribuírselo a la
   variable que se movió de arrastre.

### Y aunque se prescribiera, no se podría cumplir

Una prescripción de tempo sin metrónomo ni nadie que cuente es incumplible. El informe aportó
números de adherencia decreciente en el tiempo, pero **no se pudo verificar la fuente** (venía como
un enlace a ScienceDirect sin DOI ni autores), así que no entra como dato. Queda como argumento
estructural, no como cifra: la app prescribe a alguien que entrena solo.

## Qué se cambió

**Nada en el código ni en el ruleset.** El hueco cierra como limitación declarada: el motor no
prescribe tempo porque la mejor evidencia disponible dice que el tempo no impacta los resultados de
forma consistente cuando volumen e intensidad están igualados.

Esto es distinto de los huecos que cierran por falta de evidencia. Acá la respuesta es positiva y
tiene un Position Stand detrás: **prescribir tempo agregaría una instrucción incumplible sin ganancia
medida.** No hay nada que construir.

## Lo que este Position Stand toca fuera de este hueco

El hallazgo grande de esta iteración no es el tempo: es que apareció una fuente de primera línea,
posterior a todo el ruleset, que se cruza con bloques ya auditados. Se registra acá y **no se aplicó
nada de esto** — el abstract no alcanza para tocar números, y las reglas del proyecto son explícitas
sobre citar resultados leyendo el paper.

| Bloque del ruleset | Qué dice el ACSM 2026 | Estado |
|---|---|---|
| `strength.primary.intensityPct1RM: [85, 100]` | fuerza mejora con **≥80 %** 1RM | El 85-100 cae dentro, pero el piso evidenciado es 80. **Dato nuevo para la decisión de producto declarada en `12-objetivo.md`** |
| `power` (30-60 % 1RM), `confidence: "low"` | potencia mejora con **30-70 %**, volumen ≤24 rep·series, fase concéntrica rápida | La ventana del ruleset cae dentro. La nota de confianza dice "poco consenso sobre volumen" y el ACSM sí da volumen: **la confianza podría estar subestimada.** No se cambió: subir una confianza leyendo un abstract es el atajo que el proyecto prohíbe |
| `hypertrophy.weeklyVolume.optimalSetsPerMuscle: [10, 20]` | hipertrofia mejora con **≥10 series/semana** | Concuerda |
| frecuencia | fuerza mejora con **≥2 sesiones/semana** | Concuerda con `11-frecuencia-semanal.md` |
| orden de la sesión | fuerza mejora entrenando **al principio de la sesión** | El motor ya pone el primario primero |
| amplitud de recorrido | fuerza mejora con **recorrido completo** | **No existe en el ruleset ni en el catálogo.** Hueco nuevo |

**Acción recomendada, no tomada:** conseguir el texto completo de este Position Stand y hacerle una
iteración propia. Es la fuente más fuerte que tocó el proyecto y llegó después de que el ruleset
estuviera escrito.

## Lo que esta investigación NO cubre

- **Si el tempo importa para otra cosa que fuerza e hipertrofia.** El Position Stand cubre función
  muscular, hipertrofia y rendimiento físico en **adultos sanos**. No dice nada sobre tempo en
  rehabilitación, ni en tendinopatía, donde la carga lenta y controlada sí tiene literatura propia.
- **La precisión con la que la gente ejecuta un tempo prescrito.** Sigue sin fuente verificada. Como
  no se prescribe tempo, no bloquea nada.
- **El "eccentric overload" que el ACSM sí respalda para hipertrofia.** Es una variable distinta del
  tempo —carga excéntrica aumentada, no repetición lenta— y el catálogo no tiene con qué expresarla.
  Se cruza con el hueco 3 de esta tanda, que quedó sin poder construirse.
