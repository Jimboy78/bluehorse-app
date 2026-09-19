# Dolor de tobillo: la regla que faltaba

**Fecha:** 19/09/2026. **Tanda:** T3b del plan de variables. Es la segunda zona que `27` había dejado
sin regla, después de la cadera (`49`). En un gimnasio, el tobillo que duele es casi siempre un
**esguince** (agudo o que se repite) o una **tendinopatía de Aquiles** (dolor atrás, de semanas).

## Tendinopatía de Aquiles — CONFIANZA MEDIA

- **Guía multidisciplinaria holandesa 2021** (de Vos et al., texto completo, PMC8479731). El
  tratamiento arranca con:
  - educación sobre el cuadro y el pronóstico;
  - **consejo de carga**:
    - dejar por un tiempo las actividades que provocan dolor;
    - reemplazarlas por otras que no lo provoquen;
    - volver a subir la carga de a poco;
    - usar una escala de dolor para ajustar;
  - **fortalecimiento progresivo de la pantorrilla durante al menos 12 semanas**;
  - esperar sin hacer nada da poca o ninguna mejora a corto plazo.
  - DOI 10.1136/bjsports-2020-103867

## Esguince de tobillo — CONFIANZA MEDIA

- **Guerra-Sánchez et al. 2022**, revisión paraguas de revisiones sistemáticas (texto completo,
  PMC9301067):
  - el tratamiento **funcional** es mejor que inmovilizar;
  - el ejercicio (equilibrio, tabla inestable) **reduce las recaídas**;
  - la rehabilitación supervisada suele empezar dentro de las dos semanas.
  - DOI 10.3389/fmed.2022.868474
- **Reglas de Ottawa** (Bachmann et al. 2003, revisión sistemática de 27 estudios con 15.581
  pacientes): sensibilidad de casi 100 % para descartar fractura de tobillo y de mitad del pie.
  DOI 10.1136/bmj.326.7386.417
  - Solo se leyó el resumen: el texto de PMC es un escaneo.
  - El criterio que el socio puede aplicar solo, **no poder dar cuatro pasos apoyando**, es la
    parte de la regla que no pide tocar el hueso. Se usa en el aviso.
- **Chan et al. 2011**, revisión del esguince en el deporte (texto completo, PMC2724472): la rotura
  del tendón se examina con la prueba de Thompson, aparte del esguince. DOI 10.1186/1758-2555-1-14
  - De ahí sale la otra señal del aviso: un golpe o chasquido atrás del talón y no poder ponerse en
    puntas de pie.

## Lo que ya hacía el motor

Con **cualquier** molestia declarada, en cualquier zona:
- salen los saltos y los lanzamientos (`painSubstitution.avoidExplosive`, `46`);
- sale el bloque de impacto (`42`).

Para el tobillo, eso **ya es** lo que pide la guía de Aquiles: parar correr y saltar. El cardio del
catálogo es caminata, bici, elíptico y escaladora; no hay trote.

## La regla

| Severidad | Qué sale | Por qué |
|---|---|---|
| cualquiera | saltos, lanzamientos, impacto | regla general de molestia; es la "actividad que provoca" de la guía |
| 3 (5–6 de 10) | nada más: el aviso | la pantorrilla y el equilibrio son el tratamiento |
| 4 o más, o lesión desde 3 | **zancadas** (zancada, búlgara, subida al cajón) | apoyo en una pierna, con empuje y el tobillo flexionado bajo carga |

**Sigue en el plan:**
- los gemelos: fortalecer la pantorrilla es lo que pide la guía de Aquiles;
- el bloque de equilibrio de los mayores: el ejercicio de equilibrio es lo que baja las recaídas del
  esguince.

**El aviso (`keepDoing`):** gemelos lentos y equilibrio mientras no pasen de 5 de 10; saltos y trote
afuera hasta que no duela; bici o elíptico si la cinta molesta.

**Cuándo consultar (`referIf`):**
- después de doblarse el tobillo, no puede dar cuatro pasos apoyando (Ottawa);
- sintió un golpe o un chasquido atrás del talón y no puede ponerse en puntas de pie (rotura del
  Aquiles).

Confianza `low`, como las demás reglas de zona. La guía dice qué parar y qué hacer, pero ninguna
fuente probó un corte en 7 de 10.

## Lo que no entra

- **Sacar los gemelos.** Con un esguince reciente pueden molestar, pero la regla de lesión ya aplica
  el monitoreo de dolor, y la guía de Aquiles los pone en el centro del tratamiento.
- **Distinguir Aquiles de esguince.** La app no pregunta el diagnóstico. Los esguinces que se
  repiten y la tendinopatía son T3 aparte (`esguinces` y `tendón` en el checklist).

## Cómo se prueba

- El barrido suma a la dimensión molestia: tobillo con dolor 3, con dolor 4 y con lesión 3. La
  invariante de `49` (lo que saca una regla de dolor no vuelve a entrar) ahora también cubre el
  tobillo.
- Unitario: los saltos salen con 3; la zancada, con 4 o con una lesión; los gemelos y el equilibrio
  siguen; el tobillo ya no recibe el aviso de "zona sin regla".
- El test de "dos zonas sin regla" pasa a usar codo y espalda alta.
- Falsificado: con `avoidPatterns` vacío en el tobillo, falla el unitario.
