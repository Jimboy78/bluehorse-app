# Hombro y muñeca: cierran el repaso de los cinco `referIf`

Revisión del 12 de septiembre de 2026, cierre de la serie que empezó en `32` (lumbar) y siguió en
`33` (cuello). Mismo método: comparar el `referIf` que el ruleset ya emite contra la mejor evidencia
disponible para el mecanismo relevante en cada zona.

## Hombro: rotura de manguito rotador — CONFIANZA MEDIA

### Lo que dice el ruleset hoy

```json
{ "bodyRegion": "shoulder", "referIf": "El dolor baja por el brazo con hormigueo, hay debilidad marcada, o la articulación se hinchó después de un esfuerzo." }
```

### Lo que dice la evidencia

Un estudio prospectivo de precisión diagnóstica, 120 pacientes ≥40 años con lesión aguda de hombro
sin fractura visible en radiografía, comparando 13 pruebas físicas contra ecografía como referencia:

> "The highest test accuracy was observed for the inability to abduct above 90°, resisted abduction
> pain and external rotation strength. The sensitivity, specificity and diagnostic odds ratio of the
> inability to abduct the arm above 90° was 84% (95% CI 69-93), 71% (95% CI 59-82) and 12.9 (95% CI
> 4.8-34.2), respectively, and 66% (51-80), 86% (77-93) and 12.4 (5.0-30.8) for external rotation
> strength […] Combining the inability to abduct above 90° and weakness in external rotation
> improved the sensitivity to above 90%."

> Enger M, Schmidt M, Nordsletten L, Moosmayer S, Pripp AH, Melhuus K, Brox JI. *Physical
> examination tests in the acute phase of shoulder injuries with negative radiographs: a diagnostic
> accuracy study.* BMC Musculoskelet Disord. 2025. DOI 10.1186/s12891-025-08754-1 — **verificado:
> metadatos en Crossref, abstract completo en Europe PMC.**

Prevalencia de rotura de espesor completo en esa muestra: **38 %**, casi todas de supraespinoso —
alta, porque es población que ya consultó por una lesión aguda; no extrapola directo a "cualquiera
que sienta hombro" en el gimnasio.

### Comparación

"Debilidad marcada" en el ruleset es **cualitativamente correcto** —la debilidad es la señal que
más pesa— pero **vago frente a lo que la evidencia mide**: la prueba con mejor rendimiento no es
"sentir debilidad" en general, es un umbral concreto y autoevaluable: **no poder levantar el brazo
por encima de la horizontal**. Es la clase de imprecisión de `33` (cuello), no la omisión grave de
`32` (lumbar): el criterio actual apunta en la dirección correcta, pero un socio puede tener
"debilidad marcada" sin saber si eso significa "no llego a los 90°" o "me cuesta un poco más que
ayer".

"Dolor que baja por el brazo con hormigueo" describe mejor una radiculopatía cervical referida que
una rotura de manguito — mismo matiz que ya apareció en `33` para el cuello: no es peligroso
mantenerlo, pero mezcla dos mecanismos distintos bajo un mismo aviso.

## Muñeca: síndrome del túnel carpiano — CONFIANZA BAJA (evidencia más débil que las otras cuatro)

### Lo que dice el ruleset hoy

```json
{ "bodyRegion": "wrist", "referIf": "Hay hinchazón, la muñeca hace ruido al moverla, o hay hormigueo en el pulgar y el índice." }
```

### Lo que dice la evidencia

El túnel carpiano comprime el nervio mediano, cuyo territorio sensitivo cubre **pulgar, índice y
mayor** (dedos 1-3), no solo los dos primeros:

> "Carpal tunnel syndrome is characterized by tingling, numbness, pain, and weakness of the hand,
> particularly in the thumb, index, and middle fingers."

Un estudio transversal reciente valida el examen clínico (Tinel, Phalen) contra electromiografía
como referencia:

> "Clinical examination for CTS showed a sensitivity of 75% and a specificity of 60% compared to
> NCS." — cien pacientes, un solo centro (Peshawar).

> Roghani AS, Farooq J, Ullah W, Roghani FS, Ahmad B, Jan AA, Siddique N, Shahzad F. *Diagnostic
> Accuracy of Clinical Examination for Carpal Tunnel Syndrome: Validation Using Nerve Conduction
> Studies.* Cureus. 2025. DOI 10.7759/cureus.87563 — **verificado: metadatos en Crossref, abstract
> completo en Europe PMC.** Es un estudio transversal de un solo centro, no una revisión sistemática
> — la confianza de este bloque es más baja que la de hombro o lumbar, y se declara así.

### Comparación

**El ruleset omite el dedo mayor.** "Hormigueo en el pulgar y el índice" describe dos de los tres
dedos del territorio del nervio mediano; el tercero (mayor/medio) también es señal clásica y no
está. Es una omisión chica —el pulgar y el índice ya alcanzan para reconocer el patrón— y no cambia
la recomendación (consultar), pero es la misma clase de imprecisión que las otras zonas: el criterio
existe, describe el mecanismo correcto, y queda incompleto en el detalle.

## Veredicto

| Zona | Elemento | Veredicto | Por qué |
|---|---|---|---|
| Hombro | "Debilidad marcada" | **se mantiene, impreciso** | Correcto en esencia; el umbral medido y autoevaluable es "no podés levantar el brazo por arriba de la horizontal", más útil que "debilidad marcada". |
| Hombro | "Hormigueo" asociado al brazo | **dudoso** | Describe mejor un cuadro cervical que uno de manguito rotador, igual que en `33`. |
| Muñeca | "Hormigueo en pulgar e índice" | **incompleto** | Falta el dedo mayor, también territorio del nervio mediano. |

Con esto, los cinco `referIf` del ruleset ya tienen un repaso contra evidencia real: uno con una
omisión seria (`32`, lumbar), tres con imprecisiones menores que no cambian la recomendación
(`33` cuello, y hombro/muñeca acá), y ninguno más queda sin revisar en esta ronda.

## Lo que este documento NO hace

No toca el ruleset. Ninguno de los dos hallazgos de acá tiene la urgencia del lumbar — son mejoras
de precisión, no correcciones de una omisión peligrosa.

## Lo que queda para decidir (dueño)

1. Si conviene cambiar "debilidad marcada" por un criterio autoevaluable concreto ("no podés
   levantar el brazo por arriba de la altura del hombro") en el `referIf` de hombro.
2. Si conviene agregar el dedo mayor al `referIf` de muñeca.
3. Ninguno de los dos es urgente comparado con `32`. Si hay que priorizar, el lumbar va primero.
