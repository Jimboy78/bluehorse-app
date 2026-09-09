# Arrancar sin test de 1RM: la brecha de fuerza no se cierra

Auditoría del 9 de septiembre de 2026, segunda vuelta, hueco 5 de 6.

Hueco abierto en `15-baselines.md`: las fórmulas de estimación de 1RM que `04` propone
(Epley, Brzycki) nunca se implementaron, `user_baselines` se lee y no se escribe nunca, y
`targetLoad` es `null` en todos los ítems de todos los planes.

La pregunta era cómo se llega a una carga inicial segura y suficiente sin hacer un test máximo.

**Veredicto: no se cierra la brecha del objetivo fuerza sin un test.** El informe de investigación lo
admite explícitamente, y las fuentes verificadas lo respaldan.

## El problema, en dos números que ya estaban en el proyecto

| | |
|---|---|
| Lo que la gente elige cuando se la deja elegir | **53 %** de su 1RM (IC creíble 49-58 %, 18 estudios) |
| Lo que la fuerza necesita | **≥70 %** 1RM |

> Steele J, Malleron T, Har-Nir I, et al. *Are Trainees Lifting Heavy Enough? Self-Selected Loads in
> Resistance Exercise: A Scoping Review and Exploratory Meta-analysis.* Sports Med. 2022.
> DOI 10.1007/s40279-022-01717-9 — **verificado en Crossref**

> Lopez P, Radaelli R, Taaffe DR, et al. *Resistance Training Load Effects on Muscle Hypertrophy and
> Strength Gain: Systematic Review and Network Meta-analysis.* Med Sci Sports Exerc. 2020.
> DOI 10.1249/MSS.0000000000002585 — **verificado en Crossref**

Y el ACSM 2026 pone el piso todavía más arriba, en **≥80 %** para fuerza
(ver `16-tiempo-bajo-tension.md`). La brecha, entonces, es mayor de lo que decía el enunciado.

## Lo que dice la evidencia sobre la única señal que la app tiene

La app no tiene dinamómetro, ni sensor de velocidad, ni nadie mirando. Lo único que puede preguntar
es el RIR. La pregunta real es si esa señal sirve.

### El RIR es preciso cerca del fallo, y la experiencia no lo mejora — CONFIANZA ALTA

Press de banca a 75 % 1RM, 24 sujetos entrenados (12 varones, 12 mujeres), avisando cuándo percibían
1 RIR y 3 RIR sobre series llevadas al fallo:

| Medida | Valor |
|---|---|
| Error crudo (dirección) | **−0,17 ± 1,00** repeticiones |
| Error absoluto (magnitud) | **0,65 ± 0,78** repeticiones |

> Refalo MC, Remmert JF, Pelland JC, et al. *Accuracy of Intraset Repetitions-in-Reserve Predictions
> During the Bench Press Exercise in Resistance-Trained Male and Female Subjects.* J Strength Cond
> Res. 2024;38(3):e78-e85. DOI 10.1519/JSC.0000000000004653 — **verificado, abstract leído
> (PMID 37967832)**

Y en máquinas monoarticulares, con 58 participantes (27 varones, 31 mujeres) de experiencia muy
dispar (66 ± 9 meses contra 22 ± 4 meses):

> "no covariates of sex (p = 0.917), training experience (p = 0.462) nor experience rating RIR
> significantly affected RIRDIFF. There were significant main effects for the **proximity to failure**
> of the prediction and the set number (p < 0.01)"

> Remmert JF, Laurson KR, Zourdos MC. *Accuracy of Predicted Intraset Repetitions in Reserve (RIR) in
> Single- and Multi-Joint Resistance Exercises Among Trained and Untrained Men and Women.* Percept
> Mot Skills. 2023. DOI 10.1177/00315125231169868 — **verificado, abstract leído (PMID 37036795)**

Las dos cosas juntas dicen algo útil y algo incómodo:

- **Útil:** cerca del fallo el RIR es bueno — menos de una repetición de error. Es una señal
  aprovechable.
