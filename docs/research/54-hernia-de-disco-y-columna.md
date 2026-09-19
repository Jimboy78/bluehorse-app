# Hernia de disco y problemas de columna

**Fecha:** 19/09/2026. **Tanda:** T3f del plan de variables.
- "Un problema de columna" estaba en la lista de salud (`43`) sin efecto.
- "Hernia de disco" es *pedir* en el checklist del dueño.

Las dos son la misma entrada: la opción pasa a llamarse **"Hernia de disco u otro problema de
columna"**. No hace falta un valor nuevo en la base.

## Lo que se encontró

### Moverse rinde igual que el ejercicio supervisado; la mayoría mejora — CONFIANZA MEDIA

- **Fernandez et al. 2015**, metaanálisis de 5 ensayos sobre ciática: el ejercicio supervisado le gana
  al consejo de mantenerse activo en el dolor de pierna a corto plazo, por poco y con evidencia de
  calidad baja. **A mediano y largo plazo no hay diferencia** en dolor ni en discapacidad (calidad
  moderada). DOI 10.1097/BRS.0000000000001036 (solo el resumen).
- **Yu et al. 2022**, revisión sobre la reabsorción de la hernia lumbar (texto completo,
  PMC9396855):
  - un metaanálisis de 38 estudios encontró que **entre el 62 y el 66 %** de las hernias con
    síntomas se reabsorben;
  - las extruidas y secuestradas son las que más se reabsorben;
  - el tratamiento conservador es la primera opción.
  - DOI 10.1186/s13075-022-02894-8
- **Sedrak et al. 2021**, revisión de 20 estudios en atletas de elite (texto completo, PMC8404721):
  - vuelve a jugar el **81,5 % sin operarse** y el 83,0 % operado, sin diferencia;
  - operarse no acelera la vuelta: 4,1 meses sin cirugía, 5,2 con cirugía.
  - DOI 10.1177/1941738121991782

### La urgencia: cauda equina — CONFIANZA MEDIA

- **Dionne et al. 2019**, revisión sistemática de 7 estudios con 569 personas, contra resonancia
  (solo el resumen):
  - las señales del síndrome de cauda equina son:
    - la zona entre las piernas dormida;
    - no poder orinar;
    - incontinencia urinaria o fecal;
  - son **más específicas que sensibles** (especificidad 0,62–0,88, sensibilidad 0,19–0,43): si
    aparecen, se consulta ya.
  - DOI 10.1016/j.msksp.2019.05.004
- **La regla de dolor lumbar no las tenía.** Su `referIf` decía "hormigueo, debilidad en las piernas
  o fiebre", pero nada de la zona entre las piernas ni de la vejiga, que es la urgencia real de una
  hernia. Se agregaron también ahí: quien tiene una hernia y no marcó la condición, pero declara dolor
  lumbar, recibe la misma señal.

## En el motor

- **La condición no saca nada ni baja la dosis.**
  - Mantenerse activo es tan bueno como el ejercicio supervisado.
  - La mayoría de las hernias mejora.
  - La condición no dice dónde duele **hoy**: el ajuste lo hacen las reglas de dolor de zona lumbar
    (`09`) y cuello cuando el socio anota la molestia.
- **Un aviso**, que junta tres cosas:
  - que puede entrenar y que la mayoría de las hernias se achica sola;
  - que si le duele la espalda o le baja dolor a la pierna o al brazo, lo anote como molestia en la
    zona lumbar o el cuello;
  - la urgencia de cauda equina.
- **Regla de dolor lumbar:** su `referIf` suma la urgencia de cauda equina.

## Lo que no entra

- **Sacar la flexión o la carga axial a quien tiene una hernia sin dolor.** No se encontró evidencia
  de que entrenar sin síntomas empeore una hernia. Cuando hay dolor, la regla lumbar ya saca la
  bisagra y el trabajo lumbar desde 7 de 10.
- **Preferencia direccional** (McKenzie): es un examen del kinesiólogo, no algo que la app pueda
  deducir.

## Cómo se prueba

- El barrido suma a la dimensión salud: problema de columna.
- Unitario: la condición deja la dosis y los bloques iguales y suma un aviso con la urgencia; el
  dolor lumbar, sin la condición, también trae la señal de cauda equina.
- Falsificado: sin la frase de cauda equina en la regla lumbar, falla el unitario.
