# Fragilidad: qué cambia en el plan y cómo se detecta sin preguntar

**Fecha:** 18/09/2026. **Tanda:** T1b del plan de variables. En el checklist el dueño marcó
"fragilidad" como **motor**: se deduce, no se le pregunta al socio.

## Qué cambia en el plan: casi nada, y eso es un resultado

- **ICFSR 2021** (Izquierdo et al., consenso de 36 expertos; DOI 10.1007/s12603-021-1665-8):
  - Fuerza para mayores: 2–3 días por semana, 1–3 series de 8–12 repeticiones, arrancando en
    30–40 % del 1RM y subiendo a 70–80 %, con 1–3 minutos de pausa.
  - Equilibrio: 1–7 días por semana, **1–2 series de 4 a 10 ejercicios distintos**. Progresa
    achicando la base de apoyo, moviendo el piso y quitando información de la vista o del tacto.
  - Para la fragilidad y la sarcopenia **no hay receta aparte**: mismos parámetros, y "no hace falta
    esperar meses antes de meter intensidad alta". El orden en fragilidad severa es levantarse
    (fuerza y potencia), mantenerse de pie (equilibrio) y caminar (resistencia).
- **Mehta et al. 2026**, 14 ensayos, 2.719 personas frágiles de 73 a 86 años. El ejercicio mejora
  la velocidad de marcha, el TUG y pararse de la silla 5 veces, con certeza baja a muy baja. Sobre
  caídas hay dos estudios, no alcanza. DOI 10.1016/j.tjfa.2026.100187
- **Guía mundial de caídas 2022**: a la persona de riesgo alto no le alcanza el ejercicio. Le
  corresponde una evaluación multifactorial (medicación, vista, casa, presión) hecha por un
  profesional. DOI 10.1093/ageing/afac205

Traducido al motor: a una persona frágil **no le cambia la receta**, que ya es fuerza más
equilibrio (`39`). Le cambian dos cosas: que alguien la evalúe y que el equilibrio no falte.

### Corrección a T1a

El ICFSR pide **4 a 10 ejercicios** de equilibrio por sesión, y T1a puso 3. Otago no fija un
número. El bloque pasa a 4, el piso del consenso.

## Cómo se detecta sin preguntar

La fragilidad no se deduce de la edad: la edad es un factor de riesgo, no un diagnóstico. Lo que sí
se puede hacer es **medirla donde el socio ya está**, que es lo que pidió el dueño ("con la misma
sesión podrías ir sacando información").

- **Prueba de pararse de la silla en 30 segundos** (Jones, Rikli y Beam 1999; 76 personas, edad
  media 70,5). Repetibilidad CCI 0,84 en hombres y 0,92 en mujeres; correlación con la prensa de
  piernas máxima r = 0,78 y 0,71; distingue grupos por edad y por actividad.
  DOI 10.1080/02701367.1999.10608028
- **Rikli y Jones 2013**: puntos de corte por edad y sexo, de 60 a 94 años, asociados a mantenerse
  independiente; validez y confiabilidad de 0,79 a 0,97. DOI 10.1093/geront/gns071
- **CDC STEADI 2017**: la usa para detectar riesgo de caídas. Brazos cruzados sobre el pecho, silla
  sin apoyabrazos de unos 43 cm. Si necesita las manos para pararse, la prueba se corta y cuenta 0.
  Por debajo de estos valores, **riesgo de caídas**:

| Edad | Hombres | Mujeres |
|---|---|---|
| 60–64 | < 14 | < 12 |
| 65–69 | < 12 | < 11 |
| 70–74 | < 12 | < 10 |
| 75–79 | < 11 | < 10 |
| 80–84 | < 10 | < 9 |
| 85–89 | < 8 | < 8 |
| 90–94 | < 7 | < 4 |

"Pararse y sentarse" ya está en el bloque de equilibrio (`39`). Si una vez por ciclo esa serie se
hace como la prueba (30 segundos, contar), la app sabe sin ninguna pregunta si el socio está por
debajo del corte de su edad y su sexo.

## Lo que haría el motor con el dato

1. **Por debajo del corte**: un aviso del módulo `molestia` (el de "cuándo consultar", primero en
   la lista). Le dice que conviene una evaluación de caídas con su médico. La guía mundial lo
   indica para el riesgo alto.
2. **Por debajo del corte**: que el equilibrio no se saque por falta de tiempo cuando entren los
   minutos (T4).
3. **Con "0"** (necesitó las manos): lo mismo, más ejercicios del bloque con apoyo. Queda para cuando
   haya progresión de equilibrio.
4. La prueba se repite cada tanto. Si sube, el aviso se va.

## Qué hace falta para hacerlo

- **Sesión**: un modo "prueba" para esa serie, con un cronómetro de 30 s y un contador. Es T7
  (señales de la sesión), porque es la primera medición que la sesión le toma al socio.
- **Sexo**: el perfil ya lo guarda (`sex`). Con "prefiero no decirlo" se usa el corte más alto de
  los dos. En una prueba de riesgo de caídas es peor que se escape un caso que avisar de más.
- **Base**: una tabla de mediciones (`gym_id`, `user_id`, tipo, valor, fecha). Sirve también para el
  peso del cierre de sesión (T7).

**Decisión del dueño:** hacerlo así, o dejar la fragilidad afuera. Deducirla por edad sola sería
inventar.
