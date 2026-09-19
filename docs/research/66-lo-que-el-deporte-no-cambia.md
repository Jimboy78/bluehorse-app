# Lo que el deporte no cambia: carga semanal y categoría de peso

**Fecha:** 19/09/2026. **Tanda:** T5e y T5f del plan de variables. Las dos preguntas eran si hay
que pedirle al socio un dato más de su deporte. La respuesta, con la evidencia leída, es que no: el
motor no lo usaría, y una variable con sensibilidad 0 % no se pregunta (protocolo del plan).

## T5e. ¿Cuántas veces por semana entrena el deporte?

### Lo que dice la evidencia

- **Schumann et al. 2022**, *Sports Med*, metaanálisis de 43 estudios (texto completo,
  PMC8891239): sumar entrenamiento aeróbico al de fuerza **no reduce la fuerza máxima** (SMD −0,06)
  **ni la hipertrofia** (−0,01). Sí reduce la **fuerza explosiva** (−0,28), sobre todo si se hacen
  en la misma sesión; separadas por 3 horas o más, no. La **frecuencia** del aeróbico no modera el
  efecto. DOI 10.1007/s40279-021-01587-7.
- **Wilson et al. 2012**, *J Strength Cond Res*, 21 estudios: la interferencia depende de la
  modalidad (correr sí, bici no), la frecuencia y la duración del aeróbico. Es el metaanálisis
  anterior; Schumann, con el doble de estudios, ya no encuentra la frecuencia como moderador. DOI
  10.1519/JSC.0b013e31823a3e2d.
- **Spiering et al. 2021**, *J Strength Cond Res*, revisión narrativa: la fuerza y el músculo se
  mantienen hasta 32 semanas con **una sesión por semana y una serie por ejercicio**, si se sostiene
  la intensidad. En mayores hacen falta 2 sesiones y 2-3 series. No alcanzan los datos para
  recomendaciones específicas en deportistas. DOI 10.1519/jsc.0000000000003964.
- Ya estaba en `07`: el deporte **no cambia la dosis** (pesado contra liviano, SMD −0,03, I² 0 %).

### Qué quiere decir

No hay un número sostenido que diga "con 3 entrenamientos del deporte, el gimnasio baja tanto". Lo
que sí está sostenido ya está en el motor:

- en temporada el volumen baja a la mitad y la intensidad se mantiene (`07`), que es lo que
  Spiering dice que alcanza para mantener;
- cerca del partido la sesión se ajusta (`65`).

Lo de la fuerza explosiva en la misma sesión no se puede aplicar: el plan no sabe a qué hora
entrena el deporte.

### Decisión (recomendada)

**No se pregunta.** Si aparece un ensayo que module la dosis del gimnasio por la carga del
deporte, se revisa.

## T5f. ¿Compite en una categoría de peso?

### Lo que dice la evidencia

- **Brechney et al. 2022**, *Int J Sports Physiol Perform*, metaanálisis en deportes de combate:
  justo después de bajar de peso rápido, la fuerza máxima y el esfuerzo repetido caen un poco
  (g −0,29 y −0,37). **Después de recuperar**, el rendimiento es el de antes (g 0,22; −0,18 a
  0,62). DOI 10.1123/ijspp.2021-0104.
- **Lakicevic et al. 2020**, *Nutrients*, 14 estudios en judo, 1.103 deportistas: el efecto sobre el
  rendimiento es **ambiguo**. Lo consistente es el ánimo: más tensión, enojo y fatiga, menos vigor.
  DOI 10.3390/nu12051220.
- **Matthews et al. 2019**, *Int J Sport Nutr Exerc Metab*, 16 estudios y 4.432 deportistas: en MMA
  se baja cerca del 10 % del peso. Casi no hay datos objetivos de cuánto se baja. DOI
  10.1123/ijsnem.2018-0165.

### Qué quiere decir

Bajar de peso para dar la categoría es **nutrición y deshidratación**, y Blue Horse no es una app
de nutrición (CLAUDE.md). El plan del gimnasio no tiene nada sostenido que cambiar: la caída de
fuerza es chica, dura lo que dura el corte, y no hay estudios que digan cómo entrenar esos días.

### Decisión (recomendada)

**No se pregunta, y no hay aviso.** Un aviso sobre deshidratación sería un consejo de nutrición y
salud que la app no puede sostener ni seguir. Si el dueño quiere cubrirlo, el lugar es el staff, no
el motor.

## Cómo se prueba

No hay código nuevo. Lo que protege estas decisiones ya existe:

- el test de sensibilidad del barrido mira el deporte y la temporada;
- `07` sigue sosteniendo que el deporte no cambia repeticiones ni RIR (`placeholder-engine.test.ts`,
  "el deporte no cambia repeticiones ni RIR").
