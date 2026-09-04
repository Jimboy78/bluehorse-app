# Arquitectura

## El problema

Un socio de Blue Horse entra al gimnasio, abre la app y ve qué le toca hoy, con el equipamiento que
Blue Horse realmente tiene. Marca lo que hace. El plan se ajusta con el tiempo según eso. El
contenido de entrenamiento (qué ejercicios, cuántas series, cómo progresa) sale de una investigación
que todavía está en curso, así que la arquitectura tiene que poder recibirlo después sin rehacerse.

## Decisiones, por costo de revertirlas

| Decisión | Elegido | Costo de cambiarla después |
|---|---|---|
| Multi-gimnasio | `gym_id` en todas las tablas, UI de un gimnasio | Altísimo |
| Motor de prescripción | Función pura + ruleset versionado | Altísimo |
| Plataforma | PWA instalable (React + TS + Vite) | Alto |
| Estructura del plan | Cola ordenada de sesiones, sin fechas | Alto |
| Unidad de carga | Propiedad de cada estación: cruda + kg normalizado | Alto |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) | Medio |
| Offline | Cola local con clave de idempotencia | Medio |
| Máquina ocupada | Sustituto equivalente + reordenar | Medio |
| Adaptación | Propone y el usuario confirma | Bajo |
| Cuenta | Google + email, sin exigir ser socio | Bajo |

## PWA y no nativa

El reparto es por QR en recepción: el socio escanea, la app abre en el navegador y se instala desde
ahí. Cero tiendas, cero revisiones, actualizaciones instantáneas.

**Descartado: React Native / Expo.** Perdés el link inmediato y necesitás revisión de tienda desde
el primer día. Si más adelante las tiendas hacen falta, **Capacitor** envuelve este mismo build sin
reescribir nada. Al revés no se puede.

**Condición de iOS**: las notificaciones push y el almacenamiento local persistente solo funcionan
si el usuario hace "Agregar a pantalla de inicio" (iOS 16.4+). Sin instalar, Safari puede borrar los
datos locales tras 7 días sin uso. Por eso el QR lleva primero a una pantalla que enseña a
instalarla, y recién después al registro.

## Supabase y no otra cosa

El dominio es relacional y necesita agregaciones reales: series por grupo muscular por semana,
evolución de carga por ejercicio, adherencia. Postgres hace eso; un almacén documental te obliga a
denormalizar a mano.

Supabase aporta además auth con Google y email, storage para las fotos, y RLS, que es donde se
apoya el aislamiento entre socios y entre gimnasios. Y los datos son Postgres puro: si algún día no
alcanza, te llevás la base.

**Descartado: Firebase** (modelo documental, ver arriba). **Descartado: backend propio** — dos o
tres semanas construyendo auth, storage y migraciones que no agregan nada al producto.

**Ojo con el plan gratuito**: pausa los proyectos inactivos. Si dejás pasar una semana y alguien de
Blue Horse abre el link, ve una app rota. Antes de una demo, verificá que el proyecto esté despierto.

## Offline sin sincronización bidireccional

Una sesión de entrenamiento la escribe **un solo usuario desde un solo teléfono**. No hay dos
dispositivos editando lo mismo, así que no hay conflictos que resolver. Alcanza con una cola local
(`apps/web/src/lib/outbox.ts`) y una clave de idempotencia por escritura: si el envío se reintenta,
el servidor descarta el duplicado.

El service worker está en modo `prompt`, no `autoUpdate`: una recarga automática en medio de una
serie le borra al usuario lo que estaba cargando.

## La cola, no el calendario

El plan es una lista ordenada de sesiones sin fecha. "Hoy" es la primera pendiente. Faltar dos
semanas no genera deuda ni sesiones vencidas: genera, como mucho, una propuesta de descarga al
volver. La adherencia se mide contra un objetivo semanal, no contra un calendario.

## El motor, aparte de todo

`packages/engine` es una función pura: entra un snapshot (perfil, equipamiento, historial, ruleset)
y sale un blueprint. No toca la base, no hace red, no lee la hora. Eso permite testearlo con casos
fijos y, sobre todo, permite que el contenido real de la investigación entre como datos y no como
código. Ver `03-contrato-motor.md`.
