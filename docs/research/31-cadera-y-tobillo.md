# Cadera y tobillo: hay evidencia, pero no alcanza para una regla como las otras cinco

Revisión del 12 de septiembre de 2026. Sale de `27-zonas-sin-regla.md`, que dejó explícitamente
como decisión del dueño si conviene investigar reglas de dolor para cadera y tobillo — las dos
zonas sin cobertura que más aparecen en un gimnasio. Esto **no aplica nada al ruleset**: es la
investigación que faltaba para que esa decisión se tome con evidencia al lado, no a ciegas.

## Cadera: síndrome de dolor trocantéreo mayor (GTPS) — CONFIANZA MEDIA

El dolor lateral de cadera en sala (rango de movimiento de aducción de cadera cargada, step-ups,
abducción con banda) casi siempre corresponde a tendinopatía/bursitis del glúteo medio-menor, que es
lo que describe GTPS. No es la única causa de dolor de cadera (artrosis, pinzamiento
femoroacetabular, dolor referido lumbar), así que esto cubre un subconjunto, no la zona entera.

> "In the long term, exercise slightly reduces hip pain and disease severity, while slightly
> improving patient-reported physical function and global rating of change compared to a control
> condition. No serious adverse events were reported. Compared to corticosteroid injection, exercise
> improves long-term global rating of change."
>
> "The current evidence supports a strong recommendation for exercise as first line treatment in
> patients clinically diagnosed with GTPS."

6 ECAs, 733 participantes, modelo de efectos aleatorios, calidad evaluada con GRADE, registrado en
PROSPERO (CRD42021261380).

> Kjeldsen T, Hvidt Overgaard S, et al. *Exercise compared to a control condition or other
> conservative treatment options in patients with Greater Trochanteric Pain Syndrome: a systematic
> review and meta-analysis of randomized controlled trials.* Physiotherapy. 2024;123:1-13.
> DOI 10.1016/j.physio.2024.01.001 — **verificado: metadatos en Crossref, abstract completo en
> Europe PMC.**

Mismo patrón que ya apareció con la zona lumbar en `09-dolor-y-lesiones.md`: la evidencia empuja
hacia **seguir cargando**, no hacia sacar el patrón. "Sin eventos adversos serios" y "superior a la
infiltración de corticoides a largo plazo" son argumentos a favor de mantener el ejercicio, no de
excluirlo.

**Lo que NO dice este trabajo:** ni carga inicial, ni progresión, ni qué posiciones evitar en el
tramo agudo (la literatura clínica sobre GTPS sí advierte contra la aducción de cadera cargada en
posiciones que comprimen el trocánter — cruzar la pierna, dormir del lado afectado, sentadilla muy
profunda con aducción — pero eso no salió de un metaanálisis, salió de guías clínicas sin el mismo
nivel de evidencia, así que no se cita como si fuera lo mismo).

## Tobillo: inestabilidad crónica de tobillo (CAI) — CONFIANZA MEDIA

Igual que con cadera, "dolor de tobillo" en un gimnasio casi siempre es inestabilidad crónica
post-esguince (CAI), no una fractura ni una tendinopatía aquílea aguda (esa ya está cubierta en
`09` vía Silbernagel). Es la lectura razonable para alguien que marca "tobillo" en el onboarding de
una PWA de gimnasio, no una lesión traumática reciente.

> "All therapeutic exercise modalities (neuromuscular training, strength training, combined
> neuromuscular and strength training, combined neuromuscular and whole-body vibration training)
> exhibited statistically superior efficacy compared to control groups. Combined neuromuscular and
> strength training constitutes the most effective therapeutic exercise for augmenting ankle
> inversion muscle function in CAI populations."

Metaanálisis en red, 9 estudios, 366 participantes. Tamaños de efecto (IC 95 %):

