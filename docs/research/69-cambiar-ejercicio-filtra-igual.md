# "Cambiar ejercicio" filtra por lo mismo que el plan

**Fecha:** 20/09/2026. **Tanda:** propia, fuera del plan de variables. Salió del typecheck de
`tools/`: al ponerlo, aparecieron cuatro llamadas a `findSubstitutes` sin el campo `context`, y
mirando por qué nadie las había notado se vio que `context` no se leía en ninguna parte.

## El problema

El motor arma el plan sacando del catálogo todo lo que este socio no puede hacer. Eso son cuatro
módulos, y viven juntos en `resolverContexto`:

- **restricción** — lo que el socio descartó a mano, la estación que evita, el movimiento que
  declaró que no puede;
- **molestia** — las reglas de dolor del ruleset, más los saltos cuando hay cualquier molestia o
  una operación reciente;
- **nivel** — no se le propone a alguien un ejercicio que exige más técnica de la que tiene;
- **salud** — lo que sacan las condiciones marcadas detrás de la puerta de salud: flexión lumbar
  cargada con osteoporosis, explosivos en embarazo, postparto, piso pélvico o prótesis, cabeza
  abajo con glaucoma o desprendimiento de retina.

`findSubstitutes` —el botón "cambiar ejercicio" de Hoy, las alternativas de la previa del plan y
la pantalla "Explorar"— tenía **su propia lista** con los dos primeros. Dos listas que había que
acordarse de mantener iguales, y no se mantuvieron.

## Lo que se midió

Contra el catálogo real (58 estaciones, 88 ejercicios), preguntándole al botón por cada ejercicio
del catálogo:

| socio | lo que el botón le ofrecía, y el plan nunca |
| --- | --- |
| embarazo, postparto, piso pélvico o prótesis | salto en profundidad, salto al cajón, salto con vallas, salto con barra hexagonal, slam ball, swing con kettlebell |
| osteoporosis | crunch en polea, abdominales en máquina, abdominales en camilla, slam ball |
| glaucoma o desprendimiento de retina | abdominales en camilla |
| principiante | 13 por encima de su nivel, entre ellos peso muerto y sentadilla con barra |

De los cuatro, el que importa más es el primero: el plan de una embarazada no tiene un solo salto,
y tocando "cambiar ejercicio" aparecía el salto en profundidad, que es el ejercicio de mayor
impacto del catálogo.

Además, las tres pantallas de la app le pasaban al motor **solo las molestias**: aunque el motor
hubiera mirado el nivel y la salud, no los estaba recibiendo.

## La decisión

Una sola función, `exclusionesDelSocio(ruleset, socio, fecha)`, que devuelve los cuatro módulos.
La usan `resolverContexto` —o sea el plan— y `findSubstitutes`. No hay forma de agregar un módulo
a uno y olvidarlo en el otro: es la misma lista.

El contrato del motor pasó a pedir el socio, no sus molestias: `FindSubstitutesInput.user` con
perfil, restricciones y condiciones. Es un cambio incompatible a propósito — el typecheck señaló
las diez llamadas que había que revisar, que es exactamente lo que no pasó cuando el campo era
opcional de hecho.

Por la misma razón, `toPreview` perdió el valor por omisión `constraints = []`: un valor por
omisión que apaga un filtro de seguridad no avisa cuando se olvida.

## Lo que queda cubierto

- La matriz mide, sobre el catálogo real, que a cada uno de esos cuatro socios no le llegue nada
  de lo que su contexto saca, y que el catálogo tenga ejemplos de cada clase prohibida (si no, el
  test quedaría verde sin filtrar nada).
- El barrido de 3.000 socios pide equivalentes para el primer ítem del plan de cada uno y verifica
  que ninguno esté excluido por su contexto. **El 98 % recibe alguna alternativa**, 2,3 en
  promedio: el filtro nuevo no dejó la pantalla vacía.
- Las siete falsificaciones —apagar cada módulo, apagar el filtro entero del botón, y vaciar el
  socio que viaja con la previa— dan rojo.

## Lo que este cambio **no** hace

No cambia ningún plan: los reportes de la matriz no se movieron ni una línea. Lo único que cambia
es qué se ofrece al tocar "cambiar ejercicio", que es justo lo que no estaba medido.
