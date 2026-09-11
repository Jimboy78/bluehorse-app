# El aviso que mandaba a buscar el problema al lugar equivocado

Revisión del 10 de septiembre de 2026. Salió de completar la cobertura de
`UserConstraint`: tiene **cuatro tipos** y la matriz probaba dos. Los 33 perfiles declaran `pain` o
`injury`; `avoid_exercise` y `avoid_equipment` —"no puedo usar esta máquina", "este ejercicio no lo
hago"— pasan por el mismo `isBlocked` que filtra la generación **y** la sustitución, y no tenían
ninguna prueba sobre la diversidad.

La parte de abajo funciona. Lo que no funcionaba era la de arriba: lo que el socio lee.

## Lo que funciona

Bloqueando estaciones de a tandas sobre el mismo perfil, hasta las 58 del gimnasio:

| Estaciones bloqueadas | Ítems del plan | Bloqueados colados | Sesiones vacías |
|---|---|---|---|
| 1 | 40 | **0** | 0 de 8 |
| 5 | 40 | **0** | 0 de 8 |
| 10 | 36 | **0** | 0 de 8 |
| 20 | 36 | **0** | 0 de 8 |
| 40 | 36 | **0** | 0 de 8 |
| 58 (todas) | 0 | **0** | 8 de 8 |

Cero colados en todas las tandas, y la degradación es gradual: el plan pierde ítems de a poco en vez
de romperse. Un ejercicio bloqueado tampoco vuelve por la puerta de atrás — `findSubstitutes`
comparte el filtro, que es la única razón por la que compartirlo vale la pena.

El caso de las 58 deja el plan en cero y ocho sesiones vacías. Queda anotado y **no se tocó**:
requiere que el socio bloquee el gimnasio entero, y construir para eso sería cubrir un caso que no
existe con código que nadie va a volver a leer. Si algún día aparece, el lugar es este párrafo.

## Lo que no funcionaba: el socio leía inglés

Cuando un patrón se queda sin ejercicios, el plan avisa. El aviso decía, textual:

> No hay ningún ejercicio disponible para el patrón **"vertical_pull"** en Sesión B. Falta
> equipamiento en el catálogo, está todo bloqueado por restricciones, o no hay nada de tu nivel para
> ese patrón.

Dos cosas mal en una sola oración.

### 1. El identificador interno, en inglés y entrecomillado

`slot.pattern` se interpolaba crudo. **Es exactamente el bug que este proyecto ya arregló una vez**:
el comentario de `GOAL_LABELS` en el motor dice, palabra por palabra, que un `goal.goal` interpolado
crudo le dejaba al socio `el objetivo "hypertrophy"`. Se arregló para los objetivos, para los músculos
y para las zonas del cuerpo, y nadie revisó los patrones.

No era un caso de borde. **Cuatro de los 33 planes del reporte commiteado lo mostraban**, y los dos
perfiles con lesión lo tienen siempre, porque sacar un patrón entero es justamente lo que dispara
ese aviso. Un socio con la rodilla lesionada leía `el patrón "squat"` y `el patrón "lunge"`.

Corregido con un `PATTERN_LABELS` en el motor, al lado de los tres que ya estaban ahí por el mismo
motivo. Las palabras son las mismas que usa la app en la insignia de cada ejercicio: que la insignia
diga "Sentadilla" y el aviso diga otra cosa del mismo patrón sería peor que no traducir.

### 2. Tres causas cuando el motor sabe cuál es

La segunda oración ofrecía las tres posibilidades juntas. El motor tiene los datos para decidir: son
los mismos cuatro filtros de `usableExercises`, reaplicados al patrón y en el mismo orden.

| Lo que pasó | Lo que lee ahora |
|---|---|
| El catálogo no tiene ese patrón | "el catálogo del gimnasio no tiene ninguno cargado todavía." |
| Lo sacó una restricción del socio | "los que hay quedaron afuera por lo que anotaste que no podés hacer. Es lo esperable y no hace falta que hagas nada." |
| Piden más técnica de la que declaró | "los que hay piden más experiencia de la que declaraste. Hablalo con el staff si querés incorporarlos." |
| La estación no está disponible | "las estaciones donde se hacen no están disponibles. Avisale al staff." |

La diferencia no es cosmética. Para alguien con la rodilla lesionada, **leer que "falta equipamiento
en el catálogo" cuando lo que pasó es que su propia lesión sacó las sentadillas lo manda a buscar el
problema al lugar equivocado** — y a reclamarle al gimnasio por algo que el gimnasio tiene. La
variante que le corresponde le dice lo contrario: es lo esperable, no hace falta que haga nada.

Así quedan los cuatro planes del reporte:

> En Sesión A no quedó ningún ejercicio de **sentadilla**: los que hay quedaron afuera por lo que
> anotaste que no podés hacer. Es lo esperable y no hace falta que hagas nada.

## Dos tests que fijaban el bug

Los dos tests que existían sobre este aviso afirmaban `w.includes('core')` y `w.includes('hinge')`
—el identificador— así que el aviso podía salir en inglés indefinidamente y seguían en verde. Es la
misma familia de la trampa que ya está en `CLAUDE.md`: un test puede pasar y no estar mirando lo que
uno cree.

Los dos ahora buscan el castellano **y** la causa correcta, que además es lo que los vuelve útiles: el
de `adaptive-engine` prueba a un principiante con un peso muerto avanzado, así que la causa tiene que
ser la de experiencia y no la del catálogo. Antes, cualquiera de las tres lo daba por bueno.

Y hay una red más ancha, sobre los 33 perfiles: **ningún aviso de ningún plan puede contener un
identificador de patrón entrecomillado**. Lo que conviene fijar no es el caso, es la clase, porque
ésta ya se repitió tres veces.

## Lo que este documento NO cubre

- **Si el plan vacío del caso de las 58 se ve bien en la app.** No se probó en el navegador; ver el
  párrafo de arriba sobre por qué no se construyó para eso.
- **El resto de los textos del motor.** Este barrido miró patrones. Los objetivos, músculos y zonas
  ya estaban traducidos; no se auditó si hay otros identificadores sueltos fuera de los `warnings`.
- **Las restricciones que el socio carga desde `/perfil`.** Acá se probó el motor con las
  restricciones ya armadas; el formulario que las produce es otro camino.
