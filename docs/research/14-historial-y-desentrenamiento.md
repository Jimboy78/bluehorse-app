# Volver después de una pausa: el mecanismo estaba al revés

Auditoría del 9 de septiembre de 2026, séptima iteración de la revisión del motor.

`daysSinceLastSession` es de las pocas entradas que **sí se usa de verdad**: `apps/web/src/lib/plan.ts`
la calcula contra la base y el motor la convierte en un recorte de carga vía el bloque `detraining`.

```json
"detraining": [
  { "days": 10, "loadMultiplier": 1 },
  { "days": 30, "loadMultiplier": 0.85 },
  { "days": 90, "loadMultiplier": 0.7 }
]
```

Y a diferencia de casi todo lo auditado hasta acá, **tiene fuente**: `03-progresion-descarga.md` cita
a Mujika y Padilla (2000, 2001), que es la referencia canónica del desentrenamiento, con PMIDs.

El problema es otro: **la fuente describe la cinética de lo que se pierde, y de ahí alguien derivó
multiplicadores de carga.** La cinética no da multiplicadores. Ese salto es lo que se audita acá.

## Lo que dice la evidencia

### La fuerza no se pierde. El tendón sí. — CONFIANZA BAJA (n = 8), mecanismo claro

Estudio del curso temporal de músculo y tendón: 8 sujetos, 3 meses de entrenamiento isométrico de
extensión de rodilla y 3 meses de desentrenamiento, con mediciones **cada mes**.

Durante el entrenamiento: la fuerza subió 29,6 % a los 2 meses y 40,5 % a los 3. El área muscular y
la rigidez del tendón **no cambiaron hasta el segundo mes**.

Durante el desentrenamiento, que es lo que nos importa:

| Qué | Cuándo vuelve al nivel pre-entrenamiento |
|---|---|
| Fuerza máxima | **no cambió en 3 meses** |
| Activación neural | **no cambió en 3 meses** |
| Área muscular | **1 mes** |
| **Rigidez del tendón** | **2 meses** |

Los autores lo cierran así: las adaptaciones del tendón y de la morfología muscular al entrenamiento
son **más lentas** que las de la función muscular, y a la inversa, sus adaptaciones al
desentrenamiento son **más rápidas**.

> Kubo K, Ikebukuro T, Yata H, Tsunoda N, Kanehisa H. *Time course of changes in muscle and tendon
> properties during strength training and detraining.* J Strength Cond Res. 2010;24(2):322-331.

**Limitación grande, y hay que decirla: n = 8**, ejercicio isométrico de una sola articulación. Es
un estudio chico. Lo que lo hace utilizable es que el mecanismo coincide con lo que se sabe del
tejido conectivo, no la potencia estadística.

### El mensaje del motor tiene el mecanismo dado vuelta

El aviso que se le muestra al socio hoy dice:

> "La fuerza vuelve rápido; el tendón tarda más, y es lo que se lastima al retomar de golpe."

Los datos dicen otra cosa, y **más fuerte**: la fuerza **no se fue**. A los 3 meses seguía igual que
al terminar de entrenar. Lo que se perdió fue la rigidez del tendón, a los 2 meses.

O sea el riesgo real al volver no es que la fuerza se recupere antes que el tendón. Es que **la
persona vuelve pudiendo levantar exactamente lo mismo que antes, con un tendón que ya no está
adaptado a esa carga**. Esa asimetría es un argumento *mejor* para bajar la carga al retomar que el
que estaba escrito, y es el que hay que decirle al socio: *podés, pero tu tendón todavía no*.

La literatura de adaptación músculo-tendón lo señala explícitamente: las diferencias en el curso
temporal de adaptación entre músculo y tendón **desacoplan la unidad musculotendinosa y elevan el
riesgo de lesión por sobreuso**.

### El tamaño muscular casi no se mueve — CONFIANZA BAJA

Metaanálisis de cese del entrenamiento en adultos mayores de 65 años (6 estudios, 8 grupos, entre 5
y 19 participantes cada uno; cese de 12 a 52 semanas):

| Duración del cese | Cohen's *d* (IC 95 %) | |
|---|---|---|
| Global | −0,83 (−1,30 a −0,36) | significativo |
| **12-24 semanas** | −0,60 (−1,21 a 0,01) | **no significativo** |
| 31-52 semanas | −1,11 (−1,75 a −0,47) | significativo |

> DOI 10.3390/ijerph192114048

Noventa días son ~13 semanas: caen justo en el tramo donde **no hay pérdida significativa de tamaño
muscular**. Si el argumento para recortar un 30 % fuera la atrofia, no se sostendría. Como el
argumento es el tendón, sí — pero entonces el umbral relevante no es 90 días, es **60**.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Recortar carga al volver | **se mantiene** | El desacople músculo-tendón lo justifica, y es la clase de error que lesiona. |
| El texto del aviso | **se corrige** | Dice que la fuerza vuelve rápido. No vuelve: nunca se fue. El mecanismo real es más fuerte. |
| El texto viviendo en el código | **se corrige** | Estaba escrito en `placeholder-engine.ts`. Si los números no viven en el código, el texto que los explica tampoco. |
| Escalones 10 / 30 / 90 días | **quedan, declarados** | Los umbrales son plausibles y el de 30 coincide con la caída de área muscular. **El de 90 llega tarde**: el tendón ya está en nivel pre a los 60. |
| Multiplicadores 0,85 y 0,7 | **sin origen** | Mujika y Padilla describen qué se pierde y cuándo, no cuánta carga sacar. No se cambiaron: reemplazarlos sería sustituir un número sin fuente por otro sin fuente. |

## Lo que se cambió

El aviso pasó a vivir en el ruleset (`modifiers.detraining.note`), con el mecanismo corregido: la
fuerza se conserva, el tendón no, y por eso lo que podés levantar hoy no es lo que tu tendón tolera.

**No se tocó ningún multiplicador ni ningún umbral.** Mover el escalón de 90 días a 60 haría el
sistema más conservador apoyándose en un estudio de 8 personas, y agregar un escalón nuevo obligaría
a inventar un multiplicador. Las dos cosas quedan como decisión de producto, declaradas acá.

## Lo que esta investigación NO cubre

- **Cuánta carga sacar.** Nadie lo midió. Es la pregunta que el ruleset responde con 0,85 y 0,7 sin
  fuente, y sigue sin responder.
- **El cardio al volver.** `detraining` solo ajusta la carga de sala. `03` dice que el VO2max cae
  entre 4 % y 14 % en **menos de 10 días** — mucho más rápido que la fuerza — y el motor no ajusta
  nada del bloque `cardio` por ausencia. Es un hueco concreto y queda anotado.
- **Cuánto tarda en volver la rigidez del tendón al retomar.** Kubo mide la pérdida, no la
  recuperación. Sin eso no se puede decir cuántas sesiones conviene sostener el recorte, y hoy el
  motor lo aplica solo al generar el plan.
- **`baselines`.** Quedó fuera de esta iteración por tiempo; sigue pendiente, con la advertencia de
  `04` de que el autorreporte de cargas subestima.
