# Tendinopatía y la puerta de lesiones

**Fecha:** 19/09/2026. **Tanda:** T3g del plan de variables. Empezó como "tendinopatía" (*pedir* en el
checklist) y terminó siendo la **puerta de lesiones** entera, por lo que se encontró al buscar dónde
se declaraba.

## Lo que se encontró en el código

**La app nunca creaba una restricción de tipo "lesión".** Toda fila de `user_constraints` nacía de
dos lugares:
- el reporte de dolor de la sesión (`anotarRestriccionDeDolor`), siempre como `pain`;
- el "no me lo propongas más" de la vista previa del plan.

El motor tenía una vía entera para la lesión reciente (`acuteInjury`, `17`) y las reglas de zona
hablaban de "lesión", pero ningún socio podía llegar a ellas: solo quien cargara filas a mano. La
puerta "¿alguna lesión, dolor u operación?" del plan de variables no existía.

## Tendinopatía: el tendón mejora cargándolo — CONFIANZA MEDIA

- **Kongsgaard et al. 2009**, ensayo con 39 hombres con tendinopatía rotuliana, 12 semanas (solo el
  resumen):
  - **sentadilla pesada y lenta**: buen efecto a corto y a largo plazo, con mejora de la estructura
    del tendón y la mayor satisfacción;
  - excéntrico en plano declinado: también se mantuvo;
  - infiltración con corticoides: bien a corto plazo, **peor a los seis meses**.
  - DOI 10.1111/j.1600-0838.2009.00949.x
- **Silbernagel et al. 2007**, ensayo con 38 personas con tendinopatía de Aquiles (solo el
  resumen). Un grupo **siguió corriendo y saltando** con un modelo de monitoreo del dolor; el otro
  paró seis semanas. Los dos hicieron el mismo programa de carga:
  - **no hubo diferencias**;
  - "no se pudo demostrar ningún efecto negativo de seguir con la actividad que carga el tendón".
  - DOI 10.1177/0363546506298279
- **Pavlova et al. 2023**, metaanálisis de 110 estudios y 3.953 personas, sobre cinco tendones
  (manguito rotador, Aquiles, codo lateral, rotuliano, glúteo), texto completo, PMC10579176:
  - efecto mayor con **carga externa** que con el peso del cuerpo;
  - efecto mayor con frecuencia **menor que diaria**;
  - el volumen no mostró un patrón consistente.
  - DOI 10.1136/bjsports-2022-105754

### Qué quiere decir para el motor

- **Un tendón no es una lesión reciente.** La vía de lesión del motor saca todo lo que carga la zona
  desde 5 de 10 y dice que no se cargue mientras esté reciente. Para un tendón, eso es lo contrario
  de lo que muestran los tres estudios.
- **Un tendón se trata como un dolor crónico:**
  - las reglas de zona aplican con sus umbrales normales (desde 7 de 10 salen los ejercicios de la
    zona);
  - el monitoreo del dolor (hasta 5 de 10, y al día siguiente como empezó) es el mismo que usó
    Silbernagel.
- **Suma un aviso propio:** el tendón mejora cargándolo; con peso, no todos los días, el dolor como
  guía, y si pasa de 5 bajar el peso en vez de dejar el ejercicio.
- **Los saltos siguen afuera**, como con cualquier molestia (`painSubstitution.avoidExplosive`).
  Silbernagel mostró que seguir saltando con el dolor controlado no empeoró el Aquiles, así que la
  regla podría aflojarse para los tendones. Se deja como está: es una regla general que no se revisó
  en esta tanda, y aflojarla es una decisión que conviene tomar mirando las otras zonas.

## La puerta de lesiones

### El dato

- `constraint_type` suma **`tendinopathy`**. La migración es un `ADD VALUE`, no destructiva.
- La tabla sigue siendo `user_constraints`: zona, tipo e intensidad (la misma escala del reporte de
  dolor, `safety.severityScale`). No hacía falta otra tabla.
- `UserConstraint['type']` en el dominio es la única fuente del tipo. `labels.ts` y `profile.ts`
  tenían la unión escrita a mano, sin el valor nuevo: la etiqueta de un tendón habría salido vacía
  en el perfil.

### La pantalla (`LesionesDeclaradas`)

- **En el registro:** después de las condiciones de salud, en `/salud`, antes del onboarding. Así el
  plan que se arma al final del onboarding ya la tiene en cuenta.
  - La puerta: "¿Tenés ahora alguna lesión, dolor o tendinitis?".
  - Con un sí, se agregan de a una:
    - dónde (las diez zonas);
    - qué es: un dolor que viene arrastrando, una lesión reciente o una tendinitis o tendinopatía;
    - cuánto: la escala con las frases.
- **En el perfil:** "Agregar una lesión, dolor o tendinitis" en la sección de molestias, sin la
  puerta.
- **Detalles:**
  - una entrada por zona y tipo: volver a cargar la misma cambia la intensidad;
  - lo que está completo y no se agregó se guarda igual al apretar "Seguir", para que nadie pierda
    lo que cargó por no ver el botón.

### Lo que queda para la próxima tanda

- **Operación y hace cuánto** (*pedir* en el checklist). Necesita su propia búsqueda: la vuelta
  después de una operación depende mucho de cuál fue (ligamento cruzado, menisco, hombro, columna).
- **"Movimientos que no puede"** y **"ejercicios o máquinas que no quiere"**: el segundo ya existe
  en la vista previa del plan.

## Cómo se prueba

- **Unitario del motor:**
  - con 5–6 de 10, una lesión en la rodilla saca la zancada; un tendón, igual que un dolor, no;
  - desde 7 de 10, la regla de zona aplica al tendón;
  - un tendón cuenta como molestia (sin saltos);
  - trae su aviso y no el de lesión aguda.
- **Unitario del componente:**
  - sin responder no se puede seguir;
  - un no guarda vacío;
  - un sí sin nada no se puede guardar;
  - el tendón se guarda como `tendinopathy` aunque no se haya apretado "Agregar";
  - varias entradas;
  - la misma zona y tipo se reemplaza.
- **Barrido:** la dimensión molestia suma rodilla con tendón 3 y codo con tendón 4. La invariante de
  `49` (lo que saca una regla de dolor no vuelve a entrar) los cubre.
- **Falsificado:**
  - mandar el tendón por la vía de lesión da rojo;
  - sacarlo de `esMolestia` da rojo.
