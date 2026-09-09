# Dolor y lesiones: qué se saca, qué se sigue haciendo, y con qué umbral

Auditoría del 9 de septiembre de 2026, segunda iteración de la revisión del motor.

Es la entrada con más consecuencia de seguridad del motor, y la que peor sostenida estaba: las seis
`safety.painRules` del ruleset llevan **`confidence: "low"` las seis**, y el umbral que decide si un
ejercicio se saca (`severityAtLeast: 3`) no tenía ninguna fuente detrás.

## Primero, lo que no es un problema de evidencia sino de plomería

Antes de discutir umbrales: **hay contenido de seguridad escrito, versionado, validado por zod y que
no se le muestra a nadie.** Medido con `grep` sobre `apps/web/src` y `packages/engine/src`:

| Bloque del ruleset | Qué contiene | Quién lo consume |
|---|---|---|
| `safety.painRules[].keepDoing` | qué sí puede seguir haciendo | motor, como advertencia ✅ |
| `safety.painRules[].referIf` | **cuándo ir al médico** | **nadie** |
| `safety.redFlags` | 6 señales de alarma: dolor de pecho, síncope, disnea, palpitaciones | **nadie** |
| `safety.specialPopulations` | embarazo, hipertensión no controlada, diabetes con complicaciones, mayor con caídas — todas con `requiresClearance: true` | **nadie** |
| `safety.screening` | PAR-Q de 7 preguntas | la web ✅ |
| `safety.disclaimer` | descargo | la web ✅ |

`referIf` es la frase que le dice al socio que lo que tiene puede no ser una molestia de gimnasio:
"el dolor baja por el brazo con hormigueo", "la rodilla se traba o se hincha", "aparece fiebre".
Está escrita para las seis regiones y **no se emite nunca**. Un ruleset que aparenta cobertura que
la app no entrega es peor que uno incompleto, porque nadie va a buscar lo que cree que ya está.

Esto no requiere investigación: requiere conectarlo.

## La pregunta de fondo: ¿el dolor es motivo para no mover la zona?

### Ejercicio con dolor contra ejercicio sin dolor — CONFIANZA BAJA, pero consistente

Metaanálisis de **7 ECAs, 385 participantes**, en dolor musculoesquelético crónico, comparando
protocolos que **permiten** dolor durante el ejercicio contra protocolos que lo evitan:

| Plazo | SMD (IC 95 %) | Calidad |
|---|---|---|
| Corto | **−0,28 (−0,49 a −0,08)** a favor del ejercicio con dolor | baja |
| Medio | −0,59 (−1,03 a −0,15) a favor del ejercicio con dolor | baja |
| Largo | 0,01 (−0,39 a 0,41) — **sin diferencia** | muy baja |

Conclusión de los autores, que es la que importa acá: *el dolor durante el ejercicio terapéutico no
tiene por qué ser una barrera para un buen resultado.*

Léase con cuidado, porque es fácil sobreinterpretarlo: **no dice que haya que buscar el dolor.** A
largo plazo las dos estrategias empatan. Lo que dice es que evitar todo movimiento que moleste no
compra nada, y a corto plazo cuesta un poco.

> Smith BE et al. *Should exercises be painful in the management of chronic musculoskeletal pain? A
> systematic review and meta-analysis.* Br J Sports Med. 2017;51(23):1679-1687.
> DOI 10.1136/bjsports-2016-097383
>
> Existe una actualización de 2025 en JOSPT (DOI 10.2519/jospt.2025.13253) que no pudo verificarse
> contra la fuente primaria: el texto está detrás de pago. **No se usó para ningún número de acá.**

### El umbral concreto: 5 sobre 10 — CONFIANZA BAJA (consenso clínico, no metaanálisis)

Los protocolos incluidos en ese metaanálisis usan, en su mayoría, el *modelo de monitoreo de dolor*
desarrollado y probado en un ECA de tendinopatía aquílea:

- El dolor **puede llegar a 5/10** durante la actividad.
- Después de terminar, **puede llegar a 5/10**.
- A la mañana siguiente **no debe superar 5/10**.
- **El dolor y la rigidez no deben aumentar de semana en semana.**

En el ECA original no se encontró ningún efecto negativo por dejar a los pacientes seguir cargando
el tendón según este modelo.

Es el estándar clínico para cargar un tejido sintomático, pero conviene ser exacto sobre qué es:
**un modelo de decisión validado en una patología, no un metaanálisis de umbrales.** El 5 no es un
número medido; es el corte que se eligió y que resultó no hacer daño.