- **Incómodo:** **la experiencia no lo mejora.** Cruza con `10-nivel-de-experiencia.md`, donde ya se
  había encontrado que el nivel declarado no distingue casi nada. Un socio avanzado no estima mejor
  su RIR que uno nuevo.
- **Y lo que rompe el plan:** la precisión depende de la **proximidad al fallo**. Lejos del fallo —que
  es exactamente donde está alguien que eligió el 53 % de su 1RM— la señal se degrada. El RIR es
  buen termómetro justo donde no hace falta, y malo donde haría falta.

## Por qué la brecha no se cierra

Para saber que alguien está al 70 % de su 1RM hay que conocer su 1RM. Las tres vías posibles:

1. **Test máximo.** Es lo que la app decidió no hacer, y por buenas razones: prescribe sin
   supervisión presencial.
2. **Estimación desde series submáximas** (Epley, Brzycki). Requiere una serie llevada cerca del
   fallo con la carga conocida — o sea, requiere que la persona ya esté levantando cerca de su
   máximo. Si arranca en 53 %, la ecuación no tiene de dónde estimar.
3. **Perfil carga-velocidad.** Requiere sensor o video. La PWA no lo tiene, y la única fuente que el
   informe ofreció para esta vía **es una cita fabricada** (ver nota al pie).

Lo que sí funciona, y ya está construido, es la vía indirecta: **`reviewProgress` propone contra lo
que la persona realmente hizo**, no contra un porcentaje de un máximo que nadie midió. La progresión
sale de `set_logs`. Es más lenta que arrancar en el punto correcto, pero no requiere conocer el 1RM y
no pone a nadie a levantar al límite sin supervisión.

## Qué se cambió

**Nada.** El diseño actual —series, repeticiones y RIR, con el socio eligiendo el peso— es la
respuesta correcta a la restricción que la app se impuso, y la evidencia no ofrece una alternativa
sin test.

No se implementaron Epley ni Brzycki: sin un baseline que las alimente no tienen entrada, y
`user_baselines` sigue sin escribirse nunca. Implementarlas ahora sería agregar código muerto, que
es el patrón que `13` puso bajo test.

**Lo que queda declarado, y es lo que importa:** para el objetivo `strength`, un socio que elige su
propia carga probablemente entrene por debajo del umbral que la evidencia pide, y la app **no tiene
forma de detectarlo**. No es una limitación de implementación: es una consecuencia de prescribir sin
supervisión.

## Lo que esta investigación NO cubre

- **El error real de Epley y Brzycki.** El informe dio "±2-5 % en 2-10 repeticiones" sin cita
  verificable por tramo. Como no se implementaron, no bloquea nada — pero si algún día se implementan,
  ese número hay que buscarlo de nuevo.
- **Cuánto progreso se pierde por arrancar liviano.** El informe dio una estimación de 1-2 semanas por
  ejercicio, sin fuente verificable. Queda sin responder.
- **Protocolos de calibración validados.** El informe describió uno de tres sesiones, pero como
  propuesta propia: no aportó ninguno validado. La pregunta 2 del prompt queda sin respuesta.
- **Si conectar `user_baselines` cambiaría algo.** Es una de las decisiones de producto declaradas en
  `15-baselines.md`, y esta iteración no la mueve. Lo que sí agrega es un argumento en contra de la
  rama "declarada" del onboarding: si la gente subestima su propia carga elegida en un 53 %, su
  autorreporte de cuánto levanta hereda ese problema.

## Nota sobre las fuentes de esta iteración

El informe citó `10.1007/s40279-021-01467-0` como "Weakley et al. 2021, metaanálisis de datos
individuales sobre perfiles carga-velocidad para predecir el 1RM". **Ese DOI resuelve a un
corrigendum del consenso FIMS 2021 sobre atletas transgénero.** Toda la sección de perfil
carga-velocidad del informe colgaba de esa cita y se descartó entera. También le atribuyó a Lopez
2020 un título de position stand sobre COVID-19, y citó un preprint de arXiv cuyo identificador no
resuelve — los preprints están prohibidos por las reglas de fuente del proyecto. Los datos que
quedaron acá son los que se leyeron en el abstract original.
