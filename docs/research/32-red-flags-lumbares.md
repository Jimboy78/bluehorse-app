# El aviso de "cuándo ir al médico" por dolor lumbar no menciona las dos señales más específicas de cauda equina

Revisión del 12 de septiembre de 2026. Sale de auditar `05-seguridad-reforzada.md`, el único
documento de seguridad que quedaba sin citas verificables (`npm run qa docs` lo marca con 21 filas
sin fuente) y cuyo texto **sí llega a la pantalla**: `safety.painRules[].referIf` se arma con la
prosa de ese documento y `09-dolor-y-lesiones.md` ya activó su emisión. Este no es un hallazgo de
plomería como el de `09` — es de contenido, y en la entrada de más consecuencia de seguridad del
motor.

## Lo que dice el ruleset hoy

```json
{
  "bodyRegion": "lower_back",
  "referIf": "El dolor pasa dos semanas sin mejorar, empeora tras 48 horas de reposo, o aparece hormigueo, debilidad en las piernas o fiebre."
}
```

Cuatro criterios: duración (2 semanas), curso (empeora tras 48 h de reposo), neurológico
(hormigueo/debilidad en piernas), sistémico (fiebre).

## Lo que dice la evidencia sobre qué señales usar

### El consenso internacional de guías — CONFIANZA MEDIA (consenso, sin acuerdo entre guías)

Revisión de 16 guías clínicas de 15 países más la europea, todas sobre dolor lumbar en atención
primaria:

> "Overall, we found 46 discrete red flags related to the four main categories of serious
> pathology: malignancy, fracture, cauda equina syndrome and infection. […] Five [guidelines] did
> not provide any reference to support the choice of red flags, three guidelines presented a
> reference in general, and data on diagnostic accuracy was rarely provided. […] Evidence for the
> accuracy of recommended red flags was lacking."

Es información honesta sobre sus propios límites: ni las guías clínicas reales tienen consenso ni
evidencia de precisión sólida detrás de sus red flags. Pero sí hay algo medible: **cuáles señales
aparecen y con qué frecuencia** en esas 16 guías, que es la mejor aproximación disponible a "esto es
lo que la profesión considera relevante".

> Verhagen AP, Downie A, Popal N, Maher C, Koes BW. *Red flags presented in current low back pain
> guidelines: a review.* Eur Spine J. 2016;25(9):2788-2802. DOI 10.1007/s00586-016-4684-0 —
> **verificado: metadatos en Crossref, abstract completo en Europe PMC.**

### La precisión diagnóstica de las señales de cauda equina — CONFIANZA MEDIA

> "Diagnostic data could be pooled for reduced anal tone, leg pain, back pain, saddle anaesthesia,
> urinary retention, urinary incontinence and bowel incontinence from six of seven studies. The
> pooled sensitivity for the signs and symptoms ranged from 0.19 (95% CI 0.09 to 0.33) to 0.43 (95%
> CI 0.30 to 0.56) while the pooled specificity ranged from 0.62 (95% CI 0.59 to 0.73) to 0.88 (95%
> CI 0.85 to 0.92). Red flags used to identify potential CES appear to be more specific than
> sensitive. As such, when these are present, they should be considered justification for prompt
> diagnostic workup."

7 estudios, 569 participantes, contra RMN como referencia. Traducido a lo que importa acá: estas
señales **casi no sirven para descartar** cauda equina si están ausentes (sensibilidad tan baja como
0,19), pero **si aparecen, son un motivo real para actuar rápido** (especificidad hasta 0,88).

> Dionne N, Adefolarin A, Kunzelman D, Trehan N, Finucane L, Levesque L, Walton DM, Sadi J. *What is
> the diagnostic accuracy of red flags related to cauda equina syndrome (CES), when compared to
> Magnetic Resonance Imaging (MRI)? A systematic review.* Musculoskelet Sci Pract. 2019;42:125-133.
> DOI 10.1016/j.msksp.2019.05.004 — **verificado: metadatos en Crossref, abstract completo en Europe
> PMC.**

Las siete señales que este trabajo pudo medir contra RMN: **tono anal reducido, dolor de pierna,
dolor de espalda, anestesia en silla de montar, retención urinaria, incontinencia urinaria e
incontinencia fecal.**

