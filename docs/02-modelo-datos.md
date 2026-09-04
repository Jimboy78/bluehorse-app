# Modelo de datos

Fuente de verdad: `supabase/schemas/*.sql`. Los tipos de TypeScript que consume el motor están en
`packages/domain/src/entities.ts`; los generados desde la base real, en `database.types.ts`
(`npm run db:types`).

## La espina

```
exercises ──┐
equipment ──┴──▶ plan_session_items ──▶ set_logs ──▶ adaptation_proposals
                        ▲                                    │
profiles ──▶ plans ──▶ plan_sessions                         │
                        ▲                                    │
                        └──── propone, el usuario confirma ◀──┘
```

## Los cinco dominios

**Catálogo** (`gyms`, `equipment`, `exercises`, `exercise_equipment`, `exercise_substitutions`) —
lo cargás vos con fotos.

**Usuario** (`profiles`, `user_goals`, `user_constraints`, `user_baselines`,
`user_equipment_settings`) — sale del onboarding.

**Plan** (`rulesets`, `plans`, `plan_sessions`, `plan_session_items`) — lo genera el motor.

**Ejecución** (`workout_logs`, `set_logs`, `session_events`, `pain_reports`) — lo escribe el socio
en el gimnasio.

**Adaptación** (`adaptation_proposals`, `personal_records`) — el motor propone, el socio confirma.

## Las cuatro decisiones que importan

### Un ejercicio no es una máquina

El ejercicio es un patrón ejecutable ("press horizontal"); la máquina es un fierro que existe en
Blue Horse. La relación es N:N (`exercise_equipment`). Eso permite tres cosas que de otra forma no
se pueden: sustituir cuando la máquina está ocupada, que la investigación hable de patrones sin
conocer este gimnasio, y que sumar un segundo gimnasio sea mapear su equipamiento y nada más.

### La carga se guarda dos veces

`load_value` + `load_unit` es lo que dice la máquina: `45 lb`, `pin 7`, `60 kg`. Es lo único que se
le muestra al socio. `load_kg_normalized` existe para gráficos y comparaciones, y es **`null`**
cuando no se puede convertir sin inventar: un pin sin tabla de kg cargada, una banda elástica, peso
corporal. Ese `null` se propaga; no se reemplaza por cero.

Blue Horse mezcla kg, libras, pines de polea y discos en la misma sala. Por eso la unidad es
propiedad de cada estación, no una preferencia global.

### La cola no tiene fechas

`plan_sessions.sequence_index` ordena. No hay `scheduled_date` y no debería aparecer nunca: es la
decisión que evita el problema de las sesiones vencidas.

### Planificado y real no se pisan

`plan_session_items` guarda lo que el motor propuso. `set_logs` guarda lo que la persona hizo. La
diferencia entre ambos es exactamente la señal que alimenta la adaptación. `session_events` guarda
por qué se desvió — incluido `machine_occupied`, que a los seis meses es un dato vendible al
gimnasio ("esta máquina está siempre ocupada a las 19").

## Acceso

RLS activo en todas las tablas (`08_rls.sql`). Cada socio ve solo sus datos. El catálogo lo lee todo
el gimnasio y lo escribe solo staff. **`pain_reports` no tiene excepción para admin**: es dato de
salud y no se comparte con el gimnasio.

## Idempotencia

`workout_logs.client_id` y `set_logs.client_id` son únicos y los genera el teléfono. Son el ancla de
la cola offline: sin eso, un reintento duplica series.
