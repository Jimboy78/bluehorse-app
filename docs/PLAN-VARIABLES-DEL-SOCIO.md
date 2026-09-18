# Plan: sumar las variables del socio al motor, por tandas

## Contexto

El dueño clasificó 140 variables en el checklist
(https://claude.ai/artifact/D6Zz681qRxd8GtqycJgwJQ, doc `checklist/respuestas` v174; vale lo guardado ahí, no la lista pegada).

Lo que pide:
- **Pedir**: el motor lo usa sí o sí.
- **Opcional**: el motor puede usarlo o no.
- **Motor**: se deduce sin preguntar.
- **No**: no se hace nada.

Y dos condiciones:
1. **Preguntar con puertas.** Primero "¿tenés algún problema de salud?" sí/no, y recién con un sí se abre la lista, agrupada.
2. **Juntar los datos donde el socio ya está haciendo algo.** El peso se actualiza al cerrar la sesión, no en otra pantalla aparte.

Todo entra **por tandas chicas y robustas**: investigación con DOI, motor, pruebas en la matriz y el barrido, prod y prueba en el navegador. Nunca todo junto.

Punto de partida medido (`docs/research/38`, barrido de 3.000 socios):
- los minutos y los días sin entrenar cambian el plan en 0 % de los casos;
- la edad lo cambia en el 25 %;
- a los mayores les falta equilibrio.

Lo que ya existe y se reusa:
- el screening de salud (`apps/web/src/routes/Salud.tsx`, `lib/health-screening.ts`, `safety.screening` del ruleset);
- los pasos del registro (`routes/Onboarding.tsx`, `STEPS`);
- el reporte de dolor (`components/PainReport.tsx`);
- el cierre de sesión (`components/SessionClose.tsx`, `lib/mappers/session-close.ts`);
- las pruebas `tools/motor-matriz.test.ts` y `tools/motor-barrido.test.ts` (sus dimensiones en `DIM`).

## Qué variable va en qué momento

| Momento | Pedir (el motor lo usa) | Opcional | Lo deduce el motor |
|---|---|---|---|
| **Registro: vos** | edad, sexo, altura, peso | — | adolescente, mayor, fragilidad, menopausia (edad + sexo) |
| **Registro: experiencia** | nivel, años entrenando | — | RIR estimado según el nivel |
| **Registro: objetivo** | principal; secundarios con prioridad (bajar grasa, subir peso, salud, movilidad, volver de una lesión) | zona a priorizar, fecha objetivo | — |
| **Registro: deporte** (puerta "¿hacés deporte?") | cuál, fase, posición, qué quiere mejorar | nivel, partidos y entrenamientos por semana | prevención de lesiones del deporte, deporte con categoría de peso |
| **Registro: tiempo** | días por semana, minutos por sesión, descanso | — | — |
| **Registro: salud** (puerta "¿algún problema de salud o medicación?") | corazón, presión, diabetes, asma/EPOC, artrosis, osteoporosis, hernia abdominal, suelo pélvico, glaucoma/retina, epilepsia/vértigo, anticoagulantes, betabloqueantes | embarazo y posparto (solo mujeres), discapacidad física | — |
| **Registro: lesiones** (puerta "¿alguna lesión, dolor u operación?") | zona e intensidad, lesión o dolor, operación y hace cuánto, tendinopatía, hernia de disco, esguinces, movimientos que no puede, ejercicios o máquinas que no quiere, señales de alarma | reciente o crónico, prótesis | volver al deporte tras una lesión (se deduce de "volver de una lesión" + deporte) |
| **Antes de la sesión** (un toque) | cómo durmió | dolor muscular de la sesión anterior, días al partido | — |
| **Durante la sesión** | dolor en un ejercicio (ya existe) | — | técnica real, máximo, carga de partida, ritmo de progreso, diferencia entre lo propuesto y lo hecho, máquina ocupada o rota, horario lleno |
| **Al cerrar la sesión** | cómo fue (ya existe); peso cada tanto, en el mismo cierre | fuma | — |
| **Perfil, cuando quiera** | — | gustos, máquina o peso libre, solo/acompañado, variedad, confianza, miedo a lastimarse | — |

"No" (no se pregunta ni se usa): composición corporal, palancas, dominancia, movilidad, hiperlaxitud, ciclo, energía, estrés, hábitos, agenda, contexto social, detalles del gimnasio, etc.

**Nota del dueño:** faltar un día no cambia el plan. La cola ya funciona así (`sequence_index`, sin fechas). Se mantiene.

**Presupuesto del registro:** la ruta sin ningún "sí" en las puertas entra en unos 3 minutos. Cada puerta abre solo su grupo.

## El protocolo de cada tanda (igual para todas)

1. **Investigar.** Papers con DOI, abiertos y no el resumen del buscador. Un documento numerado en `docs/research/NN-*.md`, con la confianza de cada afirmación. `npm run docs` y `npm run sources`.
2. **Decidir.** Separar lo que es número con respaldo (va al ruleset) de lo que es decisión de producto (se le pregunta al dueño con opciones y medición).
3. **Modelar el dato.**
   - Si hace falta columna o tabla: skill `cambiar-esquema`, con `gym_id` (regla 5), `db:sync`, `db:types` y el mapper en `lib/mappers/`.
   - La migración a prod va sin preguntar y se avisa después.
4. **Llevarlo al ruleset como módulo de contexto** (forma EXPERT, `docs/research/38` etapa 2). Cada módulo declara exclusiones, bloques que agrega, ajustes de dosis y avisos; el motor solo los combina. Ningún número en código (regla 3), motor puro (regla 2).
5. **Pantalla.** El dato se pide en el momento de la tabla de arriba, detrás de su puerta.
6. **Probar:**
   - tests unitarios;
   - perfiles nuevos en la matriz;
   - la variable como dimensión nueva del barrido, con invariantes nuevas;
   - **la sensibilidad de la variable tiene que dar más de 0 %** (si no, el motor no la usa);
   - falsificar: romper cada guarda y ver el rojo;
   - `npm run qa`, `npm run check`;
   - la matriz, corrida una vez más con el motor sano antes de commitear, y mirar `git diff tools/reportes/`.
7. **Prod.** Ruleset y catálogo en la base. Probarlo entrando de verdad en el navegador; nada que escriba en la cuenta del dueño sin pedirlo.
8. **Cerrar.** Commit y push; `ESTADO.md` y `AUDITORIA-MOTOR.md` actualizados; un resumen corto al dueño con lo que quedó abierto.

**Condición para pasar a la siguiente tanda:**
- `check` verde;
- el barrido sin violaciones;
- la sensibilidad de las variables nuevas por encima de 0 %;
- los reportes sin cambios inesperados;
- probado en el navegador.

## Las tandas, en orden

- **T0. Base.**
  - Módulos de contexto en el ruleset y un único combinador (las exclusiones se suman, la dosis toma el más restrictivo, los bloques compiten por los minutos, se muestran como máximo 2 avisos).
  - Hacer que al barrido se le puedan agregar dimensiones fácil.
  - Pasar edad, deporte y molestia actuales a módulos sin cambiar ningún plan: los reportes de la matriz y el barrido tienen que quedar idénticos.
- **T1. Edad y etapa de vida** (lo deduce el motor):
  - equilibrio para mayores (Cochrane, Sherrington 2019; OMS 2020);
  - fragilidad;
  - adolescentes;
  - menopausia deducida por edad y sexo (investigar el rango de edad y qué cambia: hueso, fuerza).
  - Usa sexo y edad. Empieza a usar sexo y altura/peso solo donde la evidencia lo sostenga.
- **T2. Salud con puerta.**
  - Unificar con el screening actual.
  - Una regla investigada por condición: presión (no aguantar la respiración al hacer fuerza), diabetes (bajas de azúcar), betabloqueantes (cardio por esfuerzo percibido y no por pulso), anticoagulantes, osteoporosis (no flexionar la columna cargada), glaucoma, epilepsia/vértigo, asma, hernia abdominal, suelo pélvico, corazón (derivar).
  - Embarazo y posparto como opcionales.
- **T3. Lesiones en detalle.** Tendinopatía, hernia de disco, esguinces, operación y tiempo desde ella, prótesis, reciente o crónico, movimientos que no puede. Vuelta al deporte.
- **T4. Tiempo.** Los minutos arman la sesión (etapa 3: prioridad y pares, Iversen 2021). Días por semana y descanso. Resuelve la decisión pendiente 4.
- **T5. Deporte ampliado.**
  - posición y qué quiere mejorar, que eligen el par explosivo y el énfasis;
  - prevención (FIFA 11+ en fútbol, investigar los otros deportes);
  - deporte con categoría de peso;
  - días al partido, que el motor ya soporta y la app no pregunta;
  - carga semanal del deporte.
- **T6. Objetivos.** Varios objetivos con prioridad (`priority` ya existe y no se usa), bajar grasa, subir peso, salud, movilidad, volver de una lesión; zona a priorizar y fecha objetivo como opcionales.
- **T7. Señales de la sesión.**
  - Sueño del día como autorregulación.
  - Dolor muscular.
  - Técnica real, máximo, ritmo y la diferencia entre lo propuesto y lo hecho, desde los registros.
  - Peso cada tanto en el cierre.
  - Años entrenando junto con el nivel.
  - Conectar `user_baselines` (decisión pendiente 3).
- **T8. Preferencias opcionales.** Gustos, máquina o peso libre, compañía, variedad, confianza, miedo. Inferir el horario lleno de las sustituciones por máquina ocupada.

Cada tanda se hace en su propia sesión o loop, con este mismo protocolo. Al terminar una se la reporta y se arranca la siguiente.

## Archivos clave

- Motor: `packages/engine/src/placeholder-engine.ts`, `ruleset.ts`, `rulesets/v1-research.json`, `contract.ts`
- Dominio: `packages/domain/src/entities.ts`, `enums.ts`, `schemas.ts`
- Web: `routes/Onboarding.tsx` (+ `onboarding/schemas.ts`), `routes/Salud.tsx`, `lib/health-screening.ts`, `components/PainReport.tsx`, `components/SessionClose.tsx`, `components/Hoy.tsx` (el chequeo antes de la sesión), `lib/mappers/*`
- Base: `supabase/schemas/*.sql`
- Pruebas: `tools/motor-matriz.test.ts`, `tools/motor-barrido.test.ts`, `tools/reportes/*`
- Docs: `docs/research/NN-*.md`, `docs/ESTADO.md`, `docs/research/AUDITORIA-MOTOR.md`

## Verificación (en cada tanda)

- `npm run check` (lint, tipos y tests, con la matriz y el barrido adentro), `npm run qa`, `npm run qa:motor`.
- El diff de `tools/reportes/motor-v1-research.json` y `barrido-v1-research.json`, leído y explicado en el commit.
- Falsificación de cada guarda nueva: romperla, ver el rojo, restaurar.
- En prod: base verificada con `npx supabase db query --linked` y la app recorrida en el navegador con el bundle nuevo.
