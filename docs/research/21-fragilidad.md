# Fragilidad: medible, pero lo que se haría con el resultado no tiene respaldo

Auditoría del 9 de septiembre de 2026, segunda vuelta, hueco 6 de 6.

Hueco abierto en `08-edad.md`. El ruleset le aplicaba a todo mayor de 60 la recomendación pensada
para adultos **frágiles** —menos carga, más repeticiones, más descanso— y eso resultó mal: en
mayores sanos la carga alta es superior y no produce más caídas ni más eventos adversos. Se corrigió.
Pero al corregirlo quedó al descubierto lo que de verdad importaba: **la fragilidad no es la edad, y
la app no la mide.**

La pregunta era si vale la pena que la app intente medirla, y con qué.

**Veredicto: medible con reservas. Pero medir no es el problema — el problema es que no hay con qué
responder.**

## Lo que dice la evidencia

### Existe un instrumento de 5 preguntas, autoinformado y validado — CONFIANZA MEDIA

La escala FRAIL: fatiga, resistencia, ambulación, enfermedades y pérdida de peso. Cinco ítems, sin
dinamómetro, sin cronómetro y sin nadie presente. Es el único de los instrumentos revisados que una
app podría aplicar sola.

> "Cross-sectionally the FRAIL scale correlated significantly with IADL difficulties, SPPB, grip
> strength and one-leg stand […] Being frail at baseline significantly predicted future ADL
> difficulties, IADL difficulties, and mortality in both groups"

> Morley JE, Malmstrom TK, Miller DK. *A simple frailty questionnaire (FRAIL) predicts outcomes in
> middle aged African Americans.* J Nutr Health Aging. 2012;16(7):601-608.
> DOI 10.1007/s12603-012-0084-2 — **verificado, abstract leído (PMID 22836700)**

**Dos limitaciones que el informe no mencionó y que aparecieron al abrir el paper:**

1. **La población de validación son afroamericanos de 49 a 65 años**, no adultos mayores en general.
   El estudio dice "late middle-aged". Aplicarlo a un socio de 75 años es extrapolar.
2. **El abstract no reporta AUC ni sensibilidad.** El informe atribuía "AUC 0,75-0,83, sensibilidad
   64-86 %, especificidad 80-88 %" a esta escala; esos números no están en la fuente que citó. No
   entran.

Lo que el paper sí sostiene es que la escala **predice deterioro funcional y mortalidad**. Es un
instrumento de cribado clínico, y para eso está validado.

### El fenotipo de referencia sigue siendo Fried, y no es autoinformable

> Fried LP, Tangen CM, Walston J, et al. *Frailty in Older Adults: Evidence for a Phenotype.*
> J Gerontol A Biol Sci Med Sci. 2001;56(3):M146-M157. DOI 10.1093/gerona/56.3.m146 —
> **verificado en Crossref**

Tres de sus cinco criterios exigen medición presencial (fuerza de agarre con dinamómetro, velocidad
de marcha cronometrada, actividad física por cuestionario largo). Queda fuera de una PWA.

### Lo que cambiaría en la prescripción: sin respaldo utilizable — CONFIANZA BAJA

Acá se cae el hueco. El informe propuso multiplicadores concretos —intensidad inicial × 0,6,
velocidad de progresión × 0,5, descanso +60 s— y los marcó él mismo como **criterio propio derivado
de 2-3 ECAs pequeños (n = 30-50)**, no de consenso de metaanálisis.

Y en la tabla de parámetros que acompañaba, **series, repeticiones y frecuencia son idénticas a las
del adulto mayor sano.** O sea que lo único que el informe propone cambiar es exactamente lo que la
iteración 1 de esta auditoría tuvo que sacar por infundado, ahora reintroducido para un subgrupo que
la app no puede identificar con certeza.

El Position Stand de la NSCA para adultos mayores existe y está verificado
(Fragala MS, Cadore EL, Dorgo S, et al. *Resistance Training for Older Adults: Position Statement
From the National Strength and Conditioning Association.* J Strength Cond Res. 2019;33(8):2019-2052.
DOI 10.1519/JSC.0000000000003230 — verificado en Crossref, y **atribuido a autores inventados en el
informe**), pero no se leyó su texto completo en esta iteración, así que no se usa como fuente de
números.

## Qué se cambió

**Nada.** No se agregó el campo, ni el paso de onboarding, ni ningún modificador.

El razonamiento es el de la regla dura 3, y también el de la 4:

- **Medir sin poder responder es peor que no medir.** Si la app le hace cinco preguntas a un socio de
  70 años, le dice "sos frágil" y después le prescribe exactamente las mismas series y repeticiones
  que a cualquier otro, le cobró una pregunta y le devolvió una etiqueta. Peor: una etiqueta con
  consecuencias emocionales y sin consecuencia práctica.
- **Los multiplicadores propuestos no tienen respaldo.** Meterlos sería repetir el error que la
  iteración 1 corrigió: un ajuste conservador por categoría, sin evidencia de que mejore nada, que
  empuja fuera de la ventana donde la intensidad es el predictor más fuerte.
- **Es una sexta pregunta que no cambia el plan.** `15-baselines.md` ya cuenta cinco: `sex`,
  `weightKg`, `heightCm`, `sessionMinutesTarget` y `baselineMode`. Agregar otra del mismo tipo, en la
  misma auditoría que las señaló, sería ir para atrás.

**Queda como decisión de producto**, con el material listo: el instrumento existe, es aplicable, y lo
que falta es qué hacer con el resultado.

## Si algún día se implementa, esto es lo que hay

Los cinco ítems del FRAIL, redactados para el formulario. **1 punto por cada sí; ≥3 = frágil, 1-2 =
prefrágil, 0 = robusto.** El corte es el del instrumento, no inventado.

1. **Fatiga** — "¿Te sentís cansado la mayor parte del tiempo?"
2. **Resistencia** — "¿Te cuesta subir un piso por escalera sin parar?"
3. **Ambulación** — "¿Te cuesta caminar una cuadra?"
4. **Enfermedades** — "¿Tenés cinco o más problemas de salud diagnosticados?"
5. **Peso** — "¿Bajaste más del 5 % de tu peso en el último año sin proponértelo?"

Lo que **no** hay es la otra mitad: qué prescripción le corresponde a quien puntúa ≥3.

## Lo que esta investigación NO cubre

- **Qué prescribir a una persona frágil.** Es la pregunta central del hueco y quedó sin responder con
  evidencia utilizable. Sin esto, medir no sirve.
- **A partir de qué punto la app no debería prescribir sola.** El informe dio una lista de criterios
  de derivación, pero apoyada en las mismas fuentes de confianza media y sin poder distinguir cuáles
  vienen de una guía y cuáles de su criterio. `safety.screening` ya cubre el bloqueo por autorización
  médica, y `specialPopulations` —que sigue en la lista de deuda— cubriría parte del resto.
- **Presarcopenia.** Requiere medir masa muscular. No es medible por una app y no hay vuelta.
- **Si el FRAIL vale fuera de su población de validación.** Validado en 49-65 años, afroamericanos.
  El socio típico de Blue Horse no está en esa muestra.
- **La fragilidad como campo del dominio.** No existe, y agregarlo obliga a migración de esquema.
  Antes de eso hay que tener la respuesta, no la pregunta.
