# Saltos y lanzamientos: cuándo entran al plan y cómo

**Fecha:** 18/09/2026. **Pedido del dueño:** "no quiero forzar a usar todas las estaciones, pero
tienen que poder usarse; en los deportes a veces se recomiendan ejercicios de movimiento y no tan
estáticos".

## Lo que había

Medido sobre el catálogo real con los 35 perfiles de la matriz (`tools/reportes/`), **32 de los 68
ejercicios no entraban a ningún plan**, y entre ellos estaban **los nueve explosivos**: salto al
cajón, con vallas, en profundidad, con barra hexagonal, zancada con salto, pogo, wall ball, slam ball
y swing. Ni el plan de potencia ni los de fútbol, tenis o vóley recibían uno. El plan de potencia lo
avisaba ("todavía no entran solos al plan"), y `22-carga-de-potencia.md` dejaba la decisión abierta.

La causa no era una decisión de producto: lo explosivo es de peso corporal, el slot principal
prefiere algo a lo que se le pueda subir la carga, y donde la dosis se regula por RIR se lo aparta
a propósito (quince saltos "dejando dos en reserva" no significan nada). Quedaba sin ningún camino
de entrada.

Además, 22 estaciones tenían `load_unit: 'none'`, entre ellas las dos de mancuernas, las kettlebells,
las wall balls, las slam balls y las sandbags. Con esa unidad la app no muestra dónde anotar la
carga: el ejercicio se puede hacer, pero no se puede registrar ni progresar.

## Lo que dice la evidencia

### Combinar fuerza y explosivos rinde más que la fuerza sola — CONFIANZA BAJA

- **Thapa et al. (2024)**, 32 estudios, 726 participantes, entrenamiento complejo contra fuerza
  sola. A favor del complejo: sprint de 5 m (ES 0,96), sprint de 20 m (ES 0,52), cambio de
  dirección (ES 0,39) y CMJ (ES 0,36). En 1RM, sprint largo, squat jump y salto horizontal, iguales.
  Rinde más con intervenciones de 7 semanas o más, unas 3 sesiones por semana y formatos de
  contraste. Certeza **baja** en sprint y cambio de dirección, **muy baja** en el resto.
  DOI 10.1080/02640414.2024.2391657
- **Zhao et al. (2026)**, metaanálisis en red, 34 estudios, 1.057 participantes, atletas y gente
  entrenada. Contra la fuerza sola, **solo el formato complejo** (fuerza y explosivo alternados en
  la misma sesión, con la fuerza primero) mejora el CMJ (MD 2,50 cm; IC 0,85–4,10) y el sprint de
  20 m (MD −0,10 s; IC −0,18 a −0,04). Hacer todos los saltos antes que la fuerza no mejoró el
  sprint contra el control (MD 0,01; IC −0,12 a 0,04). DOI 10.1186/s13102-026-01531-0
- **Freitas et al. (2017)**, 9 estudios con deportes de equipo: efecto medio en sprint (ES 0,73) y
  chico en salto (ES 0,41). Por subgrupo, una pausa de **2 minutos o más** entre el levantamiento y
  el salto dio ES 0,55. Los protocolos emparejan cada levantamiento con un salto de su mismo
  movimiento: sentadilla con salto, zancada con salto partido, peso muerto con saltos largos,
  press de banca con lanzamiento. DOI 10.1371/journal.pone.0180223
- **Lesinski et al. (2014)**: el complejo alternado mejoró el CMJ +9,7 % en atletas recreativos
  contra +2,7 % en subelite y elite. Con los datos disponibles no se puede fijar una relación
  dosis-respuesta. DOI 10.1055/s-0034-1366145

**Consecuencia:** lo explosivo entra **en par** con el levantamiento de su patrón, serie por serie,
con el levantamiento adelante. No ocupa un slot propio ni reemplaza la fuerza.

### Dosis — CONFIANZA BAJA

- **Repeticiones por serie:** los protocolos que funcionaron usan 10 (Ramirez-Campillo et al. 2014:
  2 × 10 por altura de cajón, 60 saltos por sesión, sin lesiones; DOI no registrado,
  PMC3990881) y de 10 a 12 (Moghadam et al. 2023, DOI 10.1371/journal.pone.0285062). La mitad
  del volumen rinde lo mismo en temporada (Yanci, ver `06`). Rango: **5 a 10**.
- **Pausa entre series de salto:** 30, 60 y 120 s dieron lo mismo (Ramirez-Campillo 2014). En el
  par, la pausa larga es la de la vuelta, y ya es la del levantamiento.
- **Pausa dentro del par:** **120 s**, el subgrupo de Freitas y el valor que usan la mayoría de sus
  estudios de 2 minutos.