| Modalidad | Effect size |
|---|---|
| Fuerza + neuromuscular combinado | **2,82 (1,89–3,74)** — mejor ranking, SUCRA 99,9 % |
| Solo neuromuscular con vibración | 1,92 (0,62–3,22) |
| Solo fuerza | 1,36 (0,73–1,99) |
| Solo neuromuscular | 1,05 (0,29–1,82) |

> Zhang et al. *Which therapeutic exercise is most effective for improving ankle inversion muscle
> function in individuals with chronic ankle instability? A systematic review and network
> meta-analysis.* Front Bioeng Biotechnol. 2025. DOI 10.3389/fbioe.2025.1691203 — **verificado:
> abstract completo en Europe PMC.**

Otra vez el mismo patrón: fortalecer (solo o combinado) mejora la función, no la empeora. El
metaanálisis mide función muscular de inversión, no dolor directamente — es una limitación real:
no es exactamente la misma pregunta que se le hace al ruleset de dolor (¿hay que sacar algo?).

## Por qué esto no se convierte en una regla todavía

Las cinco reglas que sí existen (`09-dolor-y-lesiones.md`) responden una pregunta puntual: *con
dolor de nivel X en la zona Y, ¿qué patrón o músculo se saca o se monitorea?* Los dos trabajos de
acá responden una pregunta distinta: *el ejercicio en general, contra no hacer nada o contra otro
tratamiento, ¿ayuda?* — que es lo que hace falta para justificar "no hay que evitar la zona", pero no
alcanza para escribir un umbral de severidad ni una lista de patrones a sacar, que es la forma que
tienen las otras cinco reglas del ruleset.

Escribir `avoidPatterns` para cadera o tobillo con esto sería el mismo error que `27` ya evitó: un
número que suena razonable y no está medido. Lo que sí se puede decir con esta evidencia, sin
inventar nada:

- Cadera y tobillo **no deberían tratarse con la misma cautela por defecto que llevan hoy** (silencio
  total, `noRuleForRegion`): hay evidencia de que cargar ayuda y no hay evidencia de daño.
- Ninguna de las dos alcanza para un umbral de severidad que saque un patrón, porque ninguno de los
  dos metaanálisis mide eso.

## Veredicto

| Elemento | Veredicto | Por qué |
|---|---|---|
| Mantener `safety.noRuleForRegion` para cadera y tobillo | **se mantiene, por ahora** | Ninguna fuente da un umbral de severidad ni una lista de exclusión — inventarlos sería peor que el aviso actual. |
| La premisa de que "no hay nada que decir" sobre estas zonas | **se cae** | Hay evidencia de calidad media/GRADE de que el ejercicio ayuda en ambas. El aviso podría decir eso en vez de solo "no tenemos regla". |

## Lo que queda para decidir (dueño)

1. **Cambiar el texto de `noRuleForRegion` cuando la zona es cadera o tobillo**, para decir algo más
   que "no tenemos regla": que la evidencia en general apoya seguir moviendo la zona, sin comprometerse
   a un patrón concreto. Es un cambio de texto, no de números — pero es contenido, así que igual
   necesita la revisión de quien decide qué se le dice al socio.
2. **No escribir `avoidPatterns` para ninguna de las dos** hasta que exista un trabajo que mida
   específicamente qué patrón sacar y con qué severidad, como el que ya existe para zona lumbar.
3. **Si aparece dolor agudo de tobillo (esguince reciente)**, esto no aplica: es la misma brecha de
   `09-dolor-y-lesiones.md` (agudo vs. crónico) y `17-lesion-aguda.md`, no una nueva.

## Lo que este documento NO cubre

- Artrosis de cadera, pinzamiento femoroacetabular, dolor lumbar referido a cadera — causas
  distintas de dolor de cadera que no son GTPS.
- Esguince agudo de tobillo (los estudios de CAI son sobre inestabilidad **crónica**, no el evento
  agudo).
- Codo, espalda alta y "otra" — las otras tres zonas sin regla de `27-zonas-sin-regla.md`. Quedan
  igual de abiertas.
