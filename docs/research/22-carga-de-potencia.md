# La carga de potencia no es un rango: depende del ejercicio

Revisión del 10 de septiembre de 2026. Salió de correr la matriz del motor (`npm run qa:motor`)
sobre el catálogo real y mirar qué recibe un socio que elige el objetivo "Potencia / explosividad".

Dos cosas aparecieron juntas y resultaron ser la misma:

1. Un plan de potencia trae **la misma selección de ejercicios que uno de fuerza** —sentadilla en
   Smith, press inclinado, remo, press militar— a 1-3 repeticiones, y ninguno de los tres
   ejercicios explosivos que el gimnasio tiene cargados.
2. El ruleset prescribe **una sola banda de intensidad, 30-60 % del 1RM, para todos los ejercicios
   y todas las ranuras** de este objetivo.

**Veredicto: la banda única se cae.** Los dos metaanálisis que existen sobre el tema concluyen
explícitamente que la carga óptima para potencia es **específica del ejercicio**, y los ejercicios
explosivos que hay en Blue Horse caen fuera de la banda que el ruleset aplica.

## Lo que había

`01-fuerza-hipertrofia-potencia.md`, fila de la tabla:

| Parámetro | Valor | Justificación | Confianza |
|---|---|---|---|
| **Potencia: %1RM para potencia máxima** | 30–70 % (ideal ~30–60 %) | Estudios indican potencia máxima en 30–60 % 1RM para la mayoría de ejercicios explosivos. | **ALTO** |

Y en el ruleset, idéntico en las tres ranuras:

```json
"power": {
  "primary":   { "intensityPct1RM": [30, 60] },
  "secondary": { "intensityPct1RM": [30, 60] },
  "isolation": { "intensityPct1RM": [30, 60] }
}
```

**El documento no cita ninguna fuente.** `01-fuerza-hipertrofia-potencia.md` tiene 51 filas de tabla
y **cero DOIs**: su línea de "Fuentes" es una lista de autor-año terminada en "etc.", aunque afirma
citar "autor, año, publicación y DOI/PMID". Lo cuida ahora `npm run qa docs`.

## Lo que dice la evidencia

### Tren inferior: tres cargas óptimas distintas, no una — CONFIANZA ALTA

> "These results showed different optimal loads for each exercise examined. Moderate loads (from
> >30 to <70 % of 1RM) appear to provide the optimal load for power production in the squat
> exercise. Lighter loads (≤30 % of 1RM) showed the highest peak power production in the jump
> squat. Heavier loads (≥70 % of 1RM) resulted in greater peak power production in the power clean
> and hang power clean."
>
> "Our meta-analysis of results from the published literature provides evidence for
> exercise-specific optimal loads for power production."

27 estudios, 468 sujetos, 5766 tamaños de efecto. Hedges' g con modelo de efectos aleatorios
ponderado. Las cargas se clasificaron en tres zonas: 0-30 %, 30-70 % y ≥70 % del 1RM.

> Soriano MA, Jiménez-Reyes P, Rhea MR, Marín PJ. *The Optimal Load for Maximal Power Production
> During Lower-Body Resistance Exercises: A Meta-Analysis.* Sports Med. 2015;45(8):1191-1205.
> DOI 10.1007/s40279-015-0341-8 — **verificado: metadatos contra Crossref, abstract leído entero en
> Europe PMC (PMID 26063470)**

### Tren superior: el mismo patrón — CONFIANZA ALTA

> "Moderate loads (from >30 to <70 % of 1RM) appear to provide the optimal load for peak power and
> mean power in the bench press exercise."
>
> "Lighter loads (<30 % of 1RM) appear to provide the highest mean and highest peak power
> production in the bench press throw exercise."

11 estudios, 434 sujetos, 7680 tamaños de efecto, con las mismas tres zonas de intensidad. La
conclusión de los autores habla de "exercise-specific optimal power loading for upper body
exercises".

> Soriano MA, Suchomel TJ, Marín PJ. *The Optimal Load for Maximal Power Production During
> Upper-Body Resistance Exercises: A Meta-Analysis.* Sports Med. 2017;47(4):757-768.
> DOI 10.1007/s40279-016-0626-6 — **verificado: abstract leído en Europe PMC (PMID 27699699)**

### Lo que el patrón dice, junto

Los dos trabajos, con 38 estudios y 902 sujetos entre ambos, encuentran lo mismo en tren inferior y
superior: **la carga óptima se ordena por el tipo de movimiento**, no por el objetivo.

