# ADR 0002 — Supabase como backend

**Estado**: aceptada · 2026-09-04

## Contexto
Un solo desarrollador, sin infraestructura previa. El dominio necesita agregaciones reales: series
por grupo muscular por semana, evolución de carga por ejercicio, adherencia.

## Decisión
Supabase: Postgres, Auth (Google y email), Storage para las fotos, RLS para el aislamiento entre
socios y entre gimnasios, y Edge Functions para lo que necesite correr del lado del servidor.

## Alternativas descartadas
- **Firebase**: el modelo documental convierte las agregaciones en denormalización a mano.
- **Backend propio (Node/Fastify + Postgres)**: dos o tres semanas construyendo auth, storage y
  migraciones que no agregan nada al producto.

## Consecuencias
Los datos son Postgres puro, así que la salida está abierta. El plan gratuito pausa proyectos
inactivos: antes de una demo hay que verificar que el proyecto esté despierto.
