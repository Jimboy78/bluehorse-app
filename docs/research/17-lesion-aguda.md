# Lesión aguda contra dolor crónico: la evidencia permisiva no cubre a los dos

Auditoría del 9 de septiembre de 2026, segunda vuelta, hueco 2 de 6.

La base distingue los dos casos desde siempre: `constraint_type` es
`'injury' | 'pain' | 'avoid_exercise' | 'avoid_equipment'`, y el onboarding le pregunta al socio
cuál es cuál. El motor los colapsaba en un `||`:

```ts
(c.type === 'pain' || c.type === 'injury') &&
```

## Lo que se midió antes de tocar nada

Plan generado con la misma zona (`lower_back`) y la misma severidad, cambiando solo el tipo:

| Severidad | ¿Planes idénticos? |
|---|---|
| 1 | sí |
| 2 | sí |
| 3 | sí |
| 4 | sí |
| 5 | sí |

**Byte por byte, en las cinco.** El dato existía, viajaba desde la base y no decidía nada.

Y el problema no es que falte una distinción. Es qué mensaje recibía el lesionado. Con una **lesión**
de severidad 3 en la zona lumbar, el motor emitía:

> "Por **la molestia** en la zona lumbar: …"
> "Que moleste no quiere decir que estés haciéndote mal. La referencia es 5 sobre 10: durante el
> ejercicio podés llegar hasta ahí, y al día siguiente tenés que estar como empezaste."

Ese segundo texto es `safety.painMonitoring`, y salió de Silbernagel — **tendinopatía crónica**,
tejido que ya cicatrizó. Dárselo a alguien que se lesionó hace tres días no es una imprecisión de
redacción: es una autorización explícita a cargar, apoyada en literatura que nunca miró ese caso.
Le llamaba "molestia" a una lesión, además, que baja la guardia justo donde hay que subirla.

## Lo que dice la evidencia

### Toda la base de "seguí cargando aunque duela" es de dolor crónico — CONFIANZA ALTA en su ámbito, NULA fuera de él

Las tres fuentes que sostienen los dos umbrales de `painRules` y el texto de `painMonitoring`
—auditadas en `09-dolor-y-lesiones.md`— comparten población: dolor musculoesquelético **persistente**.

- Ejercicio con dolor contra ejercicio sin dolor, 7 ECAs / 385 participantes: SMD −0,28
  (IC −0,49 a −0,08) a corto plazo. El título del propio protocolo lo acota a **dolor crónico**.
  DOI 10.1136/bjsports-2016-097383
- El mismo grupo, en un editorial posterior, encuadra el hallazgo como un cambio de paradigma para
  dolor **persistente**, no para tejido lesionado.
  Smith BE, Hendrick P, Bateman M, et al. *Musculoskeletal pain and exercise—challenging existing
  paradigms and introducing new.* Br J Sports Med. 2018;52(6):907-912.
  DOI 10.1136/bjsports-2017-098983 — **verificado en Crossref**

Ninguna de esas fuentes estudió una lesión reciente. La extrapolación la hizo el motor, no los
autores.

### Del lado de la lesión aguda, hay consenso pero no números — CONFIANZA BAJA

El marco de referencia actual para tejido blando es PEACE & LOVE, que **reemplaza la "L" de carga
óptima temprana al reposo**:

> Dubois B, Esculier JF. *Soft-tissue injuries simply need PEACE and LOVE.* Br J Sports Med.
> 2020;54(2):72-73. DOI 10.1136/bjsports-2019-101253 — **verificado en Crossref**

Y la revisión paraguas de esguince de tobillo (24 revisiones sistemáticas, calidad AMSTAR media
7,7/11) respalda el tratamiento funcional por encima de la inmovilización:

> Gaddi D, Mosca A, Piatti M, et al. *Acute Ankle Sprain Management: An Umbrella Review of
> Systematic Reviews.* Front Med. 2022;9:868474. DOI 10.3389/fmed.2022.868474 —
> **verificado en Crossref**