> Silbernagel KG, Thomeé R, Eriksson BI, Karlsson J. *Continued Sports Activity, Using a
> Pain-Monitoring Model, During Rehabilitation in Patients With Achilles Tendinopathy.* Am J Sports
> Med. 2007. DOI 10.1177/0363546506298279

### La regla lumbar del ruleset está al revés — CONFIANZA BAJA a MEDIA

La regla más agresiva del ruleset saca, con dolor lumbar de 3 sobre 5, **todo el patrón `hinge` y
todo ejercicio cuyo músculo primario sea `lower_back`**. Dos metaanálisis apuntan en la dirección
contraria:

**Extensión lumbar aislada, cargada, en dolor lumbar inespecífico** — 8 ECAs, 381 participantes:

| Desenlace | Hedges' g (IC 95 %) | |
|---|---|---|
| Dolor | **−0,633 (−1,06 a −0,20)** | p = 0,004 |
| Discapacidad | −0,292 (−0,73 a 0,14) | no significativo |
| Fuerza isométrica | 0,967 (−0,35 a 2,28) | no significativo |

Certeza **muy baja**: alto riesgo de sesgo en casi todos los estudios, muestras chicas, direcciones
de efecto inconsistentes. > DOI 10.1038/s41598-025-90699-5

**Resistencia con carga externa contra ejercicio sin carga** — 13 ECAs, 778 participantes,
PROSPERO CRD42022366975:

- Más allá de 7 semanas: **MD −0,52 en escala 0-10 (IC −0,92 a −0,08)** a favor de cargar.
- A corto plazo: sin diferencias.
- Conclusión de los autores: cargar es **seguro y factible**, con efectos *comparables* a no cargar,
  y las mejoras parecen depender más de **la exposición, la adherencia y el contexto** que de la
  intensidad de la carga.

Esa última frase es la más útil de toda esta investigación y también la más incómoda para el
diseño: lo que hace la diferencia es que la persona **siga viniendo y siga moviéndose**, no cuánto
carga. Un motor que saca ejercicios de más ataca justamente la exposición.

**Consecuencia:** sacar el `hinge` y el trabajo de `lower_back` ante un dolor lumbar moderado
elimina precisamente lo que estos trabajos usan como tratamiento. La regla se mantiene solo para
dolor alto, y para el rango moderado se reemplaza por monitoreo.

## Veredicto sobre lo que había

| Elemento | Veredicto | Por qué |
|---|---|---|
| Bloquear ante dolor alto | **se mantiene** | Ninguna fuente respalda cargar fuerte una zona muy sintomática, y el modelo de monitoreo marca el 5/10 como techo. |
| `severityAtLeast: 3` como único umbral | **se cae** | Un solo escalón convierte "me molesta" y "no puedo" en la misma decisión. La evidencia pide dos tramos: monitorear y evitar. |
| Escala 1-5 sin anclas | **se cae** | El socio elige un número sin saber qué significa, y ese número decide si se saca un ejercicio. Hay que anclarla al NPRS 0-10, que es lo que usan las fuentes. |
| Sacar `hinge` con lumbalgia moderada | **se cae** | Tres metaanálisis coinciden en que cargar la zona es seguro y al menos igual de bueno que no cargarla. |
| `keepDoing` | **se mantiene** | Es exactamente la recomendación de "seguir moviéndose", y ya se emite. |
| `referIf` sin emitir | **se cae** | Ver arriba: escrito y muerto. |

## Lo que esta investigación NO cubre

- **Lesión aguda (menos de 72 h) o traumática.** Todas las fuentes de acá son dolor *crónico*. Un
  esguince de ayer no está cubierto por nada de esto y el ruleset tampoco lo distingue: `type:
  'injury'` y `type: 'pain'` se tratan igual. Es la brecha más grande que queda abierta.
- **Cuánto reducir la carga** en el tramo de monitoreo. No hay número medido, así que el motor **no
  inventa un multiplicador**: emite el criterio de monitoreo (≤5/10, que vuelva a la basal al día
  siguiente, que no escale semana a semana) y deja la decisión de la carga donde ya estaba.
- **Las regiones que no son lumbar.** Rodilla, hombro, muñeca y cuello siguen con reglas de
  consenso, ahora declaradas como tales. El razonamiento del dolor crónico se les aplica por
  analogía, no por evidencia propia, y por eso conservan `confidence: "low"`.
- **Enfermedades.** El PAR-Q existe y se usa, pero `specialPopulations` no tiene ninguna
  consecuencia en el motor. Queda para una iteración propia.
