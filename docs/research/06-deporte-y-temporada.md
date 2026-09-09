# Deporte practicado y momento de la temporada

Busca cerrar el hueco que dejaba abierto `04-individualizacion-seguridad.md`: ahí el bloque
**DEPORTE PRACTICADO** decía que la transferencia existe pero que "no hay una necesidad comprobada
de usar cargas o ejercicios de forma muy distinta". Esa afirmación se sostiene, y ahora con
números: abajo están los efectos, sus intervalos de confianza y las limitaciones que declaran los
propios autores.

Hecha el 9 de septiembre de 2026 con búsqueda directa de metaanálisis, no con los prompts de
`PROMPTS.md`. Cada fuente se abrió y se leyó: **el resumen automático de un buscador presentaba la
especificidad direccional como respaldada cuando el paper la refuta** (citaba la introducción, no
los resultados).

## Lo que se cae

### La carga no cambia por deporte — CONFIANZA ALTA

Cargas pesadas vs livianas en atletas de élite: **SMD = −0,03 (IC 95% −0,38 a 0,31; p > 0,05;
I² = 0%)**.

Un I² de cero significa que los estudios no se contradicen entre sí: es de los nulos más limpios
disponibles. **Consecuencia para el motor: el deporte no puede tocar `sets`, `repsMin`, `repsMax`,
`intensityPct1RM` ni `rirTarget`.** Lo que ya prescribe el objetivo se mantiene tal cual.

> Jiménez-Martínez et al. (2024), *The Effects of Resistance Training on Sport-Specific Performance
> of Elite Athletes: A Systematic Review with Meta-Analysis*. 23 estudios, 460 atletas.
> DOI 10.5114/jhk/185877

### La especificidad direccional está refutada — CONFIANZA ALTA

Entrenamiento en vector horizontal vs vertical, sobre las tres salidas que se supone que debería
mejorar:

| Salida | g de Hedges | IC 95% | p |
|---|---|---|---|
| Sprint corto (corto plazo, 12 estudios) | −0,23 | −0,56 a 0,10 | 0,16 |
| Salto (15 estudios) | 0,06 | −0,22 a 0,33 | 0,67 |
| Cambio de dirección (8 estudios) | −0,45 | −1,31 a 0,41 | 0,26 |

22 estudios, 578 participantes (61 mujeres, 517 varones). Los autores concluyen que ambas
direcciones son igual de efectivas y que los resultados **refutan** la especificidad direccional.

**Consecuencia: "fútbol → ejercicios de empuje horizontal" no tiene respaldo.** No se implementa.

*Limitaciones declaradas:* heterogeneidad moderada a alta en sprint, fuerza máxima y cambio de
dirección; solo participantes recreativamente activos; indicios de sesgo de publicación.

> Huang et al. (2024), *Effects of direction specific exercise training on athletic performance*,
> PeerJ. DOI 10.7717/peerj.18047

## Lo que queda en pie

### Entrenar fuerza sí transfiere — CONFIANZA ALTA

**SMD = 1,16 (IC 95% 0,65 a 1,66; p < 0,00001)** sobre rendimiento deportivo específico. Es un
efecto grande: el campo "deporte" merece existir y merece hacer algo.

### El eje real es gesto local vs rendimiento global — CONFIANZA MEDIA

Del mismo metaanálisis, el análisis por tipo de salida:

| Tipo de salida | SMD | IC 95% | |
|---|---|---|---|
| **Local** — velocidad de lanzamiento, velocidad de patada | **1,59** | 0,88 a 2,29 | p < 0,00001 |
| **Global** — correr, nadar, pedalear | 0,49 | −0,11 a 1,09 | no significativo |

Esta es la única partición del campo "deporte" que la evidencia sostiene, y no depende del deporte
sino de **qué limita el rendimiento en ese deporte**. Un futbolista mejora mucho la potencia de
patada con trabajo de sala; un corredor de fondo casi no mejora su carrera.