Lo que estas fuentes sostienen es una **dirección** —moverse gana al reposo absoluto— no un
calendario. No hay ECAs cabeza a cabeza entre los acrónimos, y las ventanas por fase (0-72 h,
72 h-2 semanas, 2-6 semanas) que circulan en la literatura de rehabilitación varían con el tejido y
el grado. **No dan un corte en días que se pueda codificar.**

## Qué se cambió

**La distinción va por tipo, no por una ventana de días.** No hay evidencia verificada que dé un
corte limpio en días, y poner uno sería inventar un número de entrenamiento en el ruleset — regla
dura 3. La distinción que sí existe es la que el socio ya declara al cargar la restricción.

1. **Una lesión no accede al tramo permisivo.** Los dos umbrales siguen siendo los mismos, pero para
   `injury` el piso para *sacar* ejercicios es `monitorFrom`, el mismo en el que un dolor crónico
   apenas se monitorea. Medido: con lumbar en severidad 3, el dolor crónico conserva el `hinge`
   —sacarlo atacaría la exposición, que es lo que las fuentes señalan como determinante— y la lesión
   no lo conserva, porque detrás no hay ninguna evidencia que lo sostenga.
2. **`safety.acuteInjury.note` reemplaza a `painMonitoring`** cuando hay una lesión declarada. Nunca
   se emiten las dos: se contradicen. Dice por qué el plan se puso prudente, dice explícitamente que
   la evidencia del "seguí cargando" es de dolor de meses, y lista las señales de derivación.
   `confidence: "low"`, y se muestra como tal.
3. **A una lesión se le dice lesión.** El aviso por zona ya no la llama "molestia".

Nada de esto se activa por debajo de `monitorFrom`: una lesión leve que no dispara ni el aviso
tampoco puede vaciar el plan. Hay un test que lo fija.

`generatePlan` pasó el techo de complejidad cognitiva con el cambio; los avisos de seguridad se
extrajeron a `safetyWarnings()`.

5 tests nuevos, 332 en verde. Cuatro de los cinco fallan si se revierte el motor a mano; el quinto
es el de no-desborde y falla si el piso conservador se baja a 1.

## Lo que esta investigación NO cubre

- **Cuándo una lesión deja de ser aguda.** Es la pregunta que se quiso responder y no tiene
  respuesta codificable. El corte convencional de dolor crónico son 3 meses, y las fases de
  rehabilitación temprana se describen en semanas, pero varían con el tejido y el grado. Hoy una
  lesión declarada hace un año se sigue tratando como aguda hasta que el socio la dé de baja o la
  reclasifique.
- **`active_from` sigue sin llegar al motor.** La columna existe en `user_constraints`, se lee en
  `apps/web/src/lib/profile.ts` y se le muestra al socio como "desde cuándo" — pero
  `UserConstraint`, que es el tipo que ve el motor, no la tiene. **No se agregó a propósito**: sin
  un umbral con respaldo que la consuma, sería otro campo escrito y muerto, que es exactamente el
  patrón que esta auditoría viene denunciando. Cuando aparezca el corte, el dato ya está.
- **Qué lesiones no admiten carga en absoluto.** Fractura, luxación, rotura tendinosa completa,
  herida abierta y compromiso neurovascular exigen derivación, no ajuste de plan. Hoy eso vive como
  texto dentro de `acuteInjury.note`; no hay ninguna regla estructural que frene el plan entero.
  `redFlags` sigue en la lista de deuda de `ruleset-consumo.test.ts`.
- **Si el socio clasifica bien.** Distinguir "me lo torcí" de "me viene molestando" parece simple,
  pero no encontré validación de autoclasificación por legos. Se asume que la respuesta es honesta y
  no se verifica contra nada.

## Nota sobre las fuentes de esta iteración

El informe de investigación que alimentó este documento traía la cita de PEACE & LOVE con autoría
("Blanchard EG, Dorey A, Hasan AR") y DOI (`10.1136/bjsports-2019-101764`) **inventados** — ese DOI
no resuelve. La revisión paraguas venía atribuida a "Grisolia et al." en lugar de Gaddi. Los datos
que quedaron acá son los que se verificaron uno por uno contra Crossref; lo que no se pudo
verificar, no entró.
