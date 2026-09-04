# Glosario

Vocabulario compartido entre el código, la base y la investigación. Si un término no está acá, no
debería aparecer en un nombre de tabla ni de tipo.

## Entrenamiento

**RIR** (*reps in reserve*, repeticiones en reserva) — cuántas repeticiones más podría haber hecho
al terminar la serie. RIR 0 es fallo; RIR 3 es que le sobraban tres. Es la señal más barata y más
útil para decidir si subir la carga. En la app se pide solo en la última serie de los ejercicios
principales.

**Serie tope** (*top set*) — la serie más pesada de un ejercicio en una sesión. Es la que se compara
entre sesiones para decidir progresión.

**Patrón de movimiento** — la categoría del movimiento, independiente de la máquina: sentadilla,
bisagra de cadera, empuje horizontal, tracción vertical, etcétera. Es el vocabulario que comparten
la investigación y el catálogo, y lo que permite sustituir un ejercicio por otro.

**Compuesto / aislado** — un compuesto mueve varias articulaciones (sentadilla, press de banco); un
aislado, una sola (curl de bíceps). Los compuestos van primero en la sesión.

**Descarga** (*deload*) — una semana con menos volumen, manteniendo la carga, para destrabar un
estancamiento o para volver después de una ausencia larga.

**Estancamiento** — misma carga durante N sesiones sin señales de que sobre esfuerzo. Distinto de
"todavía no le subimos la carga", que es un problema del plan, no del socio.

**Doble progresión** — subir primero las repeticiones dentro de un rango y recién después la carga.

**Volumen** — series efectivas por grupo muscular por semana. Es la métrica que el motor usa y la
que menos entiende el usuario común: si se muestra, va con una línea que explique qué significa.

## Producto

**Cola** — el plan es una lista ordenada de sesiones sin fecha. "Hoy" es la primera pendiente.

**Calibración** — las primeras sesiones de un socio que no sabe con cuánto entrena: la app propone
cargas conservadoras y le pide RIR para deducir su punto de partida.

**Punto de partida** (*baseline*) — con cuánto arranca cada ejercicio. Lo declara el socio o lo
deduce la calibración.

**Propuesta** — un cambio que el motor sugiere y el socio acepta o rechaza, siempre con el motivo a
la vista. El motor nunca cambia el plan por su cuenta.

## Equipamiento

**Estación** — una máquina o puesto físico del gimnasio. Una fila de `equipment`.

**Selectorizada** — máquina con stack de placas y pin. Se carga por nivel, no por kilo, y sube de a
escalones discretos.

**Pin / nivel** — la posición del selector. `pin 7` no es 7 kg: la equivalencia en kilos hay que
cargarla a mano en `stack_kg`, y si no está, esa carga no se puede comparar con otras.

**Escalón** (`load_increment`) — el salto mínimo real de la estación: 2,5 kg de disco, 5 lb de
placa, 1 nivel de pin. Sin esto el motor propone cargas que la máquina no puede hacer.

**Carga cruda vs. normalizada** — la cruda es lo que dice la máquina y es lo que se muestra. La
normalizada son kilos calculados, solo para gráficos, y puede no existir.
