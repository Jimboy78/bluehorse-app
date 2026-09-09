# Baselines: la tabla que solo se lee

Auditoría del 9 de septiembre de 2026, octava iteración de la revisión del motor.

`user_baselines` define con cuánta carga arranca cada ejercicio. Es la última entrada grande del
motor que quedaba sin auditar.

## Lo que se mide sin salir del repo

### La tabla nunca se escribe

Buscando `user_baselines` en todo el proyecto: aparece en el esquema, en las políticas de RLS, en
`scripts/admin.mjs`, en el script de auditoría de aislamiento… y **una sola vez en la app, en un
`select`** (`apps/web/src/lib/plan.ts:70`). No hay un solo `insert` en ningún lado.

La consecuencia es una cadena completa:

| Paso | Resultado |
|---|---|
| `user.baselines` | siempre `[]` |
| `baselineLoad` en `buildItem` | siempre `null` |
| `baselineToTarget` | devuelve `null` de entrada |
| **`targetLoad` de cada item del plan** | **siempre `null`** |

**Ningún plan prescribe carga.** El socio recibe series, repeticiones, RIR y descanso; el peso lo
pone él.

### Eso no está roto, pero sí está mal contado

Hay que ser justo: el sistema **funciona igual** por otro camino. La progresión no sale de los
baselines sino de `set_logs` — `reviewProgress` recibe `history` y propone subir o bajar contra lo
que la persona realmente hizo. El diseño de "arrancá con lo que puedas y la app ajusta" está
implementado y anda.

Lo que está mal es lo que se dice alrededor:

1. **El paso de calibración del onboarding pregunta algo que no cambia nada.** El socio elige entre
   *"Ya sé con cuánto entreno"* y *"Prefiero que lo calculen por mí"*, y el propio código lo declara:
   *"`baselineMode` es solo informativo en el MVP"*. Es la cuarta pregunta de la auditoría que no
   afecta el plan, después de `sex`, `weightKg`, `heightCm` y `sessionMinutesTarget`.

2. **El aviso de desentrenamiento promete recortar una carga que no existe.** Esto lo dejé pasar en
   la iteración 7: el mensaje dice *"arrancamos con un 15 % menos de carga"* y `targetLoad` es
   `null` en todos los items. Se le anuncia al socio un ajuste que no puede ver, sobre un número que
   el plan no trae. Es la clase de detalle que hace que el resto deje de creerse.

## Lo que dice la evidencia sobre dejar que el socio elija la carga

### Elige el 53 % de su 1RM — CONFIANZA MEDIA

Revisión de alcance con metaanálisis exploratorio: **18 estudios, 359 participantes**, midiendo qué
carga elige la gente cuando se la deja elegir.

- Carga autoseleccionada: **53 % del 1RM** (intervalo creíble 95 %: **49 % a 58 %**).
- **Poco efecto moderador de la experiencia, la edad o el sexo.** No es un problema de principiantes:
  los entrenados también se quedan cortos.
- Sí cambia con las repeticiones pedidas: más pesado si se piden pocas, más liviano si se piden
  muchas.

La conclusión de los autores es la parte útil: **53 % sirve para hipertrofia** siempre que se llegue
cerca del fallo, pero **queda liviano para desarrollar fuerza**.

> *Are Trainees Lifting Heavy Enough? Self-Selected Loads in Resistance Exercise: A Scoping Review
> and Exploratory Meta-analysis.* Sports Med. 2022. DOI 10.1007/s40279-022-01717-9

Un estudio previo en principiantes encontró lo mismo con más detalle: todas las cargas
autoseleccionadas por debajo del 60 % 1RM, en un rango de **42-57 %**, igual en varones y mujeres.

**Esto encaja exactamente con lo de la iteración 5.** Lopez 2021 mostró que la hipertrofia es
independiente de la carga y la fuerza no. Cruzando las dos cosas:

| Objetivo del socio | Qué pasa si elige él la carga |
|---|---|
| Hipertrofia, recomposición | **anda**, si se acerca al fallo |
| Fuerza | **se queda corto**: elige ~53 % y necesita ≥70 % |

O sea: dejar que el socio elija no es un problema general, **es un problema del objetivo fuerza**.
Y eso es accionable sin inventar ningún número, porque el ruleset ya trae la intensidad objetivo de
cada bloque.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Progresión desde `set_logs` | **se mantiene** | Es el camino que funciona, y es el correcto: mide lo que la persona hizo, no lo que dijo. |
| `user_baselines` | **infraestructura muerta** | Se lee y nunca se escribe. O se conecta o se saca; hoy es una tabla que solo agrega expectativa. |
| El paso `baselineMode` | **pregunta vacía** | Declarado "solo informativo" en el propio código. |
| El aviso de desentrenamiento | **se corrige** | Promete recortar una carga que el plan no trae. |
| Dejar que el socio elija la carga | **se mantiene, con aviso** | 53 % del 1RM alcanza para hipertrofia; para fuerza no. |

## Lo que se cambió

El aviso de retorno tras una pausa ahora tiene **dos formas**: cuando el plan trae carga, dice
cuánto se recortó; cuando no la trae —que hoy es siempre— le dice al socio que arranque más liviano
de lo que venía, sin anunciar un porcentaje que no va a ver en ningún lado.

**No se conectó `user_baselines` ni se sacó el paso del onboarding**: las dos cosas son decisiones
de producto con costo de migración, y esta auditoría no las toma sola. Quedan declaradas.

## Lo que esta investigación NO cubre

- **Las fórmulas de 1RM.** `04` cita Epley y Brzycki con error típico de 5-10 % y las propone como
  valor por defecto. **No están implementadas en ningún lado**: ni en `packages/domain/src/load.ts`
  ni en el motor. Es otro bloque de investigación escrito y nunca construido.
- **Cuánto empujar al socio que busca fuerza.** Sabemos que elige ~53 % y necesita ≥70 %, pero no hay
  evidencia acá sobre cómo cerrar esa brecha sin un test de 1RM que la app no hace y que `05`
  desaconseja sin supervisión.
- **Si conviene calibrar en la primera sesión.** Es lo que el onboarding promete
  (*"la calibración real ocurre en la primera sesión"*) y no existe como función.
