# La racha cortaba por descansar, que es justo lo que el plan pide

Revisión del 18 de septiembre de 2026. Sale de un pedido de un socio: poder decir "hoy descanso", y
que si un día sin entrenar entre dos sesiones no se anotó, la app lo tome como el descanso que
fue, no como una falta. Para cualquier rutina, no solo la suya.

## Lo que había

`computeAdherence` (`apps/web/src/lib/mappers/progress.ts`) contaba **días calendario seguidos con
al menos una sesión**. Tres consecuencias, medidas contra la función:

- Quien entrena lunes, miércoles y viernes —tres por semana, lo que el plan le pide— nunca pasaba
  de una racha de 1.
- Un plan de lunes a viernes perdía la racha cada sábado.
- La racha no miraba si llegaba hasta hoy: diez días sin venir seguían mostrando la racha vieja.

## Lo que dice la evidencia

Lally, van Jaarsveld, Potts y Wardle (2010; en línea en 2009), *How are habits formed: Modelling habit formation in
the real world*, European Journal of Social Psychology 40(6):998–1009,
doi:10.1002/ejsp.674. 96 personas repitieron una conducta a diario durante 12 semanas. Del
resumen, verificado en los metadatos de Crossref:

> "Missing one opportunity to perform the behaviour did not materially affect the habit formation
> process."

Y en el mismo resumen: "Performing the behaviour more consistently was associated with better
model fit". Una falta suelta no es un corte; faltar seguido sí pesa.

Del lado del entrenamiento, `14-historial-y-desentrenamiento.md` ya sostiene que menos de diez días sin
entrenar no piden ajustar nada (multiplicador 1 en el ruleset): un día libre no le cuesta nada al
plan, y la racha no tiene por qué decir lo contrario.

## La regla

La racha cuenta **días entrenados** en una seguidilla que no se cortó. Un día sin sesión no la
corta si:

1. **El socio lo marcó como descanso** (`rest_days`, botón "Hoy descanso" en Hoy). Nunca corta,
   aunque exceda lo previsto: si dice que descansó, descansó.
2. **Entra en el cupo de su propia frecuencia.** Quien declaró N sesiones por semana tiene 7 − N
   días libres en **cualquier** ventana de siete. El número no lo pone la app: lo puso el socio en
   su objetivo.

Los descansos marcados gastan el mismo cupo que los inferidos: con cinco por semana y dos
descansos ya marcados, una tercera falta en esa semana corta. Se miran todas las ventanas que
contienen la falta, no solo la que arranca en ella — la primera versión miraba una sola y dejaba
pasar justo ese caso; el test `el descanso marcado gasta el cupo` lo fija.

Hoy sin sesión no corta: el día no terminó. Y el descanso no suma a la racha: la racha cuenta
entrenamientos, no días que pasaron.

Sin frecuencia declarada (sin objetivo activo), el cupo es cero y solo cuentan los descansos
marcados — el comportamiento viejo, más la corrección de "hoy".

## Lo que no hace

Marcar descanso **no mueve la cola del plan**. El plan no tiene fechas: hoy toca la primera sesión
pendiente, y la próxima vez sigue tocando la misma. Por eso la tarjeta de descanso la nombra.

## Qué revalidar

La regla de ventana es una lectura directa de la frecuencia declarada, no un número de la
literatura. Lally mide formación de hábito en conductas diarias simples, no adherencia a un plan de
fuerza de tres a cinco días; lo que se toma de ahí es solo que una falta aislada no deshace nada.
