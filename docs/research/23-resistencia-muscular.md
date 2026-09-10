# La "zona de resistencia muscular" no se sostiene, y por eso el plan está bien

Revisión del 10 de septiembre de 2026. Salió de `npm run qa docs`, que marcaba `endurance` y
`cardio` como los dos únicos objetivos cuyos números **ninguna tabla respalda**.

La nota del propio ruleset lo declaraba así:

> "La investigación cubre resistencia aeróbica, no resistencia muscular en sala con repeticiones
> altas. Estos números son el extremo liviano del bloque de hipertrofia, que es el anclaje con
> evidencia más cercano; **no hay respaldo directo para series de 20 o 25 repeticiones**."

Honesto, y por eso el bloque va en `confidence: low`. Pero la nota se subestima: sí existe
literatura sobre el tema, y lo que dice **respalda la decisión que se tomó**, en vez de dejarla sin
piso.

**Veredicto: los números se mantienen, la confianza `low` se mantiene, y el motivo cambia.** No es
"no encontramos evidencia". Es que la evidencia que existe dice que la zona de altas repeticiones
como adaptación separada es equívoca, así que anclarse al extremo liviano de la carga moderada es lo
que la evidencia apoya, no un reemplazo por falta de algo mejor.

## Lo que había

| Slot | Series × reps | RIR | Descanso | %1RM |
|---|---|---|---|---|
| Primario | 3 × 12-15 | 2 | 60 s | 40-60 % |
| Secundario | 3 × 12-15 | 2 | 45 s | 40-60 % |
| Aislamiento | 2 × 12-15 | 2 | 45 s | 35-55 % |

Sin `byLevel`: el nivel declarado no cambia nada, y el plan lo avisa
(`10-nivel-de-experiencia.md`).

## Lo que dice la evidencia

### La zona de 15+ repeticiones existe como teoría, no como resultado — CONFIANZA ALTA

El "continuo de repeticiones" es el paradigma que la app estaría siguiendo si prescribiera 20 o 25
repeticiones. El trabajo lo describe y después lo examina:

> "A high repetition scheme with light loads (**15+ repetitions per set with loads below 60% of
> 1RM**) optimizes local muscular endurance improvements."

Y la conclusión, al final del mismo trabajo:

> "**Evidence for a load-specific effect on local muscular endurance remains equivocal.** Early work
> suggested a potential benefit of light load training on muscular endurance, particularly when
> testing on an absolute basis. That said, **the evidence for such an effect is rather weak and
> seems more relevant to the lower body musculature.** Alternatively, research investigating the
> effects of load on **relative** muscular endurance is conflicting and, for the most part, **does
> not seem to support recommendations drawn from the repetition continuum**."

O sea: lo que justificaría un bloque de altas repeticiones separado es justamente lo que no se
sostiene. Que el ruleset **no** prescriba 20-25 repeticiones deja de ser una carencia y pasa a ser
lo alineado con la evidencia.

> Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. *Loading Recommendations for Muscle Strength,
> Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum.* Sports.
> 2021;9(2):32. DOI 10.3390/sports9020032 — **verificado: metadatos y autoría contra Crossref, texto
> completo leído en Europe PMC (PMC7927075, PMID 33671664)**

### No hay "zona de hipertrofia": desde ~30 % 1RM para arriba, crece igual — CONFIANZA ALTA

Esto es lo que sostiene el anclaje elegido, y de paso confirma lo que ya había anotado
`12-objetivo.md` sobre separar `hypertrophy` de `endurance`:

> "With respect to hypertrophy, the compelling body of literature indicates that **similar whole
> muscle growth (i.e., muscle thickness, CSA) can be achieved across a wide spectrum of loading
> ranges ≥ ~30% 1RM. These findings are independent of age and training status.** Thus, as a matter
> of principle, **there is no ideal 'hypertrophy zone'**."

El socio que elige "resistencia muscular" y entrena a 40-60 % 1RM está por encima de ese umbral: no
está sacrificando músculo por elegir este objetivo. Lo que sí cambia, y el trabajo lo dice, es el
costo:

> "…a case can be made that moderate loads provide the most efficient means to achieve muscle
> development given that light load training involves performing many more repetitions compared to
> the use of heavier loads, which in turn increases the time spent training. Moreover, the high
> levels of metabolic acidosis that accompany the use of light loads tends to cause discomfort,
> which in turn can negatively impact adherence."

