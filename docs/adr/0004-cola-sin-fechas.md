# ADR 0004 — El plan es una cola sin fechas

**Estado**: aceptada · 2026-09-04

## Contexto
La gente falta al gimnasio. Un plan atado a días de la semana genera "sesiones vencidas" y obliga a
decidir qué pasa con ellas.

## Decisión
`plan_sessions` se ordena por `sequence_index` y no tiene fecha. "Hoy" es la primera pendiente. La
adherencia se mide contra un objetivo semanal declarado por el usuario, no contra un calendario.

## Alternativa descartada
Semana fija con días asignados. Es más familiar, pero la decisión de qué hacer con las sesiones
perdidas se filtra a la mitad del esquema y de la UI.

## Consecuencias
Faltar dos semanas no genera deuda: genera, como mucho, una propuesta de descarga al volver. Si
alguna vez se quiere una vista de calendario, se deriva de las sesiones completadas, no al revés.
