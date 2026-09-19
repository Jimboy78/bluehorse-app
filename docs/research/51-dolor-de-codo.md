# Dolor de codo: la regla que faltaba

**Fecha:** 19/09/2026. **Tanda:** T3c del plan de variables. Es la tercera zona que `27` había dejado
sin regla, después de la cadera (`49`) y el tobillo (`50`). En un gimnasio, el codo que duele es casi
siempre una **tendinopatía lateral** ("codo de tenista"). Su versión del lado de adentro ("codo de
golfista") es menos frecuente y se maneja igual.

## Lo que se encontró

### Con ejercicio mejora antes que esperando; la infiltración recae — CONFIANZA MEDIA

- **Bisset et al. 2006**, ensayo con 198 personas con codo de tenista de más de seis semanas (BMJ,
  resumen y resultados). Compararon fisioterapia (movilización con movimiento + ejercicio),
  infiltración con corticoides y esperar:
  - la infiltración fue mejor a las 6 semanas, pero **47 de los 65 que mejoraron recayeron**, y al
    año estaba peor que la fisioterapia;
  - la fisioterapia fue mejor que esperar a corto plazo;
  - **al año no hubo diferencia**: la mayoría mejoró en los dos grupos.
  - DOI 10.1136/bmj.38961.584653.ae
- **Bhabra et al. 2016**, revisión de tratamiento (texto completo, PMC5094303):
  - el tendón que se afecta (extensor radial corto del carpo) se carga al **agarrar**: la muñeca
    tiene que mantenerse extendida contra la fuerza que la flexiona al apretar;
  - en los cuadros tempranos, reposo relativo y **modificar la actividad**;
  - en los más avanzados, ejercicio con carga (excéntrico);
  - las cintas y las férulas no mostraron diferencias en fuerza de agarre ni dolor contra un placebo.
  - DOI 10.1177/2325967116670635

### Lo que eso quiere decir en la sala

- **Seguir entrenando.** El pronóstico es bueno y el ejercicio lo acelera.
- **Lo que carga el tendón es el agarre fuerte.** En la sala hay:
  - agarre puro: caminata del granjero;
  - tirones con agarre (remos, dorsalera, dominadas);
  - trabajo directo de codo (curl).
  - El catálogo **no** tiene un ejercicio de extensores de muñeca, que sería la parte específica del
    tratamiento.

## La regla

Dos tramos, como la rodilla y la cadera (`severityScale`: 3 es 5–6 de 10, 4 es 7–8, 5 es "no
puedo"):

| Severidad | Qué sale | Por qué |
|---|---|---|
| 3 | nada: el aviso | con ejercicio mejora antes (Bisset 2006) |
| 4, o lesión desde 3 | lo que es **agarre puro**: caminata del granjero (patrón `carry`, músculo principal `forearms`) | el tendón se carga al agarrar (Bhabra 2016); el granjero es solo eso |
| 5, o lesión desde 4 | además, el **curl de bíceps** | carga el codo directamente y con agarre |

**Siguen en el plan:** remos, dorsalera y dominadas. El aviso pide correas o agarre neutro y menos
peso si apretar la manija pasa de 5 de 10. Sacar todos los tirones con 7 de 10 dejaría un plan sin
espalda por un problema de agarre, que las correas resuelven.

**Cuándo consultar (`referIf`):**
- el dolor baja por el antebrazo con hormigueo o la mano se duerme: un nervio, no el tendón;
- perdió fuerza para agarrar;
- el codo se hinchó o se trabó después de un golpe.

Confianza `low`, como las demás reglas de zona.

## Lo que no entra

- **Sacar los tirones.** Ninguna fuente lo pide, y las correas bajan la exigencia del agarre.
- **Un ejercicio de extensores de muñeca.** Sería la parte específica del tratamiento, pero el
  catálogo no lo tiene y sumarlo es trabajo del catálogo (`cargar-catalogo`), no del motor. Queda
  anotado.
- **Distinguir lateral de medial.** La app no pregunta el diagnóstico, y los dos se cargan al
  agarrar.

## Cómo se prueba

- El barrido suma a la dimensión molestia: codo con dolor 4, con dolor 5 y con lesión 4.
  - "Sin molestia" pasa a pesar cuatro veces. Con catorce valores y un solo `null`, el bloque de
    impacto, que solo aparece sin molestia, quedó con 280 planes mirados, menos que el mínimo de
    300. Se le dio peso a lo que declara la mayoría en vez de bajar el mínimo.
- Unitario: el granjero sale con 4; el curl, con 5 o con una lesión de 4; el remo sigue; el codo ya
  no recibe el aviso de "zona sin regla".
- El test de "dos zonas sin regla" pasa a usar espalda alta y "otra": son las únicas que quedan.
- Falsificado: sin `biceps` en el tramo de 5, falla el unitario.
