# El RIR de hipertrofia dice confianza ALTA, y los propios autores dicen que la relación no está clara

Revisión del 13 de septiembre de 2026. Sale de auditar `01-fuerza-hipertrofia-potencia.md`, que
sostiene el núcleo del ruleset (series, reps, RIR y descanso de fuerza, hipertrofia y potencia) sin
ninguna cita verificable. Se tomó un parámetro central: el RIR objetivo del ejercicio principal de
hipertrofia, la fila que más directamente decide cuán cerca del fallo entrena la mayoría de los
socios de Blue Horse.

## Lo que hay hoy

`prescription.hypertrophy.confidence` en el ruleset vale **`"high"`**, y es un campo que se
**consume de verdad**: `EvidenceNotice.tsx:46` solo muestra el aviso de evidencia floja cuando
`confidence === 'low'`. Con `"high"`, el socio que elige hipertrofia no ve ningún aviso de
incertidumbre sobre cómo se calculó su RIR.

`01-fuerza-hipertrofia-potencia.md`, la fila que lo sostiene:

| Parámetro | Valor | Justificación | Confianza |
|---|---|---|---|
| **Hypertrophy – primary: RIR** | 1 | Meta muestra mayor hipertrofia cuando se entrena cerca del fallo (RIR≈0-1). | **ALTO** |

Sin DOI, sin autor, sin año — como las otras 50 filas del documento.

## Lo que dice la evidencia real

### Entrenar al fallo contra no llegar al fallo — efecto TRIVIAL, no "mayor hipertrofia"

Metaanálisis de 15 estudios, adultos sanos de cualquier edad y experiencia:

> "There was a trivial advantage for resistance training performed to set failure versus
> non-failure for muscle hypertrophy in studies applying any definition of set failure
> [effect size=0.19 (95% CI 0.00, 0.37), p=0.045] […] we found no advantage for […] resistance
> training performed to momentary muscular failure versus non-failure for muscle hypertrophy
> [effect size=0.12 (95% CI −0.13, 0.37), p=0.343]."
>
> "There is no evidence to support that resistance training performed to momentary muscular
> failure is superior to non-failure resistance training for muscle hypertrophy […] these results
> provide evidence for a **potential non-linear relationship** between proximity-to-failure and
> muscle hypertrophy."

> Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ. *Influence of Resistance Training
> Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis.*
> Sports Med. 2023;53(3):649-665. DOI 10.1007/s40279-022-01784-y — **verificado: metadatos en
> Crossref, abstract completo en Europe PMC.**

El efecto de **entrenar hasta el fallo momentáneo** (RIR 0, lo más cerca posible de lo que el
ruleset prescribe) contra no llegar al fallo **no es significativo** (p=0,343). El "trivial pero
significativo" (ES 0,19; p=0,045) sale solo cuando se agrupan definiciones más laxas de "fallo de
serie", que no es lo mismo que RIR 0-1.

### Cuantificando el RIR exacto — los propios autores piden cautela

Meta-regresión de 2024, ajustada por carga, forma de igualar volumen, duración y nivel de
entrenamiento:

> "In all of the best-fit models for muscle hypertrophy, the marginal slopes for estimated RIR
> were negative and their confidence intervals did not contain a null point estimate, indicating
> that changes in muscle size increased as sets were terminated closer to failure."
>
> "Considering the RIR estimation procedures used, however, **the exact relationship between RIR
> and muscle hypertrophy and strength remains unclear**. […] caution is warranted when interpreting
> the present analysis due to its **exploratory nature**."

> Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC. *Exploring the
> Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength
> Gain, and Muscle Hypertrophy: A Series of Meta-Regressions.* Sports Med. 2024. DOI
> 10.1007/s40279-024-02069-2 — **verificado: metadatos en Crossref, abstract completo en Europe
> PMC.**

Sí hay una relación (pendiente negativa, IC no cruza el cero): entrenar más cerca del fallo
**tiende** a dar algo más de hipertrofia. Pero el propio trabajo que la mide dice, en la misma
frase, que la relación exacta **no está clara** y que el análisis es **exploratorio**. Eso es lo
opuesto de lo que sostiene una fila con confianza ALTA.

### La fuerza, en cambio, sí está bien etiquetada

El mismo trabajo, sobre fuerza:

> "In all of the best-fit models for strength, the confidence intervals of the marginal slopes for
> estimated RIR contained a null point estimate, indicating a negligible relationship with strength
> gains. […] Strength gains were similar across a wide range of RIR."

Esto **sí** coincide con lo que dice `01` para fuerza ("ganancias de fuerza son similares para RIR
altos o bajos", confianza MEDIO) y con lo que el ruleset declara: `prescription.strength.confidence`
también vale `"high"`, pero ahí la afirmación es la ausencia de un efecto, medida con un intervalo
de confianza que sí incluye el cero — una conclusión negativa bien sostenida, no una cuantificación
precisa. Ese uso de "alta confianza" es razonable.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| `hypertrophy.primary.rirTarget: 1` | **se mantiene** | La dirección (más cerca del fallo, algo mejor) tiene respaldo en dos meta-análisis reales; no hay con qué reemplazarlo por otro número. |
| `prescription.hypertrophy.confidence: "high"` | **se cae** | Los dos trabajos que miden esto exactamente usan las palabras "trivial", "no evidence", "remains unclear" y "exploratory". Etiquetar esto como alta confianza es un error material, no un matiz. |
| `prescription.strength.confidence: "high"` sobre RIR | **se mantiene** | Es una conclusión negativa (el RIR no importa mucho) con intervalo de confianza que incluye el cero — bien sostenida por la misma meta-regresión. |
| Entrenar a fallo momentáneo (RIR 0) específicamente | **sin respaldo especial** | Refalo 2023: sin ventaja significativa (p=0,343) contra no llegar al fallo. El ruleset pide RIR 1, no RIR 0, así que no prescribe literalmente esto — pero tampoco hay evidencia de que RIR 1 sea mejor que RIR 2-3 en hipertrofia; solo que la tendencia general apunta para ese lado. |

## Lo que esta investigación NO cubre

- **Las otras 49 filas de `01`.** Esta es la segunda fila de ese documento que se verifica a fondo
  (la primera fue la intensidad de potencia, en `22`). Series, descansos e intensidades de fuerza e
  hipertrofia siguen sin una cita propia.
- **Si `1` es el número correcto dentro de la tendencia.** Ningún trabajo mide "RIR 1 contra RIR 2"
  específicamente con la potencia estadística para distinguirlos; la meta-regresión trabaja con RIR
  estimado, no asignado, así que tampoco puede señalar un punto óptimo.
- **`power.confidence`**, que en el ruleset vale `"low"` — ese ya se corresponde con lo que
  `22-carga-de-potencia.md` encontró.

## Lo que queda para decidir (dueño)

Bajar `prescription.hypertrophy.confidence` de `"high"` a `"medium"` (o a `"low"`, si se prefiere
ser más conservador dado que los propios autores dicen "remains unclear"). Es un cambio de una
palabra en el ruleset, pero cambia si `EvidenceNotice` le muestra o no un aviso a cada socio con
objetivo hipertrofia — que es la mayoría del gimnasio. No se tocó: es contenido que le habla
directo al socio, mismo criterio que el resto de esta auditoría.
