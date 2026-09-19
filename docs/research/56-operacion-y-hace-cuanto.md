# Operación y hace cuánto

**Fecha:** 19/09/2026. **Tanda:** T3h del plan de variables. En el checklist es *pedir*: "operación y
hace cuánto".

## El problema

Una operación no es una lesión ni un dolor. Tiene dos etapas, y el motor tiene que distinguirlas:

1. **Mientras dura la rehabilitación**, la zona la maneja el kinesiólogo. Lo que se puede cargar
   depende de qué se operó y de cómo va, y eso el gimnasio no lo sabe. Si el plan propone ejercicios
   para esa zona, compite con la rehabilitación.
2. **Después del alta**, la zona se entrena como cualquier otra. Lo que queda es el riesgo de volver
   demasiado pronto a lo que la lesionó: saltar, girar, cortar.

## Volver a saltar después de una operación de rodilla — CONFIANZA MEDIA

- **Grindem et al. 2016**, cohorte Delaware-Oslo, 106 personas operadas del ligamento cruzado
  anterior, dos años de seguimiento:
  - volver a deportes de **nivel I** (saltos, giros, cortes) multiplicó por **4,32** el riesgo de
    volver a lesionarse la rodilla;
  - el riesgo bajó un **51 % por cada mes** que se demoró la vuelta, **hasta los 9 meses**; pasados
    los 9 meses, demorar más no cambió el riesgo;
  - DOI 10.1136/bjsports-2016-096031.
- **Por qué confianza media:**
  - es una cohorte, no un ensayo;
  - es del cruzado anterior, la operación de rodilla más estudiada; se aplica a toda operación de
    rodilla porque el socio no dice cuál fue, y para una artroscopia de menisco el plazo real
    probablemente sea menor. Es el lado conservador: nueve meses sin saltos en el gimnasio le cuestan
    poco a quien tuvo una operación menor, y le evitan el riesgo a quien tuvo la mayor.

## Lo que hace el motor

### En rehabilitación

- **La operación se trata como una lesión en el escalón más alto de la escala**
  (`comoMolestias`). Eso reusa todo lo que ya existe para una lesión:
  - la regla de dolor de la zona saca todo lo que la carga;
  - sin saltos (cuenta como molestia).
- **El aviso es el de rehabilitación, no el de dolor** (`postSurgery.inRehabNote`). El consejo de
  dolor autoriza a cargar hasta 5 de 10: no es lo que le corresponde a alguien que todavía está con
  el kinesiólogo.
- Cuando le dan el alta, lo marca en el perfil ("Terminé la rehabilitación").

### Con el alta

- La zona vuelve al plan.
- **Si fue la rodilla y hace menos de 9 meses** (`postSurgery.jumpFree`): sin saltos ni impacto, con
  un aviso que dice hasta cuándo.
  - Los meses se cuentan cumplidos, contra `context.now`: el motor no lee la hora (regla 2).
  - Una fecha que no se lee no inventa un plazo.
- En potencia, el aviso de potencia no aparece: el de la operación ya explica por qué no hay saltos.
- Una operación vieja con el alta es un socio sano.

## El dato

- `constraint_type` suma **`surgery`**.
- `user_constraints` suma `surgery_on` (fecha, el día 1 del mes) y `rehab_done`. En `57`,
  `surgery_on` pasó a llamarse `occurred_on`, porque el esguince también lleva el mes.
  - Un `check` obliga a que los dos estén cuando el tipo es operación, y a que no estén cuando no.
- Se pide el mes y no el día: nadie se acuerda del día, y el plazo se mide en meses.

## La pantalla

- La puerta de lesiones suma "Una operación". Con ese tipo no se pregunta la intensidad: se pregunta
  el mes (no puede ser futuro) y si ya terminó la rehabilitación.
- Si además de la operación le duele, eso se carga aparte como dolor.
- En el perfil, la operación en rehabilitación tiene el botón "Terminé la rehabilitación".

## Cómo se prueba

- **Unitario del motor:**
  - en rehabilitación sale la zona entera y los saltos, con el aviso de rehab y sin el de dolor;
  - con el alta y menos de 9 meses, la rodilla entra y los saltos no;
  - el borde: ocho meses y veintiséis días todavía no; nueve cumplidos, sí;
  - con el alta y pasado el plazo, o en el hombro, el plan es el de alguien sano;
  - en potencia, el aviso de potencia no aparece.
- **Unitario del componente:** la operación pide mes y rehabilitación, no intensidad; un mes mal
  escrito no está completo.
- **Matriz:** rodilla operada en rehabilitación (fuerza) y con el alta hace cinco meses (potencia).
- **Barrido:** cuatro operaciones en la dimensión molestia, cada una con su "sin saltos" escrito a
  mano. Invariante nueva: una operación en rehabilitación siempre evita su zona. La sensibilidad de
  la molestia pasa de 58 % a 65 %.
- **Falsificado** (todos dieron rojo):
  - no sacar la zona en rehabilitación;
  - contar el borde de los meses con `<=`;
  - que la operación no cuente para los saltos;
  - aplicar el plazo a cualquier zona;
  - que la operación no apague el aviso de potencia.

## Lo que queda

- **Vuelta al deporte** después de una lesión (se deduce de "volver de una lesión" más el deporte).
- **Movimientos que no puede.**
