# Cinco zonas del cuerpo que el socio puede marcar y el motor no mira

Revisión del 10 de septiembre de 2026. Salió de auditar el camino de lesiones, que es el de mayor
riesgo del motor y el único que no tenía cobertura sobre la diversidad de perfiles.

La buena noticia primero, porque es la mayoría del hallazgo: **la exclusión funciona**. Medido sobre
los seis perfiles con limitaciones, con el criterio real del motor: **cero ejercicios colados** en los
seis. Ni un patrón ni un músculo contraindicado entró a un plan. Y el gradiente de severidad se
comporta como lo documenta `09-dolor-y-lesiones.md`:

| Perfil | Qué declara | Reglas que aplican | Ítems del plan |
|---|---|---|---|
| `lumbalgia leve` | dolor 2 | ninguna | 40 |
| `dos zonas a la vez` | dolor 3 en rodilla y hombro | 2, solo monitoreo | 40 |
| `mayor de 60 con rodilla` | dolor 3 | 1, solo monitoreo | 40 |
| `lumbalgia que no deja` | dolor 5 | 1, evita `hinge` y `lower_back` | 36 |
| `hombro lesionado` | **lesión** 4 | 1, evita `vertical_push` y `front_delts` | 32 |
| `rodilla lesionada` | **lesión** 4 | 2, evita `lunge`, `squat` y `quads` | 32 |

Un dolor de 3 avisa y no saca nada; uno de 5 saca. Una lesión de 4 saca aunque un dolor de 4 no
sacaría, que es la decisión de `17-lesion-aguda.md` y está bien implementada.

Lo que sigue son tres cosas que sí estaban mal.

## 1. Cinco de las diez zonas no hacen absolutamente nada

`BODY_REGIONS` tiene **diez** zonas y `SessionClose.tsx` las ofrece todas. `safety.painRules` cubre
**cinco**: cuello, hombro, muñeca, zona lumbar y rodilla. Quedan afuera **codo, espalda alta, cadera,
tobillo y "otra"**.

Medido generando el mismo perfil con la zona cambiada, declarando siempre **lesión de severidad 5**:

| Zona | ¿Tiene regla? | Ítems del plan | Avisos |
|---|---|---|---|
| rodilla | sí | 32 | 7 |
| **cadera** | **no** | **40** | **0** |
| **tobillo** | **no** | **40** | **0** |
| **codo** | **no** | **40** | **0** |
| **espalda alta** | **no** | **40** | **0** |
| **otra** | **no** | **40** | **0** |

Mismo tipo, misma severidad, misma persona. La única diferencia es cuál de los diez botones apretó, y
en cinco de ellos el resultado es **el plan de alguien sano y silencio total**.

Eso es la regla dura 4 al revés. El silencio no es neutro: se lee como "lo miramos y no hay nada que
ajustar". La app está afirmando una cobertura que no tiene, en el lugar donde equivocarse duele.

### Lo que **no** se hizo

No se inventaron reglas para esas cinco zonas. Escribir un `avoidPatterns: ["hinge"]` para la cadera
porque suena razonable sería exactamente el número inventado que este proyecto existe para no tener
(`feedback_base_cientifica`, regla dura 3). Las seis reglas que hay llevan `confidence: "low"` y
salieron de `09`; inventar cinco más sin fuente sería peor que no tenerlas, porque además parecerían
respaldadas.

### Lo que sí se hizo

Un texto nuevo en el ruleset, `safety.noRuleForRegion`, que se emite cuando la zona declarada no
tiene regla:

> "Anotaste una molestia en {region} y para esa zona no tenemos una regla propia, así que el plan de
> hoy salió sin ajustar por eso. No quiere decir que no importe: quiere decir que no tenemos con qué
> decirte qué sacar sin inventarlo. Si te duele al hacer un ejercicio, cambialo o salteálo, y si la
> molestia no afloja o apareció de golpe, que la vea un profesional antes de seguir."

Es el mismo criterio que ya usa el bloque de potencia cuando no hay explosivos, y el de énfasis
cuando el gimnasio no tiene con qué: **decir lo que falta es una función del producto, no una
disculpa**. Confianza `low`, porque es una decisión de honestidad y no un hallazgo.

Queda abierto y es **decisión del dueño**: si conviene investigar reglas para cadera y tobillo, que
son las dos zonas que más aparecen en un gimnasio de las cinco descubiertas. Hasta que exista esa
investigación, el aviso es lo correcto.

## 2. La rodilla le decía al socio dos cosas que no van juntas

La rodilla es la única zona con **dos reglas escalonadas**: una desde severidad 3 que saca `lunge`, y
otra desde 4 que saca además `squat` y `quads`. Con una lesión de 4 aplican las dos, y el motor
emitía el consejo de las dos. Esto es lo que leía `rodilla lesionada`, textual:

> [1] Por la lesión en la rodilla: **Bicicleta, elíptico y sentadillas parciales controladas.** […]
> [2] Consultá si hubo un chasquido, la rodilla se traba o se hincha […]
> [3] Por la lesión en la rodilla: Trabajo de tren superior y core […]
> [4] **Consultá si hubo un chasquido, la rodilla se traba o se hincha** […]
> […]
> [6] No hay ningún ejercicio disponible para el patrón "squat" en Sesión A.

Dos problemas en el mismo bloque. El aviso [4] es **idéntico** al [2] palabra por palabra: las dos
reglas de rodilla comparten el `referIf`, y el motor emitía uno por regla en vez de uno por zona. Y
el [1] le recomienda sentadillas parciales cuatro renglones antes de avisarle que no quedó ninguna
sentadilla en el plan, porque el tramo estricto las sacó todas.

`09-dolor-y-lesiones.md` describe el `referIf` como escrito "para las seis regiones", asumiendo una
regla por zona. La segunda de rodilla se agregó después y nadie reconcilió que el bucle recorre
**reglas**, no zonas.

Corregido: las exclusiones se siguen uniendo —sacar de más es el lado seguro— pero el **consejo** sale
una sola vez por zona, el del tramo más severo que aplique. Con una molestia de 3 sigue saliendo el
permisivo, que es el que acompaña a un plan sin exclusiones.

## 3. Nada de esto tenía un test

Los tres hallazgos salieron de mirar, no de un rojo. Ahora hay cobertura de las tres cosas, y las
tres fallan si se rompe el motor:

- las diez zonas le dicen algo al socio, y el texto es exactamente el del ruleset con la zona puesta;
- ningún plan repite un aviso palabra por palabra, sobre los 33 perfiles;
- con dos tramos sale el estricto, y con severidad del permisivo sale el permisivo.

Un detalle del proceso que vale registrar: la primera versión del test de interpolación usaba
`toContain` y **pasaba por casualidad** en la zona "otra". Buscaba una frase que estaba en el molde
del propio aviso y no en la parte interpolada, así que la etiqueta de esa zona podía estar mal —y lo
estaba, en mi copia— y el test seguía verde. Es la misma trampa que ya está anotada en `CLAUDE.md`
sobre los tests que saltean todos los casos: verde no es lo mismo que mirado.

## Lo que este documento NO cubre

- **Si las cinco zonas faltantes merecen reglas propias.** Eso requiere investigación que no está
  hecha, y el aviso existe justamente para no simularla.
- **Los umbrales 3 y 4.** Siguen siendo los de `09`, con su `confidence: low`.
- **`redFlags` y `specialPopulations`**, que siguen escritos y sin consumir
  (`ruleset-consumo.test.ts`).
- **El cribado de salud.** Es otro camino, y está en `05-seguridad-reforzada.md`.
