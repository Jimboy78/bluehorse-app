# Roadmap

Cinco fases. Cada una termina en algo usable, no en "avance".

## Fase 0 — Relevamiento (sin código) · **pendiente, es tuya**

Fotos, planilla de equipamiento y lista de ejercicios canónicos. Ver `05-relevamiento-catalogo.md`.

**Entregable**: planilla completa y carpeta de fotos.

## Fase 1 — Esqueleto y catálogo · **en curso**

- [x] Monorepo, tooling, CI, hooks de git
- [x] Contrato del motor, ruleset provisorio, motor placeholder con tests
- [x] Esquema completo con `gym_id` y RLS — **verificado contra Postgres real** (local, Docker):
  20 tablas, RLS activo en todas, 26 políticas, seed aplicado limpio
- [x] Cliente de Supabase, cola offline, PWA con service worker
- [x] Auth con Google y email (routing, sesión, pantalla de acceso)
- [x] Onboarding mínimo (wizard de 4 pasos, actualiza `profile` y crea el primer `user_goal`)
- [x] Lector del catálogo real (`useGymCatalog`): lee equipment/exercises/exercise_equipment de
  Supabase, cae al gimnasio placeholder si el gym no tiene equipamiento cargado — el aviso de
  "datos de ejemplo" se apaga solo cuando eso deje de pasar
- [x] Seed con 13 estaciones de ejemplo + 16 mapeos, para que el lector de arriba tenga algo real
  contra qué probar sin esperar el relevamiento
- [x] Panel admin (`/panel`, gated por `role`): alta de equipamiento con foto (bucket de Storage
  con RLS: lectura pública, escritura solo staff/admin), categoría, unidad de carga con campos
  condicionales, ubicación, notas
- [ ] Panel admin: alta y mapeo de ejercicios (falta; hoy solo equipamiento)
- [ ] Catálogo de Blue Horse cargado (bloqueado por Fase 0, no bloquea el resto del desarrollo)

**Entregable**: el catálogo real, navegable desde la app.

## Fase 2 — Motor y sesión

- [ ] Generación de plan desde el catálogo real, persistida
- [ ] Pantalla "Hoy": qué toca, botón de empezar, adherencia
- [ ] Pantalla de sesión: los ejercicios del día, orden sugerido pero libre
- [ ] Detalle de ejercicio: series pre-cargadas, confirmar de a un toque
- [ ] Cronómetro de descanso, con registro del descanso real
- [ ] Cierre de sesión: sensación, molestias, resumen

**Entregable**: podés dejar el Excel y usarla vos.

## Fase 3 — Adaptación, progreso y offline

- [ ] Propuestas de ajuste con motivo, aceptar o rechazar
- [ ] Sustitución por máquina ocupada
- [ ] Progreso: evolución por ejercicio, adherencia y racha, volumen semanal, récords
- [ ] Cola offline enchufada de punta a punta
- [ ] Pantalla de instalación (destino del QR)

**Entregable**: demo presentable a Blue Horse.

## Fase 4 — Contenido real

- [ ] Curación de la investigación al esquema de ruleset
- [ ] Ruleset `source: "research"` activo
- [ ] Regeneración de planes y comparación contra los provisorios
- [ ] Las marcas de "provisorio" se apagan solas

**Entregable**: una app que se le puede cobrar a alguien.

## Fuera de alcance del MVP

Nutrición · wearables y Apple Health · videos de técnica propios · chat con entrenador · social y
rankings · panel para entrenadores con vista de alumnos · pagos y suscripción · notificaciones push
· periodización por bloques con calendario · ocupación de máquinas en tiempo real · entrenar fuera
de Blue Horse · exportar a Excel o PDF.

## Definiciones pendientes tuyas

**Bloquean**: alcance del ruleset (¿los seis objetivos o arrancamos con tres?), política de
seguridad y legal (disclaimer médico, qué hace la app ante dolor severo, edad mínima, consentimiento
de datos de salud).

**No bloquean**: permiso escrito de Blue Horse para fotos y uso de marca; si el cardio va dentro de
la misma sesión o como track paralelo; cuántas estaciones tiene el gimnasio.
