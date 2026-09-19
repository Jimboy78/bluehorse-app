# Diabetes y anticoagulantes: qué cambia en el plan

**Fecha:** 18/09/2026. **Tanda:** T2c del plan de variables. Las dos se marcan en la lista de salud
(`43`). Esto es lo que cada una cambia en el plan de quien la marca.

## Diabetes

### La dosis no se baja — CONFIANZA ALTA

- **ACSM 2022** (Kanaley et al.), consenso sobre ejercicio en diabetes tipo 2 (texto completo,
  PMC8802999):
  - "La fuerza de **intensidad alta** tiene más efecto que la de intensidad baja o moderada" sobre
    el control de la glucosa y la insulina.
  - En general, las guías de actividad física para adultos valen para quien tiene diabetes tipo 2,
    con algunas excepciones.
  - DOI 10.1249/MSS.0000000000002800
- **AHA 2023** (Paluch et al., `44`): sin contraindicaciones absolutas, quien tiene diabetes tipo 2
  puede hacer fuerza. Con retinopatía proliferativa activa o no proliferativa de moderada a severa,
  la fuerza de alta intensidad está contraindicada. DOI 10.1161/CIR.0000000000001189

**Conclusión:** ni piso de RIR ni menos carga. Bajarle la intensidad a quien tiene diabetes iría
contra la evidencia: justamente la alta es la que más ayuda.

### Lo que sí cambia: la hipoglucemia — CONFIANZA ALTA

- **ACSM 2022:**
  - Quien controla la glucosa solo con hábitos tiene un riesgo **mínimo** de hipoglucemia.
  - El riesgo sube con **insulina** y con **secretagogos** (sulfonilureas como glibenclamida o
    glimepirida, y meglitinidas).
  - Ellos tienen que **llevar hidratos de acción rápida** durante la actividad.
  - La hipoglucemia puede llegar **después**, cuando se vacían las reservas de glucógeno.
  - Con otros medicamentos orales o con agonistas de GLP-1 no hace falta ajustar nada.
  - No empezar con **más de 250 mg/dL** si hay cetonas moderadas o altas. Con **más de 300** sin
    cetonas: precaución, hidratarse, y empezar solo si se siente bien.
- **Betabloqueantes más diabetes** (ACSM 2022): los betabloqueantes pueden **tapar los síntomas** de
  una hipoglucemia, porque frenan la respuesta adrenérgica.

La app no pregunta qué medicación toma para la diabetes. El aviso nombra a quién le toca (insulina
o pastillas que bajan el azúcar) en vez de dárselo a todos como si fuera para todos.

### Lo que no entra

- **Fuerza antes que aeróbico** (Yardley et al. 2012, 12 personas con diabetes tipo 1): hacer la
  fuerza primero dio una glucosa más estable durante el ejercicio, y una hipoglucemia posterior más
  corta, aunque sin diferencia significativa. DOI 10.2337/dc11-1844
  - **No se implementa porque no tiene dónde actuar:** ninguna plantilla pone cardio antes de fuerza
    en la misma sesión. La única que mezcla (`cardio_base`) pone cardio y después core. Si una
    plantilla futura junta las dos, la regla vuelve a estar en juego.
- **Neuropatía periférica** (cuidar los pies, evitar lo que los golpea) y **retinopatía** (sin
  aguantar el aire ni cabeza abajo): ACSM 2022 y AHA 2023 las piden, pero la lista no pregunta
  complicaciones. La retinopatía entra en `glaucoma_retina` (T2e).

## Anticoagulantes

### La actividad baja el sangrado, no lo sube — CONFIANZA MEDIA

- **Frey et al. 2015**, cohorte prospectiva multicéntrica de 988 personas de 65 años o más con
  anticoagulantes por trombosis venosa. Sangrado mayor cada 100 personas-año:
  - actividad baja, **11,6**; moderada, 6,3; alta, **3,1**.
  - La actividad alta se asoció con **menos** sangrado mayor (subHR ajustado 0,40; IC 0,22–0,72).
  - Sin relación con el sangrado menor.
  - DOI 10.1111/jth.12793
- **Shendre et al. 2014**, 1.272 personas con warfarina: los activos (30 minutos o más, 3 veces por
  semana o más) tuvieron un **38 % menos** de hemorragias mayores (HR 0,62). DOI 10.1002/phar.1401
- Son cohortes: quien está más sano se mueve más. No prueban que el ejercicio proteja, pero sí
  contestan lo que importa acá: no hay señal de que entrenar aumente el sangrado.

**Conclusión:** los anticoagulantes **no cambian el plan**. No hay evidencia para sacar ejercicios,
bajar la carga ni sumar un aviso. En el gimnasio no hay deporte de contacto, que es donde
estaría el riesgo de golpe. Poner un aviso "por las dudas" sería el descargo que la regla dura 4
prohíbe. La condición se guarda igual por si una tanda posterior la necesita (por ejemplo, junto
con caídas en mayores).

## Lo que se decidió

| Condición | Qué cambia | De dónde |
|---|---|---|
| Diabetes | aviso: con insulina o pastillas que bajan el azúcar, llevar algo dulce y medirse antes; la baja puede llegar horas después | ACSM 2022 |
| Diabetes | aviso: más de 250 con cetonas, no entrenar; más de 300 sin cetonas, solo si se siente bien, tomando agua | ACSM 2022 |
| Diabetes + betabloqueantes | aviso: los síntomas de la baja pueden no aparecer, medirse en vez de esperar a sentirla | ACSM 2022 |
| Diabetes | la dosis no se toca | ACSM 2022: la intensidad alta ayuda más |
| Anticoagulantes | nada | Frey 2015; Shendre 2014 |

## Cómo se prueba

- El barrido suma a la dimensión salud: diabetes, diabetes con betabloqueantes, anticoagulantes.
- Invariante: con diabetes o anticoagulantes solos, la dosis es idéntica a la de sin condiciones.
- Unitario: el aviso de diabetes con betabloqueantes aparece solo con las dos juntas.
