# Movimientos que no puede

**Fecha:** 19/09/2026. **Tanda:** T3j del plan de variables. En el checklist es *pedir*:
"movimientos que no puede".

## La pregunta

Hay gente que no puede hacer un movimiento entero, sin que eso sea una molestia en una zona: no
llega a levantar los brazos por encima de la cabeza, no puede bajar al piso y volver a pararse, no
puede colgarse de una barra o no puede saltar. ¿Qué tiene que hacer el plan con eso?

Acá no hay números que investigar. No existe una dosis de "no poder colgarse". Lo que hay que
decidir es **qué ejercicio pide cada movimiento** y **qué pasa con el plan cuando se va un patrón
entero**. Las dos cosas se resuelven con el catálogo y con el mecanismo de sustitución que ya
existe para las molestias.

## Lo que dice la evidencia: es exclusión con sustitución, sin dosis

- **Tinetti, Liu y Claus 1993**, cohorte en *JAMA*, 1.103 personas de 72 años o más que vivían en
  la comunidad, seguidas 21 meses de media (resumen de PubMed, PMID 8416408):
  - de 313 personas que se cayeron sin lastimarse, **148 (47 %) no pudieron levantarse solas**
    después de al menos una caída;
  - lo que se asoció a no poder levantarse: tener 80 años o más (RR 1,6), depresión (RR 1,5) y
    **mal equilibrio y marcha (RR 2,0)**;
  - los que no pudieron levantarse tuvieron más a menudo un deterioro duradero en las actividades
    diarias (35 % contra 26 %);
  - DOI 10.1001/jama.1993.03500010075035, verificado en Crossref.
- **Guía mundial de prevención de caídas** (Montero-Odasso et al. 2022, *Age and Ageing*, texto
  completo):
  - una de cada ocho personas mayores que se caen queda más de una hora en el piso. Pasados los
    90 años, hasta el 80 % no puede levantarse después de una caída;
  - quedar más de una hora en el piso trae deshidratación, neumonía, lesiones de piel y pérdida
    de movilidad;
  - la guía dice textualmente: "levantarse del piso se reaprende mejor practicando cada uno de los
    movimientos que requiere, empezando por el último". Es el encadenamiento hacia atrás.
    Agrega que "puede ser útil" evaluar si la persona se levanta del piso;
  - DOI 10.1093/ageing/afac205 (ya citado en `39` y `40`).

### Qué quiere decir

- **Para los cuatro movimientos, lo que corresponde es sacar lo que los pide.** Hacer un ejercicio
  que la persona declaró que no puede hacer no es una prescripción.
- **Si se va un patrón entero, se sustituye igual que con una molestia**, con trabajo del catálogo
  que mueve los mismos músculos. La calidad de esa sustitución no la midió nadie: es criterio de
  práctica, y por eso el bloque va con `confidence: "low"`, igual que `painSubstitution`.
- **El piso es el único movimiento que además pide un aviso.** No poder levantarse del piso es
  frecuente en mayores y es grave cuando hay una caída. Además es una habilidad que se vuelve a
  aprender practicándola. El aviso no la prescribe (eso es trabajo supervisado): le dice al socio
  que la practique con un instructor.

## Lo que hace el motor

- **Cada ejercicio del catálogo dice qué movimientos pide** (`requiresMovements`). Quien declaró que
  no puede uno no recibe ningún ejercicio que lo pida. La exclusión vive en el módulo
  `restriccion` (`isBlocked`), así que vale también en "cambiar ejercicio" (`findSubstitutes`).
- **No es una molestia.** No activa reglas de dolor ni saca lo explosivo por sí solo, y tampoco
  saca el bloque de impacto. "No puedo saltar" saca los saltos. Los lanzamientos, el swing y las
  pisadas siguen entrando.
- **Patrón vacío, con sustituto**: "Como anotaste que no podés llevar los brazos arriba de la
  cabeza, en Sesión B cambiamos el trabajo de tirón vertical por otros ejercicios que mueven los
  mismos músculos". Sin brazos arriba se van el empuje vertical y el tirón vertical enteros.
- **Patrón vacío, sin sustituto**: el aviso igual nombra el movimiento. Pasa, por ejemplo, con un
  principiante sin brazos arriba. El único trabajo de hombro anterior que no va por encima de la
  cabeza es el press inclinado, que pide nivel novato o más. Antes decía "por lo que anotaste que
  no podés hacer", que no explica nada. Lo encontró la matriz.
- **Potencia**: si todo lo explosivo al alcance del nivel pide un movimiento declarado, el aviso
  de "este plan no trae saltos ni lanzamientos" da esa razón y no la genérica (molestia, edad). Si
  queda un explosivo que no lo pide, la razón es otra y el aviso no le echa la culpa al
  movimiento. Con una molestia, la razón es la molestia.
- **El aviso del piso** sale una vez, con el piso declarado.

## Cómo se marcó el catálogo

Lo decidió el dueño mirando las indicaciones de cada ejercicio (19/09/2026):

- **Brazos arriba de la cabeza**: press de hombro en máquina, press de hombro con mancuernas, press
  militar con barra, dorsalera al pecho, dorsalera con agarre neutro, dominadas, elevación de
  piernas colgado, extensión de tríceps con mancuerna (baja detrás de la cabeza), wall ball y
  slam ball.
