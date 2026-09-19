# El cardio con pocos minutos

**Fecha:** 19/09/2026. **Tanda:** T4c del plan de variables. Sale de `59`: el cardio continuo no
estaba en el orden de recorte, y con 30 minutos declarados el 56 % de las sesiones de cardio no
entraba.

## La pregunta

La sesión "Continuo" del objetivo cardio son 40 minutos en zona 2. Si el socio declara 30 minutos,
¿se acorta el cardio, y hasta dónde?

## Lo que dice la evidencia

- **OMS 2020** (Bull et al., *Br J Sports Med*, texto completo en PMC7719906): los adultos deberían
  hacer **150-300 minutos semanales de actividad moderada, o 75-150 de vigorosa**, o una
  combinación equivalente. "Algo de actividad es mejor que nada". El piso es **semanal**. DOI
  10.1136/bjsports-2020-102955.
- **Jakicic et al. 2019**, revisión sistemática para el comité de las guías de EE.UU. 2018, *Med
  Sci Sports Exerc* (PMC6527142), 29 artículos: la actividad moderada a vigorosa **en tramos de
  cualquier duración** se asocia a mejor salud, incluida la mortalidad. Una cohorte de 4.840
  personas dio la misma asociación contando todo, contando solo tramos de 5 minutos o más y
  contando solo tramos de 10 o más. Por eso la guía dejó de pedir tramos mínimos de 10 minutos.
  DOI 10.1249/MSS.0000000000001933.
- **Moderado y vigoroso por pulso.** MacIntosh et al. 2021, *Front Physiol* (PMC8493117), reproduce
  la tabla de ACSM: **moderado es 64-76 % de la FC máxima; vigoroso, 77-93 %**. Las zonas del
  ruleset quedan así:
  - zona 1 (55-72 %): cruza lo suave y lo moderado; cuenta como **suave** (no suma);
  - zona 2 (67-82 %): cruza lo moderado y lo vigoroso; cuenta como **moderada**;
  - zonas 3, 4 y 5 (82 % en adelante): **vigorosas**. Un minuto vigoroso vale dos moderados, como
    en la OMS (150 moderados = 75 vigorosos).

  Cuando una zona cruza un límite, cuenta como la más baja: así el número nunca promete de más.
  DOI 10.3389/fphys.2021.682233.

### Qué quiere decir

No hay un piso por sesión que se pueda sostener con evidencia: 20 minutos de caminata suman, y 10
también. Lo que sí tiene respaldo es el total de la semana. El piso va ahí.

## Lo que decidió el dueño (19/09/2026)

- El cardio continuo **baja con los minutos**, con el piso que diera la investigación.
- Al medirlo apareció que **ningún plan de cardio llega a 150**, ni sin apuro de tiempo: la
  plantilla rota Continuo (40 minutos moderados), Intervalos (16 minutos vigorosos, que valen 32) y
  "Fuerza de sostén" (sin cardio). Da 72 minutos con dos o tres días por semana, 112 con cuatro y
  144 con cinco o seis. Un aviso que le sale a todos no informa nada, así que se decidió:
  - **el aviso sale solo cuando los minutos declarados acortaron el cardio** y la semana queda
    abajo de 150;
  - que la plantilla quede abajo de 150 es un hallazgo para **T6** (objetivos), donde se
    rediseña qué trae cada objetivo.

## Lo que hace el motor

- En el ajuste al tiempo (`59`) hay un paso nuevo, **después de bajar series y antes de los
  bloques**: el tramo continuo se acorta a lo que queda de la sesión, en minutos enteros, sin bajar
  de uno. Los intervalos no se tocan: son una receta (4 × 4 minutos), no un tiempo.
- El texto del ejercicio se rehace con los minutos nuevos ("Caminata en cinta: 30 minutos
  continuos en zona 2"). Solo si el ajuste cambió la duración, para no pisar otro texto.
- Si el cardio se acortó, cuenta la semana: cada sesión tantas veces como sale en la semana (lo
  mismo que el aviso de volumen), el trabajo por su zona, sin contar la pausa de los intervalos. Si
  no llega a 150, avisa: "Con el cardio acortado para que entre en tus 30 minutos, la semana suma
  unos 62 minutos de cardio (los intensos cuentan doble). Para la salud se recomiendan 150 por
  semana, y cualquier tramo suma: caminar o pedalear fuera del gimnasio también cuenta."

## El dato

Sin esquema nuevo. En el ruleset:

- cada zona de `cardio.zones` gana `whoIntensity` (`light`, `moderate`, `vigorous`);
- `cardio.weeklyMinimum`: `moderateMinutes` 150, `vigorousWeight` 2, el texto y la confianza
  (alta: es la guía de la OMS);
- `sessionTime.changes.cardio`: "un cardio continuo más corto".

## Cómo se prueba

- **Unitario** (`tiempo.test.ts`):
  - el continuo se acorta a lo que queda, después de sacar los aislados;
  - va después de las series y deja los bloques enteros;
  - no baja de un minuto;
  - los intervalos no se tocan.
- **Matriz**:
  - perfil "treinta minutos · cardio": el Continuo baja de 40 a 30, y el aviso dice 62 minutos;
  - una variante del ruleset con el continuo en zona 1 comprueba que la zona suave no suma: el
    aviso cuenta solo los intervalos.
- **Barrido**:
  - el texto de todo tramo continuo dice sus minutos;
  - el aviso de la OMS sale exactamente cuando el plan acortó el cardio y la semana, contada de
    nuevo en el test, no llega;
  - el test exige que haya casos con y sin aviso.
- **Falsificado**: 8 de 8 en rojo (sin el paso, el paso antes de las series, el cardio a cero,
  acortar los intervalos, el texto viejo, el aviso sin acortar, lo vigoroso sin su peso, lo suave
  sumando).

Con 30 minutos, las sesiones de cardio que no entran bajan del 56 % al 19 %. Las que quedan son
todas de intervalos (28 minutos) con el bloque de equilibrio de los mayores de 65.

## Lo que queda

- **La plantilla de cardio no llega a los 150 minutos de la OMS** con ninguna frecuencia. Para T6.
- **Los intervalos con poco tiempo.** Un 4 × 4 con 15 minutos no entra y solo sale el aviso.
  Sacarle vueltas (3 × 4, 2 × 4) cambia la receta estudiada; si se hace, que salga de la
  investigación de intervalos.
