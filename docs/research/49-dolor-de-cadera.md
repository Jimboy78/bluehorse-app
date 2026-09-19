# Dolor de cadera: la regla que faltaba

**Fecha:** 19/09/2026. **Tanda:** T3a del plan de variables, la primera de lesiones. `27` dejó cinco
zonas sin regla (codo, espalda alta, cadera, tobillo y "otra") y dejó como decisión del dueño si
investigarlas. En el checklist, el dueño marcó "zona del dolor" como **pedir**: el motor la usa. Esta
tanda cubre la cadera. Tobillo, codo y espalda alta van en tandas propias, cada una con su búsqueda.

## Qué duele cuando duele la cadera en un gimnasio

La app no pregunta el diagnóstico, y no lo va a preguntar: el socio no lo sabe. Las tres causas más
comunes en adultos que entrenan tienen algo en común, y ahí se apoya la regla.

### Tendinopatía glútea (dolor al costado de la cadera) — CONFIANZA MEDIA

- **Mellor et al. 2018, ensayo LEAP** (BMJ, texto completo, PMC5930290). Son 204 personas de 35 a
  70 años, casi todas mujeres, con dolor al costado de la cadera de más de tres meses. Éxito global a
  las 8 semanas:
  - **educación sobre la carga + ejercicio: 77 %** (51/66);
  - infiltración con corticoides: 58 %;
  - esperar: 29 %.
  - El programa tenía dos partes:
    - **evitar las posiciones que aprietan los tendones** contra el hueso de la cadera;
    - **fortalecer los glúteos de forma progresiva**, en particular los abductores.
  - DOI 10.1136/bmj.k1662
- **Pianka et al. 2021**, revisión (texto completo, PMC8182177):
  - el dolor empeora al **acostarse sobre ese lado**, **al hacer sentadillas**, **al sentarse con la
    pierna cruzada** y **al subir escaleras**;
  - en la lista de otras causas posibles están la artrosis, el choque femoroacetabular y la
    **fractura por estrés del cuello del fémur**.
  - DOI 10.1177/20503121211022582

### Artrosis de cadera — CONFIANZA ALTA

- **EULAR 2023** (Moseng et al., recomendaciones, texto completo, PMC11103326): a **todas** las
  personas con artrosis de cadera o de rodilla hay que ofrecerles ejercicio (fuerza, aeróbico,
  flexibilidad o neuromotor), con la dosis adecuada y progresión, junto con educación. Para la cadera
  en particular, la fuerza progresiva supervisada mejora el dolor, la función y la calidad de vida;
  los efectos son chicos. DOI 10.1136/ard-2023-225041

### Dolor de cadera en jóvenes y adultos activos (choque, labrum) — CONFIANZA BAJA

- **Kemp et al. 2020**, metaanálisis de 14 estudios (texto completo, PMC7677471):
  - el tratamiento con kinesiólogo mejora la función y la fuerza;
  - sobre el dolor, el efecto es incierto;
  - los programas de **fortalecimiento dirigido de al menos 3 meses** serían los que más rinden;
  - uno de los ensayos pedía **evitar los rangos extremos**.
  - DOI 10.1136/bjsports-2019-101690

### Lo que tienen en común

- **La fuerza es el tratamiento** en las tres causas. Sacar todo el tren inferior sería lo contrario
  de lo que muestran los tres.
- Lo que empeora son **posiciones**: flexión profunda, pierna cruzada, apoyar sobre ese lado, el
  apoyo en una pierna subiendo (escaleras).

## La regla

Tiene la misma forma que la de rodilla: dos tramos según la severidad (`severityScale`: 3 es 5–6 de
10, 4 es 7–8, 5 es "no puedo"). Con una **lesión**, la regla general del motor ya saca desde el piso
de monitoreo (`09`).

| Severidad | Qué sale | Por qué |
|---|---|---|
| 3 (dolor) | nada: aviso de qué hacer y qué evitar | la fuerza es el tratamiento; el monitoreo de dolor (5 de 10) ya dice cuánto |
| 4 o más, o lesión desde 3 | **zancadas** (zancada, búlgara, subida al cajón) | apoyo en una pierna que sube: las "escaleras" de Pianka 2021 |
| 4 o más | además, **sentadillas** | la sentadilla empeora la tendinopatía glútea (Pianka 2021); la flexión profunda, el choque (Kemp 2020) |

**Sigue en el plan:** las bisagras (hip thrust, peso muerto rumano), los abductores y el resto del
glúteo. Son el núcleo del programa LEAP.

**El aviso (`keepDoing`):** seguir fortaleciendo glúteos con lo que no duela; evitar cruzar las
piernas, dormir sobre ese lado y las sentadillas muy profundas; la bici suele andar bien.

**Cuándo consultar (`referIf`):**
- se cayó y le cuesta apoyar la pierna (fractura);
- el dolor está en la ingle y empeora al correr o saltar hasta no dejarlo seguir (fractura por
  estrés, en la lista de Pianka 2021);
- duele también quieto y de noche: no es un dolor mecánico.

Confianza `low`, como las otras seis reglas de zona. Los estudios dicen qué empeora y qué funciona,
pero ninguno probó una regla de "sacar la zancada con 7 de 10".

## Lo que no entra

- **Sacar la máquina de aductores.** La compresión del tendón se da con la pierna cruzada **más allá
  de la línea media**, y la máquina trabaja de afuera hacia el centro. Sin una fuente que la señale,
  sacarla sería inventar.
- **Preguntar el diagnóstico.** Distinguir la tendinopatía del choque o de la artrosis es un examen
  físico. La regla funciona para las tres.
- **La artrosis como condición de salud** (`osteoarthritis` en la lista de `43`) sigue sin efecto:
  no dice qué articulación es. Se trata junto con la de rodilla en otra tanda de T3.

## Cómo se prueba

- **Invariante nueva del barrido.** Ningún ejercicio que una regla de dolor saca aparece en el plan,
  ni por plantilla, ni por bloque, ni por sustitución. **No existía para ninguna zona.** Cuenta
  cuántos planes miró con una zona a evitar.
- El barrido suma a la dimensión molestia: cadera con dolor 4 y cadera con lesión 3.
- Unitario: zancada y sentadilla según la severidad; el hip thrust sigue; la cadera ya no recibe el
  aviso de "zona sin regla".
- Falsificado: con `isBlockedByPain` devolviendo siempre `false`, fallan la invariante nueva y seis
  tests más.