| Tipo de movimiento | Carga óptima | Ejemplos de los papers |
|---|---|---|
| Balístico (el implemento o el cuerpo se sueltan) | **≤30 % 1RM** | jump squat, bench press throw |
| Compuesto tradicional | **>30 a <70 % 1RM** | sentadilla, press de banca |
| Derivado del levantamiento olímpico | **≥70 % 1RM** | power clean, hang power clean |

La banda 30-60 % del ruleset cubre bien la fila del medio y **erra las otras dos en direcciones
opuestas**: es demasiado pesada para un movimiento balístico y demasiado liviana para un derivado
olímpico.

## Por qué importa acá y no en abstracto

Los tres ejercicios que Blue Horse tiene marcados como explosivos son:

| Ejercicio | Patrón | Modalidad | Zona que le corresponde |
|---|---|---|---|
| Salto al cajón | squat | peso corporal | balístico → **≤30 %** |
| Wall ball | squat | peso corporal | balístico → **≤30 %** |
| Slam ball | hinge | peso corporal | balístico → **≤30 %** |

Los tres caen en la zona balística, o sea **abajo** de la banda que el ruleset prescribe. Y los tres
son de peso corporal, así que un porcentaje del 1RM sobre ellos no significa nada: no hay carga
externa que ajustar.

Ahí se cierra el círculo con el otro hallazgo. El selector prefiere `reps_weight` en el ejercicio
principal —"toda la progresión se mide en kilos"—, que es correcto para fuerza e hipertrofia. Con
ocho ejercicios de patrón squat cargables disponibles, esa preferencia los deja afuera del slot
principal. El resultado es un plan de potencia hecho de ejercicios no explosivos, al que se le
aplica una banda de intensidad pensada para ejercicios explosivos.

**Corrección del 10 de septiembre de 2026.** La primera versión de este párrafo decía que la
preferencia deja afuera a los tres explosivos *siempre*. Se midió sobre los 32 perfiles de la matriz
y es más matizado: **un** plan recibe uno —vóley, fuera de temporada, "Salto al cajón" en la sesión
de pierna—, y **ningún plan de potencia recibe ninguno**. La afirmación fuerte era la del slot
principal; la de "nunca entran a ningún plan" no se sostiene y quedó anotada con un test que vigila
que siga entrando al menos uno (`tools/motor-matriz.test.ts`).

## Veredicto sobre lo que había

| Elemento | Veredicto | Por qué |
|---|---|---|
| Banda única `[30, 60]` para todo el objetivo | **se cae** | Los dos metaanálisis concluyen explícitamente carga específica del ejercicio, con tres zonas separadas. |
| Etiquetar esa fila como confianza **ALTO** | **se cae** | La conclusión que se cita como respaldo dice lo contrario de lo que la fila afirma. |
| `rirTarget: null` en potencia | **se mantiene** | Es coherente con regular por velocidad y no por proximidad al fallo. Ninguno de los dos trabajos lo contradice. |
| Repeticiones 1-3 / 1-5 | **se mantiene** | No es lo que estos trabajos miden; no hay con qué moverlo. |
| Preferir `reps_weight` en el principal | **se cae, solo para potencia** | El ruleset ya dice que la potencia no progresa por carga. Mantener el filtro ahí garantiza que ningún ejercicio explosivo entre nunca. |

## Lo que queda para decidir

Nada de esto se aplicó al ruleset todavía: cambiar una prescripción es una decisión de producto.
Las opciones, con lo que cuesta cada una:

1. **Abrir la banda por tipo de movimiento.** `intensityPct1RM` pasa de un rango a tres, elegidos
   por una marca del ejercicio. Requiere marcar los ejercicios como balístico / tradicional /
   derivado olímpico en el catálogo — hoy solo existe `is_explosive`, que no distingue las tres.
2. **Sacar el filtro de `reps_weight` para el objetivo potencia** y preferir explosivos. Es el
   cambio chico, y hace que el principal de un plan de potencia sea un salto al cajón. Pero deja
   sin sentido el `%1RM` en ese slot, porque no hay carga externa.
3. **Marcar más ejercicios como explosivos en el catálogo**, si el gimnasio tiene con qué armar
   variantes cargadas (push press, lanzamientos con balón medicinal cargado, empujes de trineo).
   Es la única de las tres que resuelve la tensión en vez de elegir un lado: da ejercicios
   explosivos **y** cargables, que es lo que la banda 30-70 % describe.

Mientras tanto, el plan **avisa**: un plan de potencia sin ningún ejercicio explosivo lo dice en
pantalla, nombra los tres que el gimnasio tiene y manda a consultar con el staff. Es la regla dura 4
aplicada a la selección en vez de a los números.
