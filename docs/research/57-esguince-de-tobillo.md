# Esguince de tobillo

**Fecha:** 19/09/2026. **Tanda:** T3i del plan de variables. En el checklist es *pedir*:
"esguinces".

## La pregunta

¿Cambia algo en el gimnasio haberse esguinzado? La respuesta que importa no es qué evitar (eso ya lo
resuelven el dolor y la lesión reciente) sino qué **sumar**: un esguince de tobillo tiene una
recaída alta, y la recaída se puede prevenir con ejercicio.

## Lo que dice la evidencia — CONFIANZA MEDIA (alta para que sirve, baja para la dosis)

- **Vuurberg et al. 2018**, guía clínica del *British Journal of Sports Medicine* (actualización de
  la guía holandesa), texto completo:
  - ejercicio contra cuidado habitual, **10 ensayos, 1.284 personas: RR 0,62** (0,51 a 0,76) para la
    recaída; en deportistas, RR 0,38 (nivel 1);
  - el ejercicio de coordinación y equilibrio sirve para la recaída **hasta 12 meses después del
    esguince**, no para prevenir el primero (nivel 1);
  - recomienda empezar cuanto antes y meterlo en el entrenamiento habitual;
  - la tobillera o el vendaje también bajan la recaída (6 ensayos, 2.307 personas, RR 0,30);
  - DOI 10.1136/bjsports-2017-098106.
- **Hupperets et al. 2009**, ensayo en el *BMJ*, 522 deportistas de 12 a 70 años con un esguince de
  hasta dos meses antes, texto completo (PMC2714677):
  - 8 semanas de equilibrio en casa, **3 sesiones por semana**, hasta 30 minutos, con una tabla de
    equilibrio;
  - recaída 22 % contra 33 %: **RR 0,63** (0,45 a 0,88), **hay que tratar a 9 para evitar una**;
  - solo el 23 % cumplió el programa entero, así que el efecto real de hacerlo es probablemente
    mayor;
  - DOI 10.1136/bmj.b2684.
- **El programa de Hupperets (2BFit)**, protocolo publicado en BMC Musculoskeletal Disorders 2008
  (PMC2412867):
  - seis ejercicios: flexión de rodilla en un pie, puntas de pie, apoyo en un pie, "pose de
    corredor", balanceo con la pierna cruzada y caminata en puntas;
  - la progresión es la superficie y el apoyo: con apoyo, sin apoyo, ojos cerrados, sobre la tabla;
  - empieza cuando termina el tratamiento y ya se puede volver al deporte;
  - no publica series ni segundos por ejercicio;
  - DOI 10.1186/1471-2474-9-71.
- **Wagemans et al. 2022**, metaanálisis en *PLOS ONE*, 14 ensayos y 2.182 personas:
  - recaída **OR 0,60** (0,36 a 0,99) a los 12 meses;
  - **el volumen de entrenamiento no predijo el efecto** (metarregresión);
  - no alcanzan los datos para saber qué componente importa;
  - DOI 10.1371/journal.pone.0262023.
- **Guo et al. 2024**, metaanálisis sobre equilibrio en la inestabilidad crónica de tobillo, nueve
  ensayos: las sesiones van de **5 a 20 minutos, 2 a 5 veces por semana, 4 a 6 semanas**, y "no hay
  un programa estandarizado". DOI 10.1186/s13643-024-02455-x.

### Qué quiere decir

- **Que el equilibrio baja la recaída tiene respaldo firme**: una guía con nivel 1 y dos
  metaanálisis que coinciden en alrededor de un 40 % menos.
- **La dosis por ejercicio no la da nadie.** Lo que sí está acotado es la sesión (5 a 20 minutos) y
  la frecuencia (unas 3 veces por semana). Como el volumen no predijo el efecto, se elige la dosis
  más chica que entra en ese rango.

## Lo que hace el motor

- **Un esguince no es una molestia.** No saca ejercicios, ni saltos, ni el bloque de impacto. El
  programa de Hupperets arranca cuando ya se puede volver al deporte e incluye saltos. Si todavía
  duele, el socio lo anota además como dolor, y ahí actúa la regla de la zona.
- **Esguince de tobillo de hace menos de 12 meses** (`sprain.regions`, `sprain.months`): al final de
  cada sesión, un bloque de equilibrio **en un pie**:
  - 3 ejercicios, 2 × 10 por pierna, 60 s entre series; con las pausas, entre 5 y 10 minutos;
  - elige solo ejercicios de equilibrio unilaterales;
  - la progresión es la de 2BFit, escrita en cada ejercicio: con apoyo, sin apoyo, ojos cerrados,
    disco.
