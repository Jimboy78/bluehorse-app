# ADR 0006 — `gym_id` en todas las tablas desde el día uno

**Estado**: aceptada · 2026-09-04

## Contexto
El MVP es para un solo gimnasio, pero el plan de negocio es venderlo a otros.

## Decisión
Toda tabla de negocio lleva `gym_id` (o una cadena de claves foráneas que llegue a uno) desde la
primera migración. La UI, en cambio, asume un solo gimnasio: no hay selector ni onboarding de
gimnasios.

## Alternativa descartada
Empezar sin tenencia y agregarla cuando aparezca el segundo cliente: obliga a reescribir cada query,
cada política de RLS y a migrar todos los datos existentes.

## Consecuencias
Hoy no cambia nada visible y cuesta casi nada. El código de gimnasio (`gyms.join_code`) ya está en
el esquema para cuando haga falta asociar socios a un gimnasio concreto.