## El hallazgo

**Las dos señales de mayor especificidad para cauda equina —anestesia en silla de montar e
incontinencia urinaria o fecal— no están en el `referIf` lumbar de Blue Horse.** Lo que sí está
("hormigueo, debilidad en las piernas") corresponde a "dolor de pierna" del listado medido, que es
una señal real pero de las menos específicas del grupo.

Cauda equina por hernia discal es exactamente el tipo de lesión que puede aparecer en un gimnasio —
una peso muerto o un hip thrust con técnica pobre, cargado, es un mecanismo plausible— y es una
emergencia quirúrgica: la ventana para operar sin secuela permanente se mide en horas, no en
semanas. Un socio que lee el aviso actual y no tiene "hormigueo" ni "fiebre" puede leerlo como "no es
para tanto", sin que el aviso le haya preguntado nunca por lo que de verdad distingue esta emergencia
del resto de las lumbalgias.

**Dos criterios del texto actual no aparecen en ninguna de las dos fuentes revisadas:**

- "Dos semanas sin mejorar" no es uno de los 46 red flags que releva Verhagen 2016 ni una de las
  siete señales que mide Dionne 2019. Existe como criterio de "banderas amarillas" (cronicidad,
  pronóstico) en otra literatura, pero no como señal de patología grave que amerite derivación
  urgente — mezclar los dos criterios en la misma frase confunde "consultá pronto" con "andá a
  la guardia".
- "Empeora tras 48 horas de reposo" no coincide con el red flag real y sí reconocido en las guías:
  **dolor en reposo o nocturno** (independiente de si empeoró después de descansar), señal asociada
  a infección o malignidad. Es plausible que el texto original haya intentado parafrasear ese
  criterio y terminó describiendo otra cosa.

## Veredicto

| Elemento del `referIf` lumbar actual | Veredicto | Por qué |
|---|---|---|
| "Hormigueo, debilidad en las piernas" | **se mantiene** | Corresponde a "dolor de pierna" en Dionne 2019: señal real, aunque de sensibilidad y especificidad moderadas. |
| "Fiebre" | **se mantiene** | Red flag de infección, presente en la mayoría de las 16 guías de Verhagen 2016. |
| "Dos semanas sin mejorar" | **dudoso** | No es un red flag de patología grave en ninguna de las dos fuentes; es un criterio de cronicidad, no de urgencia. |
| "Empeora tras 48 horas de reposo" | **dudoso, posible paráfrasis incorrecta** | El red flag real es "dolor en reposo/nocturno", no "empeora después de reposar". |
| Ausencia de anestesia en silla de montar | **falta** | Es, junto con incontinencia, la señal más específica de cauda equina (especificidad hasta 0,88) y la app no la menciona. |
| Ausencia de incontinencia urinaria/fecal o retención urinaria | **falta** | Mismo motivo. Es la señal que distingue una emergencia quirúrgica de una lumbalgia común. |

## Lo que este documento NO hace

No toca `packages/engine/src/rulesets/v1-research.json`. Cambiar el texto de un `referIf` es
contenido de seguridad que le llega directo al socio: **es decisión de quien firma ese texto, no de
esta auditoría.** Lo que corresponde acá es dejar medida la brecha entre lo que dice el ruleset y lo
que la evidencia marca como las señales de mayor especificidad, con las fuentes verificadas al lado.

## Lo que queda para decidir (dueño)

1. **Agregar anestesia en silla de montar e incontinencia/retención urinaria** al `referIf` de
   `lower_back`. Es el cambio con más consecuencia de seguridad de todos los que dejó esta
   auditoría: la diferencia entre un socio que reconoce una emergencia quirúrgica y uno que no.
2. **Revisar o sacar "dos semanas sin mejorar" y "48 horas de reposo"**, o reemplazarlos por el red
   flag real (dolor en reposo o nocturno) si la intención original era ese.
3. **Mismo ejercicio para las otras cuatro zonas** (rodilla, hombro, muñeca, cuello): este documento
   solo auditó lumbar porque es donde cauda equina hace que la brecha importe más, pero
   `05-seguridad-reforzada.md` tampoco tiene citas para las otras cuatro filas de su tabla de zonas.