- **Volumen por sesión:** de Villarreal et al. (2009), 56 estudios: más de 50 saltos por sesión
  maximiza el salto vertical, y combinar tipos de salto rinde más que uno solo. Agregar peso al
  salto no dio beneficio extra. DOI 10.1519/jsc.0b013e318196b7c6. Con **un par por sesión** y 2 a
  4 series de 5 a 10, el plan queda entre 10 y 40 saltos: abajo de ese número a propósito, porque
  va sumado a una sesión de fuerza completa y la versión de bajo volumen rinde igual.

### Quién lo recibe

| Grupo | Veredicto | Por qué |
|---|---|---|
| Objetivo potencia | **sí** | Es lo que el objetivo promete. |
| Deportes de gesto local, fuerza y contacto | **sí** | Es donde más transfiere lo de sala (`06`, SMD 1,59 en gesto local). |
| Deportes de resistencia | **sí** | En corredores de fondo, el entrenamiento de fuerza —pesado, explosivo o pliométrico— mejora la economía de carrera, el contrarreloj y el sprint, aunque no en todos los estudios (Blagrove et al. 2018, 24 estudios). DOI 10.1007/s40279-017-0835-7 |
| Recreativo sin deporte, otros objetivos | **no** | Nadie lo pidió, y no se fuerza una estación por usarla. |
| Hasta 79 años | **sí** | En mayores de 60 la pliometría es factible y segura, sin más lesiones (Vetrovsky et al. 2019, 12 estudios, edades medias de 58,4 a 79,4). DOI 10.1007/s40279-018-1018-x. Levantar rápido mejora la función algo más que levantar lento (Balachandran et al. 2022, SMD 0,30; certeza baja). DOI 10.1001/jamanetworkopen.2022.11623 |
| Más de 79 años | **no** | No hay ensayos: no es que haga mal, es que nadie lo midió. |
| Cualquier molestia o lesión declarada | **no** | Es el criterio que el ruleset ya aplica al reemplazar un patrón bloqueado (`painSubstitution.avoidExplosive`) y el día del partido. |
| Nivel sin ningún explosivo a su alcance | **no** | El filtro de técnica no se afloja. Hoy el único explosivo de nivel principiante es pogo, que no tiene par (`isolation`). |

### Lo que no se mueve

- **No se progresa la carga de un explosivo.** Se regula por cómo sale cada repetición (altura,
  velocidad), no por reserva ni por kilos (`22`). El motor no propone subir, bajar ni descargar un
  explosivo.
- **No cuenta para el volumen semanal por músculo.** Esos rangos se midieron con series de fuerza
  cerca del fallo (`35`). Contar los saltos hacía que a un futbolista le saliera "glúteos 27, pasás
  el techo".
- **Fuera del par no entra.** En un slot común se llevaría la receta de ese slot ("wall ball 3 × 1-3
  al 30-60 % 1RM"), que no es la de un lanzamiento.

## Lo que se cambió

- Ruleset `v1-research`, bloque nuevo `explosive`: quién, qué patrones, un par por sesión, 5 a 10
  repeticiones, 120 s dentro del par, tope de 79 años. `confidence: "low"`.
- Motor: `addExplosivePairs` arma el par después de elegir todo lo demás, así el par no mueve
  ninguna otra elección. Lo que sí movió algunas es que lo explosivo dejó de competir por los slots
  comunes de potencia (antes el swing entraba al sorteo de la bisagra): tenis pasó de peso muerto
  rumano a peso muerto. Contrato: `supersetGroup` en cada ítem, que la web guarda en `superset_group`. Hoy ya
  sabía alternar superseries, así que el par funciona sin pantalla nueva.
- Día de partido: si la regla saca el salto, el levantamiento vuelve a quedar suelto, con el
  descanso de la vuelta y no con la pausa corta de adentro del par.
- Catálogo: las seis estaciones de implementos sueltos pasan a `kg`. Todas tienen el peso rotulado en
  kilos en las fotos (LIB-01, LIB-05, ACC-06). Se suman "Pase de pecho con wall ball" (par del
  press, que es el press de banca con lanzamiento de los estudios de Freitas) y "Lanzamiento
  rotacional con wall ball" (oblicuos, el hueco de `25`; no tiene par automático todavía: queda para
  el plan a mano y como equivalente).

Medido después del cambio (matriz, semilla 42): reciben par potencia, fútbol en pretemporada y en
temporada, tenis y vóley. No lo recibe ningún perfil sin deporte, con molestia, de más de 79 años o
principiante.

## Lo que queda abierto

1. **Principiantes que hacen deporte.** Hoy no reciben ninguno por el nivel técnico del catálogo, no
   por evidencia: de Villarreal no encontró diferencia por condición física de partida. Si el staff
   considera que el salto con vallas es apto para principiantes, se resuelve bajándole el nivel en el
   catálogo.
2. **Lanzamiento rotacional con par automático.** Tendría sentido con el core de los deportes de
   giro (tenis, pádel, golf). Hoy el core es un slot regulado por RIR.
3. **Todo el bloque tiene certeza baja.** Lo que más lo reforzaría es un ensayo en deportistas
   recreativos, que es el socio real de Blue Horse.
