# Después de la menopausia: impacto para el hueso

**Fecha:** 18/09/2026. **Tanda:** T1d del plan de variables. En el checklist, "menopausia" es
**motor**, con la nota del dueño "deducir por edad". Se deduce del sexo y la edad; no se pregunta.

## Lo que hacía el motor

Nada distinto por sexo. El perfil guarda `sex` y el motor no lo leía en ninguna parte.

## Lo que dice la evidencia

### Fuerza con impacto mejora el hueso después de la menopausia — CONFIANZA MEDIA

- **Kistler-Fischbacher, Weeks y Beck 2021**, metaanálisis de 53 ensayos (63 intervenciones) en
  mujeres posmenopáusicas sanas:
  - Columna lumbar: la intensidad alta mejora más (MD 0,031 g/cm²) que la moderada (0,012) y la
    baja (0,010).
  - Cuello de fémur: la baja y la moderada mejoran igual (0,011).
  - Cadera total: mejora con la moderada (0,008).
  - La fuerza, sola o con impacto, es el estímulo más efectivo para columna y cadera.
  - DOI 10.1016/j.bone.2020.115697
  - Son efectos chicos, del orden del 1 al 3 %. Pero la pérdida de hueso después de la menopausia
    va en la dirección contraria, así que frenarla ya es el resultado.
- **LIFTMOR (Watson et al. 2018)**: 101 mujeres de 65 ± 5 años con osteopenia u osteoporosis. Dos
  veces por semana, 30 minutos supervisados, 5 × 5 por encima del 85 % del 1RM, más impacto:
  - columna +2,9 % contra −1,2 % del control;
  - mejoraron todas las pruebas funcionales;
  - hubo un solo evento adverso menor (un espasmo lumbar).
  - DOI 10.1002/jbmr.3284
- **Consenso británico de osteoporosis 2022** (Brooke-Wavell et al.):
  - Fuerza 2 o 3 días por semana, hasta 3 series del máximo que se levanta 8 a 12 veces.
  - Impacto moderado **la mayoría de los días**, unos **50 impactos por sesión** (por ejemplo 5 de
    10), con algo más suave en el medio. Ejemplos: pisar fuerte, trotar, saltos bajos, saltitos.
  - Con fracturas vertebrales, el impacto no pasa de una caminata rápida. Eso es T2 (salud).
  - DOI 10.1136/bjsports-2021-104634

### Desde qué edad

- **Schoenaker et al. 2014**, 36 estudios de 24 países: la edad media de la menopausia natural es
  **48,8 años** (IC 48,3–49,2). En Latinoamérica llega unos 3,3 años antes que en Europa.
  DOI 10.1093/ije/dyu094
- Se toma **50**. A esa edad la mayoría ya pasó la menopausia. Y la fuerza con impacto también le
  hace bien al hueso antes, así que errar la edad por un par de años no hace daño.

## Lo que se decidió

| Qué | Valor | De dónde |
|---|---|---|
| A quién | mujeres (`sex: female`) desde los 50 | Schoenaker 2014. Con sexo sin declarar no se deduce nada |
| Qué | un bloque de impacto al final de cada sesión, antes del equilibrio | Consenso británico 2022 |
| Dosis | 1 ejercicio, 5 × 10 | Los 50 impactos del consenso |
| Pausa | 30 s, caminando | Criterio de práctica: el consenso pide "algo más suave en el medio" |
| Ejercicios | pisadas fuertes, saltitos en el lugar | Ejemplos del consenso. Patrón nuevo `impact` |
| Con molestia o lesión | sin impacto | Mismo criterio que los saltos del par (`37`) |
| Los días que no viene | en el texto del ejercicio: 50 pisadas en casa | El consenso pide la mayoría de los días |

**Lo que no se toca:** la fuerza sigue siendo la del objetivo elegido. Subir a todas las mujeres de
50 a 5 × 5 pesado (LIFTMOR) sería elegir el objetivo por ellas. El bloque de impacto es lo que falta
en cualquier objetivo, y es chico: unos 4 minutos.

**Pendiente de T2 (salud con puerta):** con osteoporosis declarada, evitar flexionar la columna con
carga; con fractura vertebral, nada de impacto más allá de caminar; con problemas de suelo pélvico,
revisar el impacto.

## Cómo se prueba

- El barrido suma la dimensión **sexo** (mujer, hombre, sin declarar).
- Invariante: el impacto aparece en toda sesión de una mujer de 50 o más sin molestias, y en nadie
  más.
- Matriz: una mujer de 55 con hipertrofia, y la misma con una molestia lumbar leve.
- El impacto no suma al volumen semanal ni recibe propuestas de progresión, igual que el equilibrio.