También se observó que el efecto es grande en atletas de nivel nacional (SMD 1,57; IC 0,90–2,24) y
chico y no significativo en internacionales (SMD 0,29; IC −0,07–0,64) — cuanto más entrenado, menos
margen. Para los socios de un gimnasio de barrio aplica el extremo alto.

*Limitaciones declaradas:* "falta de claridad sobre cómo las adaptaciones derivadas del
entrenamiento de fuerza se traducen en rendimiento deportivo mejorado"; hueco crítico de
investigación en atletas mujeres de élite.

**Consecuencia para el motor:** el deporte se usa como **sesgo de selección** entre ejercicios ya
equivalentes (qué músculos priorizar), nunca como cambio de dosis. Es exactamente la palanca que
abrió el bloque `selection` del ruleset.

### En temporada se puede bajar el volumen — CONFIANZA BAJA

Esto se repite como si fuera consenso firme y **no lo es**. La única comparación directa in-season
que encontró la revisión:

- Yanci et al., futbolistas de nivel 3, **n = 16**. Pliometría a 2 series × 2 sesiones/semana (180
  contactos) vs 4 series × 2 sesiones (360 contactos) — un recorte del **50%**.
- **Tamaño de efecto: −0,04 a 0,04.** Diferencias despreciables.

El metaanálisis global de volumen bajo vs alto en deportes de equipo (17 estudios, n = 213) da
**SMD = −0,05 (IC 95% −0,19 a 0,09; p = 0,506)**: una tendencia no significativa a favor del
volumen alto.

Los revisores califican la **certeza de la evidencia como "muy baja"** por alto riesgo de sesgo y
muestras chicas, y concluyen textualmente que "la variabilidad en los diseños de estudio y los
métodos de entrenamiento hace difícil establecer una dosis mínima clara".

**Consecuencia: el multiplicador de volumen en temporada va marcado `confidence: "low"` y con
`confidenceNote`, y se muestra en pantalla.** Un solo estudio de 16 personas no autoriza a
presentarlo como un hecho.

> Impact of Lower-Volume Training on Physical Fitness Adaptations in Team Sports Players (2025).
> DOI 10.1186/s40798-024-00808-3

### La frecuencia da igual si el volumen es el mismo — CONFIANZA MEDIA

Comparaciones de frecuencia con volumen igualado en poblaciones bien entrenadas, 6–12 semanas,
10 estudios (18 a 61 sujetos cada uno):

- Tren superior: **g = 0,088 (p = 0,505)**
- Tren inferior: **g = 0,061 (p = 0,651)**

Ambas frecuencias mejoraron respecto del inicio (superior g = 0,323; inferior g = 0,562, ambos
p < 0,001), pero **no entre sí**.

**Consecuencia:** en temporada el volumen semanal se puede repartir como convenga con el calendario
de competencia sin costo de adaptación. Esto es útil y es de las cosas mejor sostenidas del
conjunto.

*Limitaciones declaradas:* todos los sujetos varones con la misma prueba de fuerza; las
intervenciones usaron rangos de repeticiones de hipertrofia (8–12) más que protocolos de fuerza
pura.

> Cuthbert et al. (2021), *Effects of Variations in Resistance Training Frequency on Strength
> Development in Well-Trained Populations and Implications for In-Season Athlete Training*, Sports
> Medicine. DOI 10.1007/s40279-021-01460-7

## Huecos que esta investigación NO cubre

- **Qué músculos prioriza cada deporte.** Ningún metaanálisis lo mapea. La categoría "gesto local"
  tiene respaldo; el mapa deporte → músculos es criterio de práctica y va como BAJA.
- **Cuánto dura cada fase de la temporada.** No hay nada; lo declara la persona.
- **Deportistas recreativos.** Toda la evidencia de arriba es sobre atletas de élite o
  bien entrenados. Que aplique a un socio que juega al fútbol los sábados es una extrapolación.
- **Mujeres.** Señalado como hueco crítico por los propios autores del metaanálisis principal.
