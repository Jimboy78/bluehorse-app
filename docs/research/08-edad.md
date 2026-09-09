# Edad: qué cambia de verdad después de los 60

Auditoría del 9 de septiembre de 2026, primera iteración de la revisión del motor.

El ruleset `v1-research` aplicaba un único modificador por edad, `modifiers.olderAdults`, tomado de
`04-individualizacion-seguridad.md`, que a su vez lo derivó del **consenso ACSM 2009** — sin DOI,
sin metaanálisis, declarado con confianza MEDIA:

```json
{ "fromAge": 60, "repsMinDelta": 2, "intensityMultiplier": 0.8, "restMultiplier": 1.3 }
```

Esta investigación busca evidencia primaria para cada uno de esos cuatro números. **Tres de los
cuatro no se sostienen**, y el cuarto (`fromAge: 60`) sí.

## La fuente directa: dosis-respuesta medida en 60-90 años — CONFIANZA MEDIA

Metaanálisis de **25 ECAs, 819 participantes, edad media 70,4 años** (rango 60-90). Es el único
trabajo que mide la dosis-respuesta de cada variable de prescripción en esta población, y por eso
es la referencia de este documento.

Óptimos medidos, con el tamaño de efecto de cada subgrupo:

| Variable | Óptimo para **fuerza** | Óptimo para **morfología** |
|---|---|---|
| Intensidad | **70-79 % 1RM** (SMD 1,89) | 51-69 % 1RM (SMD 0,43) |
| Repeticiones | **7-9** (SMD 1,98) | **7-9** (SMD 0,49) |
| Series | **2-3** (SMD 2,99) | 2-3 (SMD 0,78) |
| Frecuencia | 2 sesiones/semana (SMD 2,13) | 3 sesiones/semana (SMD 0,38) |
| Tiempo bajo tensión | 6,0 s (SMD 3,61) | 6,0 s (SMD 0,36) |
| Descanso entre series | 60 s (SMD 4,68) | 120 s (SMD 0,30) |

Efecto global: fuerza SMD 1,57 (25 estudios); morfología SMD 0,42 (9 estudios).

En la **meta-regresión** —que es lo más fiable del trabajo, porque no depende de partir la muestra
en subgrupos chicos— predicen la ganancia de fuerza: **intensidad (p < 0,01)**, tiempo bajo tensión
(p < 0,01), duración del programa (p = 0,04) y, como tendencia, el descanso (p = 0,06). Para
morfología, **ninguna** variable de volumen resultó predictora significativa.

**Limitaciones, que son serias y hay que declarar:** calidad metodológica baja (PEDro medio
4,6 ± 1,2; solo 3 de 25 estudios llegan a 6). Y algunos SMD de subgrupo son artefactos evidentes de
muestras diminutas — el "descanso 60 s, SMD 4,68" sale de **dos estudios**, y no debe leerse como
que 60 s sea óptimo. Por eso este documento usa la meta-regresión para la dirección del efecto y
los subgrupos solo para la ventana de intensidad y repeticiones, que son los que tienen respaldo
cruzado (abajo).

> Borde R, Hortobágyi T, Granacher U. *Dose–Response Relationships of Resistance Training in Healthy
> Old Adults: A Systematic Review and Meta-Analysis.* Sports Med. 2015;45(12):1693-1720.
> DOI 10.1007/s40279-015-0385-9

## La intensidad alta es superior y no es más peligrosa — CONFIANZA MEDIA

Metaanálisis independiente de **18 ECAs y 1283 participantes** (≥50 años), comparando directamente
alta intensidad (**≥70 % 1RM**) contra baja-moderada (**<70 % 1RM**):

| Desenlace | Efecto a favor de la alta intensidad |
|---|---|
| Prensa de piernas | **SMD 0,95** (IC 95 % 0,48 a 1,43) |
| Extensión de rodilla | **SMD 0,63** (IC 95 % 0,09 a 1,17) |
| DMO columna lumbar | SMD 0,28 (IC −0,02 a 0,58) — **no significativo** |
| DMO cuello femoral | SMD 0,13 (IC −0,08 a 0,33) — **no significativo** |

Y el dato que más pesa para una app que prescribe sin supervisión: **no hubo diferencias entre
regímenes en incidencia de caídas ni en eventos adversos**. Bajar la carga por precaución no compra
seguridad; cuesta fuerza.

Los dos umbrales coinciden: Borde encuentra el pico en 70-79 %, y este trabajo encuentra que cruzar
el 70 % es lo que marca la diferencia. **Dos metaanálisis independientes apuntan al mismo número.**

> DOI pendiente de verificación — PubMed 42366614. Ver "qué falta verificar".

## Excepción: el mayor frágil sí es otra cosa — CONFIANZA MEDIA

Revisión en mujeres mayores con sarcopenia: los protocolos de alta intensidad "pueden ser mal
tolerados por individuos frágiles o con deterioro funcional". Los eventos adversos registrados
fueron tres, leves y transitorios (dolor de rodilla, molestia muscular, dolor de espalda), todos
resueltos ajustando la carga; ningún evento grave ni abandono por la intervención.

Efectos obtenidos: prensión manual SMD 0,43; velocidad de marcha SMD 0,37; extensión de rodilla
SMD 0,85; *Timed Up and Go* SMD −0,68. Los autores se niegan explícitamente a prescribir rangos
rígidos para esta población y recomiendan individualizar.

