# El aviso de cuello: bien orientado, con una señal que apunta a otro lado

Revisión del 12 de septiembre de 2026, continuación de `32-red-flags-lumbares.md` sobre el mismo
documento sin citas (`05-seguridad-reforzada.md`). Mismo método: comparar el `referIf` que ya se
emite contra el consenso clínico vigente, en la única zona restante donde el mecanismo (isquemia
vertebrobasilar) puede ser grave.

## Lo que dice el ruleset hoy

```json
{ "bodyRegion": "neck", "referIf": "Aparecen mareos, náuseas, visión borrosa u hormigueo en los brazos." }
```

## Lo que dice el consenso clínico

El marco de referencia vigente para señales de disfunción arterial cervical (isquemia
vertebrobasilar, disección de arteria vertebral o carótida) es el **marco IFOMPT**, consenso
internacional de fisioterapia manual musculoesquelética, en su versión más reciente:

> "Developed through rigorous consensus methods, the International IFOMPT Cervical Framework
> guides assessment of the cervical spine region for potential vascular pathologies of the neck in
> advance of planned interventions. […] Vascular pathologies may be recognizable if the appropriate
> questions are asked during the patient history-taking process."

> Rushton A, Carlesso LC, Flynn T, Hing WA, Rubinstein SM, Vogel S, Kerry R. *International
> Framework for Examination of the Cervical Region for Potential of Vascular Pathologies of the Neck
> Prior to Musculoskeletal Intervention: International IFOMPT Cervical Framework.* J Orthop Sports
> Phys Ther. 2023;53(1):7-22. DOI 10.2519/jospt.2022.11147 — **verificado: metadatos en Crossref,
> abstract en Europe PMC.** Es un position statement de consenso, no un metaanálisis: no hay
> estadísticas de sensibilidad/especificidad que citar, y así se lo declara.

Es un consenso, no una medición: **confianza MEDIA**, igual que el resto de los `painRules` de
`09-dolor-y-lesiones.md`.

La literatura de fisioterapia manual resume las señales de isquemia de tronco encefálico con la
nemotecnia **"5 Ds y 3 Ns"**: *Dizziness* (mareo), *Diplopia* (visión doble), *Dysarthria* (habla
arrastrada), *Dysphagia* (dificultad para tragar), *Drop attacks* (caídas súbitas sin aviso);
*Nausea* (náusea), *Numbness* (entumecimiento — típicamente **facial**, peribucal), *Nystagmus*
(movimiento ocular involuntario).

## Comparación

| Señal del marco clínico | ¿Está en el `referIf` actual? |
|---|---|
| Mareo | sí — "mareos" |
| Náusea | sí — "náuseas" |
| Diplopia / alteración visual | parcial — "visión borrosa" describe otra cosa que la diplopia (visión doble), pero apunta a la misma familia de señal |
| Entumecimiento **facial** | **no** — el ruleset dice "hormigueo en los brazos", que es la señal de una radiculopatía cervical (compresión de raíz nerviosa), un cuadro distinto y mucho menos urgente |
| Habla arrastrada, dificultad para tragar, caídas súbitas, nistagmo | no — pero son señales que en la práctica nota un tercero, no la persona misma en medio de una serie; menos aptas para un aviso de autoevaluación |

**El aviso está mejor orientado que el lumbar**, y no tiene la omisión grave que sí tiene `32`: cubre
dos de las señales más reconocibles (mareo, náusea) y la dirección del error es la más segura posible
—sobre-derivar por hormigueo en el brazo, que igual amerita mirar aunque sea por otra causa, no
sub-derivar una emergencia—.

**Lo que sí está desalineado:** "hormigueo en los brazos" no es la señal que el marco clínico asocia
a isquemia vertebrobasilar (esa es entumecimiento **facial**). Tal como está, el texto puede generar
una alarma por el motivo equivocado —confundir una cervicobraquialgia común con una urgencia
vascular— sin que eso sea peligroso: en cualquier caso el consejo es el mismo, consultar. No es el
tipo de brecha de `32`, donde faltaba la señal que de verdad importa.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| "Mareos, náuseas" | **se mantiene** | Coinciden con el marco IFOMPT vigente. |
| "Visión borrosa" | **se mantiene, con matiz** | La familia de señal es correcta; el término preciso del marco es diplopia (visión doble), no visión borrosa en general. |
| "Hormigueo en los brazos" | **dudoso** | No es la señal vascular del marco (esa es entumecimiento facial); es una señal de otro cuadro (radiculopatía cervical), no urgente. Mantenerla no es peligroso, pero mezclar los dos cuadros bajo un mismo aviso de "esto puede ser grave" puede generar alarma o confusión sin necesidad. |

## Lo que este documento NO hace

No toca el ruleset. A diferencia de `32`, acá no hay una omisión que ponga en riesgo a alguien —es
una imprecisión de redacción, no una ausencia de la señal que más importa.

## Lo que queda para decidir (dueño)

1. Si conviene precisar "hormigueo en los brazos" → "entumecimiento en la cara" para alinear con el
   marco IFOMPT, o dejarlo como está porque cualquier hormigueo nuevo amerita igual consultar y
   simplificar el texto vale más que la precisión clínica exacta en una app sin supervisión.
2. Mismo trabajo pendiente para hombro y muñeca, que quedan como las últimas dos zonas de
   `05-seguridad-reforzada.md` sin auditar contra evidencia real.
