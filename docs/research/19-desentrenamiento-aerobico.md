# Volver al cardio: el ajuste estaba puesto donde menos hacía falta

Auditoría del 9 de septiembre de 2026, segunda vuelta, hueco 4 de 6.

Hueco anotado al cerrar `14-historial-y-desentrenamiento.md`: `detraining` solo ajusta la carga de
sala, y `03-progresion-descarga.md` ya decía que el VO2max cae mucho más rápido que la fuerza.

## Lo que se midió antes de tocar nada

Plan de objetivo `cardio` con una cinta en el catálogo, variando solo la ausencia:

| Días de pausa | Duraciones prescritas |
|---|---|
| 0 | `[2400, 240, 2400, 240, 2400, 240]` |
| 10 | `[2400, 240, 2400, 240, 2400, 240]` |
| 30 | `[2400, 240, 2400, 240, 2400, 240]` |
| 90 | `[2400, 240, 2400, 240, 2400, 240]` |
| 400 | `[2400, 240, 2400, 240, 2400, 240]` |

**Idénticas.** El bloque `cardio` no se ajusta por ausencia, en ninguna ventana.

Y lo que sí recibía alguien con 400 días de pausa y objetivo cardio era el aviso de sala:

> "…**No es que hayas perdido fuerza**: la fuerza se conserva bastante más de lo que la gente cree.
> Lo que se ablanda en una pausa son los **tendones** […] Un par de semanas y volvés a donde
> estabas."

Le habla de tendones y de carga a alguien cuyo plan son 40 minutos de cinta, y le dice que no perdió
nada — cuando lo aeróbico es justamente lo que sí se pierde, y rápido. Tercera vez en esta auditoría
que el problema no es el número sino lo que el texto promete: la iteración 7 tenía el mecanismo al
revés, la 8 anunciaba un recorte sobre una carga inexistente.

## Lo que dice la evidencia

### El VO2max cae en pausas cortas y más todavía en largas — CONFIANZA MEDIA (atletas)

Revisión sistemática y metaanálisis, 21 de 3315 estudios potenciales, siguiendo Cochrane:

| Cese | Tamaño de efecto sobre VO2max | IC 95 % | p |
|---|---|---|---|
| Corto plazo | ES = **−0,62** | −0,94 a −0,31 | < 0,01 |
| Largo plazo | ES = **−1,42** | −1,99 a −0,84 | < 0,01 |

El efecto es mayor en cese largo que en corto (Q = 6,5; p = 0,01). Pero el subgrupo que importa acá:

> **Entre 30-90 días y más de 90 días no hay diferencia significativa: Q = 0,54; p = 0,46.**

> Zheng J, Pan T, Jiang Y, Shen Y. *Effects of Short- and Long-Term Detraining on Maximal Oxygen
> Uptake in Athletes: A Systematic Review and Meta-Analysis.* Biomed Res Int. 2022;2022:2130993.
> DOI 10.1155/2022/2130993 — **verificado, abstract completo leído vía PubMed (PMID 36017396)**

**Dos limitaciones que hay que decir.** La población son **atletas**, no socios de gimnasio: alguien
con un VO2max más alto tiene más para perder, y el propio paper lo confirma (los de mayor estado de
entrenamiento cayeron más, Q = 4,24; p = 0,03). Y **esos números son tamaños de efecto, no
porcentajes**: no se traducen a "bajá la duración un 35 %".

### Lo que ya estaba en el proyecto

`03-progresion-descarga.md` documenta la caída de VO2max de 4-14 % en menos de 10 días, y
`14-historial-y-desentrenamiento.md` el contraste con la fuerza, que a los 3 meses de cese no había
cambiado (Kubo 2010, n = 8).

El contraste es el contenido del aviso: **lo que se conserva es la fuerza; lo que se va rápido es lo
aeróbico**, y el motor solo hablaba de lo primero.

## Qué se cambió

**Se agregó `modifiers.detraining.cardioNote`, y ningún multiplicador.**

El aviso sale además del de sala cuando el plan trae cardio y la pausa llegó al primer escalón que
el objetivo ya define. Dice tres cosas: que va a llegar más agitado y que eso es esperable, que
vuelva por duración antes que por intensidad, y que pasado el primer mes da igual cuánto más estuvo
—que es literalmente lo que mide `Q = 0,54; p = 0,46`—.

**El umbral no es nuevo.** Se reutiliza `min(params.detraining[].days)`, que para `cardio` y
`endurance` son 10 días. Inventar un escalón aeróbico propio habría sido meter un número de
entrenamiento sin fuente.

**No hay `durationMultiplier` ni `intensityMultiplier`.** El informe de investigación proponía una
tabla completa (0,65 / 0,55 a los 10 días; 0,78 / 0,68 a los 30; 0,92 / 0,82 a los 90). Ninguno de
esos números sale de las fuentes: son criterio de quien escribió el informe, presentados al lado de
intervalos que pertenecen a otra cosa. Ponerlos habría violado la regla dura 3 con el agravante de
que parecerían respaldados.

5 tests nuevos, 337 en verde. Dos fallan si se revierte el motor a mano; los otros tres son de
no-desborde y fallan si la condición se afloja a `daysSinceLastSession >= 0`.

## Lo que esta investigación NO cubre

- **Cuánto bajar la duración y la intensidad.** Es la pregunta del hueco y **no tiene respuesta con
  respaldo**. La evidencia mide cuánto se pierde, no con qué prescripción conviene volver. Es el
  mismo salto que la iteración 7 encontró del lado de la fuerza: la cinética no da multiplicadores.
  El aviso le dice al socio cómo volver; el motor no le cambia la sesión.
- **Cuántas sesiones sostener el ajuste.** Sin multiplicador, no aplica; pero tampoco había datos
  para responderlo.
- **Si esto vale para alguien que no es atleta.** Zheng es todo atletas, y el propio paper muestra
  que el estado de entrenamiento modera el tamaño de la caída. Un socio de gimnasio probablemente
  pierda menos en términos absolutos. La dirección se sostiene; la magnitud no se le puede aplicar.
- **Los multiplicadores de sala del objetivo cardio.** `cardio` y `endurance` recortan carga de sala
  (0,9 / 0,8 / 0,65) con la misma falta de respaldo que la iteración 7 le señaló a los otros cuatro
  objetivos. No se tocaron: sigue siendo la decisión de producto declarada allá.
- **Riesgo cardiovascular al volver de golpe.** El informe lo afirmaba con fuentes que no se pudieron
  verificar. No entró nada de eso al ruleset. Si importa, es una búsqueda propia.

## Nota sobre las fuentes de esta iteración

El informe traía "3,93 %" y "9,43 %" de caída de VO2max **con los intervalos de Zheng pegados al
lado** — pero esos intervalos (−0,94 a −0,31 y −1,99 a −0,84) son de los tamaños de efecto, no de
porcentajes. Los porcentajes no aparecen en el paper. También atribuía el estudio al "Journal of
Sports Medicine" en vez de a BioMed Research International, y citaba un "Zhang et al. 2026" con
volumen equivocado. Lo único que entró acá es lo que se leyó en el abstract completo.
