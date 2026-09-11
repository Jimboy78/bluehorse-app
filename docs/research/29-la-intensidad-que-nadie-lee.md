# Las 36 bandas de %1RM que no llegan a ninguna pantalla

Revisión del 10 de septiembre de 2026. Salió de auditar los modificadores —edad, desentrenamiento,
frecuencia— para ver si cambian el plan o son otro bloque escrito y muerto.

El de edad **sí funciona**, y el borde está bien puesto:

| Perfil | Edad | Reps base | Reps del plan | ¿Sale la nota? |
|---|---|---|---|---|
| `justo antes de 60` | 59 | 1-5 | **1-5** | no |
| `justo cumplidos 60` | 60 | 1-5 | **7-9** | sí |
| `mayor de 60 · fuerza` | 67 | 4-6 | **7-9** | sí |
| `ochenta años` | 80 | 5-8 | **7-9** | sí |

Un día de diferencia y la prescripción cambia, que es exactamente lo que la regla dice.

Pero la regla tiene dos mitades —una ventana de repeticiones y una de intensidad— y solo una llega.

## `intensityPct1RM` se escribe y no se lee. Nunca. En ningún lado.

Buscada en todo el código que no sea test:

```
packages/engine/src/ruleset.ts:63        intensityPct1RM: percentRange,        ← el esquema
packages/engine/src/placeholder-engine.ts:339                                  ← una escritura
    intensityPct1RM: [rule.intensityWindowPct1RM[0], rule.intensityWindowPct1RM[1]],
```

Dos menciones: la declaración del esquema y **una escritura**, la del ajuste por edad. Cero lecturas.
En `apps/web` no aparece en ningún archivo de código. El ítem del plan que se guarda y se muestra
lleva ejercicio, series, reps, RIR, descanso, carga y duración — **intensidad no**.

Son **36 bandas** escritas en `v1-research`, una por cada (objetivo, nivel, slot). Todas curadas
desde `01-fuerza-hipertrofia-potencia.md` y `02`. Ninguna le llega al socio.

### Lo que esto le hace a los últimos dos documentos

`26-acsm-2026.md` comparó varias de esas bandas contra el position stand 2026 y dejó decisiones
abiertas sobre ellas. Siguen siendo válidas como contenido y **cambian de prioridad**, porque hoy
mover cualquiera de esos números no cambia un solo plan:

| Decisión de `26` | Sigue en pie | Pero |
|---|---|---|
| Techo de potencia 60 % vs 70 % | sí | es un número que nadie lee |
| Intensidad de fuerza de `beginner` y `novice` | sí | ídem |
| Cuatro series en fuerza | sí | **esta sí llega**: `sets` va en el ítem |
| Banda de volumen semanal 6-24 | sí | **esta sí llega**: alimenta el aviso |

Y es la segunda vez en esta misma auditoría. `optimalSetsPerMuscle` resultó ser lo mismo hace dos
iteraciones. El patrón que conviene recordar no es "este campo está muerto", es **preguntar quién lee
un número antes de discutirlo**.

### Por qué no se conecta acá

Prescribir por %1RM necesita un 1RM. El 1RM sale de `user_baselines`, que **se leen y nunca se
escriben** — es la decisión de producto número 3, anterior a esta y que la bloquea. Conectar la
intensidad sin baselines significaría mostrar un porcentaje de un máximo que la app no conoce, que es
peor que no mostrarlo.

Así que se declara como deuda, que es lo que el proyecto hace con el contenido escrito y no
conectado, y queda enganchada a la decisión que la habilita.

## El test que existe para esto no lo veía

`ruleset-consumo.test.ts` recorre las claves del ruleset y marca las que no aparecen en el código. Su
propio comentario dice que un bloque escrito y muerto "aparenta una cobertura que la app no entrega".
`intensityPct1RM` **pasó ese test durante toda su vida**, porque el chequeo era:

```ts
.filter((k) => !codigo.includes(k) && !esquema.includes(k))
```

`includes` no distingue un lado del `=` del otro. La clave aparece en el código —una vez, siendo
escrita— y eso alcanzaba. **Nombrar una clave no es leerla.**

Corregido con un segundo chequeo: una lectura se ve como un acceso a propiedad (`algo.clave`,
`algo['clave']`) o como una desestructuración. Escribirla es `clave:` dentro de un objeto que se
arma, y nada más.

Pasado sobre el ruleset entero, el chequeo nuevo encuentra exactamente **dos** claves y ningún falso
positivo: `intensityPct1RM` y `action` —el "qué hacer" de cada bandera roja, que muere junto a
`redFlags`, ya declarado—. Las dos quedan en la lista de deuda.

Falsificado de dos maneras, las dos fallando: sacar `intensityPct1RM` de la deuda (que es lo que hay
que hacer el día que se conecte, y el test lo pide), y agregar una clave nueva escrita y nunca leída.

> Una nota sobre el método, porque el primer intento de falsificación **no falló y estaba mal
> construido**: la línea que inyecté era `inventadoYMuerto: rule.inventadoYMuerto`, que lee la clave.
> El test tenía razón en pasar. Una falsificación que no rompe nada puede significar que el test es
> flojo o que la rotura es falsa, y hay que mirar cuál de las dos antes de sacar conclusiones.

## Una cosa chica, de paso

El comentario de `applyAgeModifier` decía "menos carga, más repeticiones y **más descanso**". El
código dice lo contrario tres líneas abajo: *"El descanso no se toca porque ninguna fuente respalda
alargarlo por edad"*. Y "menos carga" tampoco es cierto para hipertrofia, donde la ventana de edad
(70-79 %) está **por encima** de la base del principiante (50-70 %) — la nota que ve el socio lo dice
bien: *"No es menos carga que a los 40: es la carga que se midió en esta edad"*. Corregido el
comentario para que diga lo que la función hace.

## Lo que este documento NO cubre

- **Si la ventana de edad debería aplicarse a un principiante de 66 años.** La nota del ruleset
  afirma que sí y cita que bajarla no da más seguridad. Es contenido de `08-edad.md` y no se tocó.
- **La promesa de que "fragilidad, dolor o lesión mandan por encima de la edad"**, que está en esa
  misma nota. Es cierta para las exclusiones —el dolor saca ejercicios a cualquier edad— y no para la
  ventana de repeticiones, que se aplica igual. Como la mitad de intensidad está muerta, hoy la
  diferencia es más chica de lo que suena; queda anotado para cuando se conecte.
- **Los otros tres modificadores** (`experienceLevel`, `frequency`, `detraining`), que en este barrido
  solo se miraron de reojo.