Ese es un argumento **contra** empujar el objetivo hacia 20-25 repeticiones que no es de eficacia
sino de adherencia, y para un gimnasio de barrio pesa.

### El umbral de ~30 % tiene una medición fisiológica que lo acompaña — CONFIANZA BAJA (n = 12, agudo)

Un trabajo posterior midió qué pasa a lo largo del espectro de cargas, hasta el fallo:

> "The 30%, 50%, 70%, 90% 1RM protocols induced muscle failure and similar levels of local and
> whole-body metabolic perturbation, while **the 10% did not lead to failure** and induced lower
> metabolic perturbation. […] CL was detected at a load corresponding to the **31.7 ± 11.9% 1RM**."

Coincide con el ≥ ~30 % de arriba, pero hay que decir lo que es: **12 sujetos, extensión de rodilla
unilateral, respuesta aguda**, no un desenlace de entrenamiento. Se anota como corroboración
mecanística, no como fuente de una prescripción. El mínimo del ruleset en este objetivo (35 % en
aislamiento) queda por encima del punto estimado.

> Colosio AL, D'hoe B, Bourgois JG, Boone J. *Minimum load threshold in resistance training:
> insights into muscle metabolism, excitation, and fatigue across the repetition continuum.* PeerJ.
> 2026;14:e20909. DOI 10.7717/peerj.20909 — **verificado: metadatos y autoría contra Crossref,
> abstract completo en Europe PMC (PMC12989152, PMID 41841121)**

## Veredicto sobre lo que había

| Elemento | Veredicto | Por qué |
|---|---|---|
| 12-15 repeticiones en vez de 20-25 | **se mantiene, ahora con respaldo** | La evidencia de una zona de altas repeticiones es equívoca y, en resistencia relativa, contradice al continuo. |
| 40-60 % 1RM (35-55 % en aislamiento) | **se mantiene** | Por encima del umbral de ~30 % desde el cual la hipertrofia es equivalente. |
| Anclarse al extremo liviano de hipertrofia | **se mantiene, y era la lectura correcta** | No hay zona de hipertrofia ideal: el rango entero ≥ ~30 % produce lo mismo. |
| `confidence: low` | **se mantiene, por otro motivo** | No es ausencia de evidencia: es evidencia que califica el efecto de equívoco. |
| La nota que dice "no hay respaldo directo" | **se corrige** | Subestima lo que hay. Existe literatura, la app la puede citar, y apoya la decisión. |
| Que el nivel no cambie nada en este objetivo | **se mantiene** | La dosis-respuesta que separaría niveles no existe ni para hipertrofia (`10`). El plan ya lo avisa. |
| No distinguir tren superior de inferior | **queda anotado, no se cambia** | Ver abajo: es el único efecto que el trabajo señala como plausible, y no alcanza para prescribir. |

## Lo único que el trabajo señala y el motor no modela

La asimetría entre tren superior e inferior aparece dos veces:

> "These findings suggest that **a repetition continuum for local muscular endurance seems more
> relevant to the lower body than the upper body musculature.**"

> "It is not clear as to why there may be load-dependent differences in muscular endurance between
> the upper and lower limbs, while no such effect is seen with respect to strength or hypertrophy
> outcomes; **further research is required** to better understand this apparent phenomenon."

Los propios autores lo dejan como fenómeno sin explicar y piden más investigación. Prescribir
repeticiones distintas arriba y abajo apoyado en eso sería exactamente lo que este proyecto evita:
convertir un hallazgo declarado como débil en un número. Se anota y no se toca.

## Lo que esta investigación NO cubre

- **Mujeres.** El propio trabajo lo marca: *"there is a paucity of studies carried out in women on
  the topic"*, y agrega que como las mujeres resisten mejor la fatiga, podría haber diferencias por
  sexo en todo el continuo. La app recoge `sex` en el alta y no lo usa para nada
  (`AUDITORIA-MOTOR.md`); esto no cambia eso, pero es otro lugar donde el dato haría falta y no
  existe la evidencia para usarlo.
- **Cuántas series.** Nada de lo de arriba habla de volumen para este objetivo. Las 3 y 2 series
  siguen viniendo del bloque de hipertrofia.
- **El descanso.** 60 y 45 segundos no salen de estos trabajos.
- **`cardio`**, que sigue siendo el otro objetivo sin tabla. Su parte aeróbica sí está respaldada en
  `02`; lo que no tiene respaldo directo es la dosis de sala que lo acompaña.