**Consecuencia de diseño, y es la más importante de esta auditoría: fragilidad no es edad.** El
ruleset estaba aplicando a todo socio de 60 años o más la recomendación pensada para el subgrupo
frágil. Un socio de 62 años sano y uno de 82 con sarcopenia recibían la misma rebaja del 20 %.
La app no tiene ningún campo que capture fragilidad; lo más cercano son las restricciones
declaradas (`UserConstraint`), que son por región del cuerpo y no por estado funcional global.

> DOI 10.3389/fpubh.2025.1735899

## Potencia: acá la intensidad baja sí alcanza — CONFIANZA BAJA

Para el objetivo *potencia*, la intensidad baja-moderada (≤49 % y 50-69 % 1RM) produce ganancias de
potencia **similares** a la alta (70-80 % 1RM) en adultos mayores. Solo **3 ECAs, 179
participantes**, aunque los tres de alta calidad metodológica.

Nótese la asimetría: lo demostrado es que bajar la intensidad **no perjudica** la potencia, no que
la mejore. No es razón para bajarla, pero sí razón para no forzarla hacia arriba en este objetivo.

> Sports Medicine - Open (2023). DOI 10.1186/s40798-023-00646-9

## Veredicto sobre los cuatro números del ruleset

| Número | Veredicto | Por qué |
|---|---|---|
| `fromAge: 60` | **se mantiene** | Borde usa exactamente 60-90 años. El corte coincide con la población medida. |
| `intensityMultiplier: 0.8` | **se cae** | Empuja fuera de la ventana 70-79 % justo donde la intensidad es el predictor más fuerte (p < 0,01). Dos metaanálisis dicen que ≥70 % es superior y no menos seguro. |
| `repsMinDelta: 2` | **se cae** | Borde mide el óptimo en **7-9** repeticiones. Sumar 2 al mínimo empuja por encima de esa ventana, no hacia ella. |
| `restMultiplier: 1.3` | **se cae** | Ninguna fuente respalda alargar el descanso por edad. La única señal de Borde (p = 0,06, y con subgrupos de 2 estudios) apunta en la dirección contraria. |

### El daño medido, antes de corregir

Cruzando el modificador contra las 36 combinaciones de objetivo × nivel × rol del ruleset, con el
`intensityMultiplier: 0.8` aplicado:

- **34 de 36** quedaban fuera de la ventana de fuerza 70-79 %.
- Los peores casos son los que más importan en un gimnasio de barrio: un **principiante de 65 años
  con objetivo hipertrofia** terminaba prescrito al **28-44 % 1RM** en los ejercicios de
  aislamiento, por debajo incluso de la ventana de morfología (51-69 %). Con objetivo fuerza,
  36-48 %.
- Un **principiante de 65 con objetivo fuerza** entrenaba su ejercicio principal al **48-56 %**,
  cuando el óptimo medido en su misma población es 70-79 %.

Y hay un defecto de implementación, independiente de la evidencia: `repsMax: Math.max(repsMax,
repsMin + delta)` **colapsa el rango a un punto** cuando el rango original era estrecho. En el
objetivo *potencia* toda combinación quedaba en **3-3 repeticiones**, y en *fuerza/novato/primario*
en **6-6**. Un rango de una sola repetición no es una prescripción, es un error aritmético.

## Lo que se cambió, y lo que ese cambio cuesta

`modifiers.olderAdults` pasó de cuatro multiplicadores a dos ventanas y una lista de objetivos:

```json
{
  "fromAge": 60,
  "intensityWindowPct1RM": [70, 79],
  "repsWindow": [7, 9],
  "appliesToGoals": ["strength", "hypertrophy"]
}
```

Se **reemplaza**, no se multiplica: la ventana es la que se midió en esta edad, no una rebaja
sobre la del adulto joven. En *resistencia* y *potencia* no se toca nada, porque Borde no los midió.

**El costo, que hay que mirar de frente:** después de los 60 las 24 combinaciones de objetivo ×
nivel × rol convergen a la misma prescripción de intensidad y repeticiones. El nivel de experiencia
deja de diferenciar esos dos números. Es lo que da la evidencia —Borde no distingue entrenados de
no entrenados, y sus sujetos eran mayormente sedentarios, o sea que **el caso medido *es* el del
principiante mayor**— pero significa que un socio de 62 años con dos años de gimnasio y uno que
empieza reciben la misma ventana.

Lo que sí sigue diferenciando al principiante mayor, porque el modificador no lo toca: **las series,
el RIR objetivo, el descanso y el paso de progresión** siguen siendo los de su nivel. Un
principiante de 65 hace 2-3 series con RIR 3 y escalones de carga de principiante; no llega al
70-79 % en la primera sesión, llega progresando. Esa es la parte que lo protege, y es deliberado.

**Queda abierto** si conviene una transición gradual en vez del escalón a los 60. Ninguna fuente
mide edades intermedias, así que hoy no hay con qué construirla sin inventar.

## Lo que esta investigación NO cubre

- **Edades intermedias (20-60).** No hay evidencia de que haya que modificar nada, y ninguna fuente
  acá lo mide. El motor no modifica nada en ese tramo, y eso queda justificado por ausencia.
- **Adolescentes.** Fuera de alcance; la app no los admite hoy.
- **Fragilidad.** Identificada como la variable que realmente importaba, y **la app no la mide**.
  Capturarla requeriría un instrumento validado (velocidad de marcha, SPPB, escala de Fried), que
  es una decisión de producto todavía no tomada.
- **Tiempo bajo tensión.** Predictor fuerte en la meta-regresión (p < 0,01, óptimo 6,0 s) y el motor
  **no lo prescribe en absoluto**. Es la brecha más clara que deja esta iteración.
- El DOI del metaanálisis de 18 ECAs está pendiente de verificar contra la fuente primaria; se citó
  por PMID.