- **El aviso** dice por qué está el bloque, que si duele se anote como dolor, y que para el deporte
  una tobillera semirrígida también baja el riesgo (Vuurberg).
- **Con más de 60 años no se suman dos bloques.** Ya entra el de los mayores (4 ejercicios): sus
  primeros 3 salen de los unilaterales. Se cubren las dos cosas sin alargar la sesión.
- **Los meses se cuentan cumplidos**, contra `context.now`, con la misma función que la operación
  (`56`). Una fecha que no se lee no inventa un plazo.
- **Solo el tobillo.** Toda la evidencia es de tobillo. En la pantalla, "Un esguince" aparece solo en
  las zonas de `sprain.regions`: en otra se guardaría y el plan no cambiaría nada.

### Un agujero que abrió el catálogo nuevo

"Flexión de rodilla en un pie" es equilibrio, pero dobla la rodilla con el peso del cuerpo en una
pierna: carga como una zancada. Las reglas de dolor sacan por patrón, y como es `balance`, un dolor
de rodilla, cadera o tobillo que saca la zancada lo dejaba pasar. Ahora **un ejercicio de equilibrio
unilateral y compuesto cuenta también como zancada** para las reglas de dolor
(`patronesQueCarga`). La elevación de talón y el balanceo, que no doblan la rodilla con carga, no.

## El catálogo

Cuatro ejercicios nuevos, patrón `balance`, unilaterales, sin números (la dosis es del ruleset):

- flexión de rodilla en un pie (principiante);
- flexión de rodilla en un pie sobre disco (intermedio: es el último nivel de 2BFit, y usa los
  **discos de equilibrio**, que hasta ahora eran una estación que ningún plan usaba);
- elevación de talón en un pie;
- balanceo de pierna en un pie.

Los mayores también los reciben: Otago incluye el apoyo en un pie. Decisión del dueño, 19/09/2026.

## El dato

- `constraint_type` suma `sprain`.
- La columna `surgery_on` (de `56`) pasa a ser **`occurred_on`**: el mes en que pasó, obligatorio
  para la operación y el esguince, y vacío para los demás. Se renombró antes de que existiera
  ninguna fila en producción (`user_constraints` estaba vacía): dos columnas de fecha para lo mismo
  habrían sido una trampa.

## La pantalla

- La puerta de lesiones suma "Un esguince", solo en el tobillo. Pide el mes y nada más.
- La pregunta de la puerta: "¿Tenés ahora alguna lesión, dolor o tendinitis, o tuviste hace poco una
  operación o un esguince?".
- En el perfil, el esguince se ve con su mes.

## Cómo se prueba

- **Unitario del motor:**
  - tobillo de hace dos meses: un bloque, todo en un pie, con su aviso, sin sacar nada;
  - el borde: once meses cumplidos todavía; doce, ya no;
  - rodilla, o una fecha ilegible: el plan de alguien sano;
  - mayor con esguince: un solo bloque, el suyo, con los unilaterales primero;
  - la flexión de rodilla en un pie sale con dolor de rodilla, cadera o tobillo desde 4; el talón
    no.
- **Unitario del componente:** el esguince aparece solo en el tobillo, y pide el mes y nada más.
- **Matriz:** esguince de tobillo hace tres meses con fútbol (fuerza). Los siete perfiles de
  mayores cambian: sus bloques ahora rotan también por los ejercicios en un pie.
- **Barrido:** tres esguinces en la dimensión molestia (tobillo reciente, tobillo viejo, rodilla),
  con lo que tiene que pasar escrito a mano. Invariantes:
  - con esguince de tobillo reciente, toda sesión cierra con equilibrio y los primeros son en un
    pie;
  - sin edad ni esguince, nada de equilibrio;
  - lo que saca una regla de dolor no vuelve a entrar, contando la flexión en un pie como zancada.
  - La sensibilidad de la molestia pasa de 65 % a 69 %.
- **Falsificado** (todos dieron rojo):
  - contar el borde con `<=`;
  - aceptar cualquier zona;
  - no pedir unilaterales primero;
  - que el bloque de los mayores ignore el esguince;
  - sacar la equivalencia con la zancada;
  - no sumar el bloque propio.

## Lo que queda

- **Movimientos que no puede** (T3j).
- **Vuelta al deporte:** depende del objetivo "volver de una lesión", que es de T6.
