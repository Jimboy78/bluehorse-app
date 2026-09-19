# La pausa del principiante, y el descanso que no se pregunta

**Fecha:** 19/09/2026. **Tanda:** T4b del plan de variables. En el checklist, "descanso" es
*pedir*; el dueño aclaró que es el descanso entre series (los días de descanso salen de los días
por semana).

## La pregunta

¿Hay que preguntarle al socio cuánto quiere descansar entre series? Para contestarla había que
mirar primero cuánto le hace descansar hoy el plan, y ahí apareció otra cosa: **el principiante
descansaba más que el intermedio**.

| Objetivo | Slot | Principiante | Por defecto (intermedio) |
|---|---|---|---|
| Fuerza | principal | 210 s | 180 s |
| Fuerza | secundario | 150 s | 120 s |
| Fuerza | aislado | 105 s | 90 s |
| Hipertrofia y recomposición | principal | 150 s | 120 s |
| Hipertrofia y recomposición | secundario | 105 s | 90 s |
| Hipertrofia y recomposición | aislado | 75 s | 60 s |

El origen es `04-individualizacion-seguridad.md`: "Principiante: `restSec`×1.2 (≈2–3 min)", con la
cita "basado en ACSM 2009 y consenso", confianza alta.

## Lo que dice la evidencia

- **ACSM 2009**, *Progression models in resistance training for healthy adults*, *Med Sci Sports
  Exerc* (resumen de Europe PMC): al principiante le pide cargas de 8-12 RM y no le fija pausa.
  Las pausas que da son 3-5 minutos para las cargas pesadas (1-6 RM) del intermedio y el avanzado,
  1-2 minutos para hipertrofia, 3-5 para potencia y menos de 90 s para resistencia. **No dice en
  ningún lado que el principiante descanse más.** DOI 10.1249/MSS.0b013e3181915670.
- **Grgic et al. 2017**, revisión sistemática de 23 estudios y 491 participantes, *Sports Med*:
  "en personas no entrenadas, pausas cortas a moderadas (**60-120 s**) parecen alcanzar para
  maximizar la fuerza"; en entrenadas hacen falta más de 2 minutos. DOI 10.1007/s40279-017-0788-x.
- **Schoenfeld et al. 2016**, *J Strength Cond Res*, 21 hombres **entrenados**, 8 semanas: 3
  minutos dieron más fuerza y más músculo en el muslo que 1 minuto. Es la razón de que el avanzado
  descanse más, no el principiante. DOI 10.1519/JSC.0000000000001272.
- **Singer et al. 2024**, metaanálisis bayesiano de hipertrofia (9 estudios): un beneficio chico
  pasando de 60 s, y **ninguna diferencia apreciable pasando de 90 s**. DOI
  10.3389/fspor.2024.1429789.
- **Villanueva et al. 2015**, *Eur J Appl Physiol*, 22 hombres de 65-70 años: 60 s de pausa dieron
  más mejoras que 4 minutos en composición corporal, fuerza y función. Es un solo ensayo chico; no
  cambia nada del plan, pero va en la misma dirección: la pausa larga no es la opción prudente
  para quien no entrena. DOI 10.1007/s00421-014-3014-7.

### Qué quiere decir

El ×1,2 no tiene fuente: la cita a ACSM no dice eso, y lo que sí se midió dice lo contrario. Un
principiante con 210 s de pausa pasaba casi 4 minutos parado entre series de un ejercicio que, por
su dosis (3 × 5-8 a RIR 3), no los necesita. Medido en la matriz, la sesión de fuerza de un
principiante duraba 41 minutos; 14 de esos minutos eran pausa de más.

## Lo que decidió el dueño (19/09/2026)

- **Corregir** la pausa del principiante:
  - en fuerza, **120 s** en el principal y **90 s** en el secundario y el aislado (el techo de
    Grgic para no entrenados);
  - en hipertrofia y recomposición, **90 s en todos** (el techo de Singer).
  - Novato, intermedio y avanzado no cambian.
- **No preguntar** por el descanso. El motor ya lo baja cuando los minutos no alcanzan (`59`), y
  un "más largo" no tiene respaldo por encima de lo que el plan ya prescribe. La variable
  "descanso" del checklist queda resuelta por los minutos.

Un detalle a la vista: el aislado de hipertrofia del principiante pasa de 75 a 90 s, o sea que
**sube**. Es lo que dice "90 s en todos", y queda dentro de lo que Singer todavía ve rendir; el
del intermedio sigue en 60.

## Lo que cambia en los planes

Medido en la matriz (primeras dos sesiones):

- fuerza principiante: de 41 a 27 minutos;
- hipertrofia principiante: de 31 a 24;
- adolescente de fuerza principiante: de 33 a 22;
- mujer de 70 que no baja al piso ni sube los brazos: de 52-58 a 40-44.

Dos perfiles suben de 36 a 39: "ochenta años" y "mayor de 60 con rodilla", los dos con 40
minutos declarados. Antes la pausa de 210 s no entraba y el ajuste al tiempo la bajaba a 90 s;
ahora la de 120 entra sin ajuste. Es lo que corresponde: el piso del ajuste es para cuando falta
tiempo, no la dosis.

## Cómo se prueba

- `ruleset.test.ts`, "la pausa del principiante":
  - en los multiarticulares, nunca más larga que la del nivel por defecto, en ningún objetivo;
  - en fuerza, hasta 120 s;
  - en hipertrofia y recomposición, hasta 90 s.
- Falsificado: con los valores viejos, los tres tests dan rojo.
- `04` lleva la corrección arriba del párrafo que citaba el ×1,2.