- **Bajar al piso y levantarse**: plancha, dead bug, flexiones de brazos, rueda abdominal,
  movilidad de cadera y tobillo, crunch en polea (va de rodillas) y **hip thrust con barra**, que se
  arranca sentado en el piso con la espalda contra el banco. Desde `62`, también el **curl
  nórdico**, que va de rodillas.
- **Colgarse de una barra**: dominadas y elevación de piernas colgado. El remo invertido en TRX no,
  porque los pies van apoyados.
- **Saltar**: salto al cajón, salto con vallas, pogo jumps, salto en profundidad, zancada con
  salto, salto con barra hexagonal y saltitos en el lugar. Lo que tiene fase de vuelo.

### Por qué "saltar" se marca a mano y no se deduce de lo explosivo

La primera propuesta era deducirlo (`isExplosive` o patrón `impact`). Se descartó, con el acuerdo
del dueño, porque saca de más. Swing, slam ball, wall ball, pase de pecho y lanzamiento rotacional
son explosivos sin salto, y las pisadas fuertes son impacto sin salto. Con la deducción, quien no
puede saltar se quedaba sin nada de trabajo de potencia. Y a una mujer de más de 50 se le iba el
bloque de impacto para el hueso, que dice justo "pisando fuerte **o** saltando bajito": las
pisadas existen para quien no salta.

## El dato

- Enum `movement_limit`: `overhead`, `floor`, `hanging`, `jumping`.
- `exercises.requires_movements movement_limit[] not null default '{}'`.
- `user_constraints` suma el tipo `avoid_movement` y la columna `movement`, obligatoria para ese
  tipo y vacía para los demás (`check`). Un índice único sobre los vigentes impide anotar dos
  veces el mismo movimiento.
- El catálogo (`supabase/catalog/blue-horse.json`) gana `requiresMovements`, y
  `scripts/push-catalog.mjs` y el mapper lo cargan.

## La pantalla

- En /salud, después de la puerta de lesiones: "¿Hay algún movimiento que no puedas hacer?", sí o
  no, y con un sí, los cuatro chips (se puede marcar más de uno).
- En el perfil, cada movimiento se ve en "Molestias, movimientos y ejercicios descartados" y se da
  de baja como el resto. "Agregar un movimiento que no puedo hacer" ofrece solo los que faltan.
- Guardar no repite un movimiento ya anotado, aunque se vuelva a pasar por /salud (la renovación
  del aviso legal lo hace).

## Cómo se prueba

- **Unitario del motor:**
  - cada movimiento saca lo que lo pide y nada más, desde `restriccion`;
  - no es molestia: no toca los explosivos, los bloques ni los avisos de dolor;
  - el aviso del piso sale solo con el piso, una vez;
  - sin brazos arriba, los dos patrones verticales se van, se sustituyen, y el aviso dice por qué;
  - sin nada con qué sustituir, el aviso igual nombra el movimiento;
  - sin colgarse queda la dorsalera y no hay aviso;
  - "cambiar ejercicio" no ofrece lo que pide el movimiento;
  - potencia: aviso propio si todo lo explosivo pide saltar, ninguno si queda un lanzamiento,
    el genérico si la razón es la edad, y nada del movimiento si hay molestia.
- **Unitario de la web:** el mapper del catálogo y el de restricciones, `paraElMotor`, el dedup al
  guardar y el componente de chips.
- **Matriz:** perfil de una mujer de 70 años, fuerza principiante, que no baja al piso ni sube los
  brazos. Ningún ejercicio que pida un movimiento declarado entra. Principiante e intermedio,
  cada patrón vacío dice por qué, con o sin sustituto. Sumando "saltar", el impacto para el hueso
  sigue, con pisadas.
- **Barrido:** dimensión `movimientos` (once valores: ninguno pesa cuatro veces, más cada uno solo,
  dos pares y los cuatro). La invariante usa una lista **escrita a mano** de qué pide cada
  movimiento, y otro test compara esa lista contra lo que marca el catálogo, en las dos
  direcciones. Sensibilidad 75 %.
- **Falsificado** (las 15 guardas dieron rojo):
  - que `isBlocked` ignore el movimiento;
  - que los avisos de patrón vacío, con y sin sustituto, vuelvan al genérico;
  - que la razón de potencia se conforme con que *algún* explosivo pida el movimiento;
  - que ignore la molestia, o que no dé el aviso propio;
  - que el aviso del piso salga con cualquier movimiento;
  - que el catálogo marque de más;
  - que se pierda el campo en cualquiera de los tres mappers o en el dedup;
  - que los chips ofrezcan lo ya anotado, o que un sí sin marcar deje seguir;
  - que el movimiento cuente como molestia.

## Lo que queda

- **Un principiante sin brazos arriba no tiene trabajo de hombro anterior.** No hay en el catálogo
  un ejercicio de principiante para ese músculo que no vaya por encima de la cabeza (una elevación
  frontal, por ejemplo). Sumarlo es decisión del catálogo.
- **Practicar levantarse del piso** como bloque del plan, para mayores. La guía mundial lo respalda
  y el catálogo no lo tiene. Es trabajo supervisado y pide diseñar la progresión: queda como
  pregunta para el dueño.
