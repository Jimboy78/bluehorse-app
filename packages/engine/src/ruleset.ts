import type { ExperienceLevel, Goal } from '@bh/domain';
import {
  BODY_REGIONS,
  EXPERIENCE_LEVELS,
  GOALS,
  MATCH_DAY_STATES,
  MOVEMENT_PATTERNS,
  MUSCLE_GROUPS,
  RULESET_SOURCES,
  SEASON_PHASES,
  SPORT_CATEGORIES,
} from '@bh/domain';
import { z } from 'zod';

/**
 * EL RULESET ES EL CONTENIDO. El motor es el mecanismo.
 *
 * Todos los números de entrenamiento de la app viven acá adentro. Cuando termine
 * el research, se escribe un ruleset nuevo con `source: "research"`, se activa, y
 * se regeneran los planes. No cambia una línea de `apps/web` ni de este paquete.
 *
 * Investigaciones que llenan cada parte (ver `docs/research/`):
 *   prescription.{strength,hypertrophy,power}     → 01-fuerza-hipertrofia-potencia
 *   cardio (zonas, intervalos)                    → 02-cardio-resistencia-recomposicion
 *   progression, regression, deload, detraining,
 *   rotation                                      → 03-progresion-descarga
 *   byLevel                                       → 04-individualizacion-seguridad
 *   safety                                        → 04 parte D + 05-seguridad-reforzada
 *   sports (catálogo, categorías, temporada)      → 06-deporte-y-temporada
 *   sports.matchDay                               → 07-dias-pre-y-post-partido
 */

export const SLOT_ROLES = ['primary', 'secondary', 'isolation'] as const;
export type SlotRole = (typeof SLOT_ROLES)[number];

/**
 * Qué tan firme es la evidencia detrás de un bloque. Sale de la columna
 * "Confianza" del research y se muestra al usuario: presentar una fila BAJA con
 * la misma cara que una ALTA sería mentir por omisión.
 */
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

const percentRange = z
  .tuple([z.number().min(0).max(100), z.number().min(0).max(100)])
  .refine(([min, max]) => min <= max, { message: 'El rango va de menor a mayor.' });

const countRange = z
  .tuple([z.number().int().min(0), z.number().int().min(0)])
  .refine(([min, max]) => min <= max, { message: 'El rango va de menor a mayor.' });

const roleParamsSchema = z.object({
  sets: z.number().int().min(1).max(10),
  repsMin: z.number().int().min(1).max(100),
  repsMax: z.number().int().min(1).max(100),
  /** Reps en reserva objetivo. `null` para trabajo que no se mide así (cardio continuo). */
  rirTarget: z.number().int().min(0).max(10).nullable(),
  restSeconds: z.number().int().min(0).max(600),
  /**
   * Ventana de intensidad como % del 1RM. Con esto la app puede proponer una
   * carga de arranque cuando estima el 1RM, en vez de dejar al socio adivinando.
   */
  intensityPct1RM: percentRange,
});

const progressionSchema = z.object({
  /**
   * Cuánto subir cuando corresponde. Va separado por tren porque la adaptación no
   * es simétrica: el torso progresa más lento que las piernas en términos
   * absolutos. En estaciones de pin se ignora el porcentaje: sube un nivel.
   */
  stepPctUpperBody: z.number().min(0).max(50),
  stepPctLowerBody: z.number().min(0).max(50),
  /** Se sube si el RIR de la serie tope fue mayor o igual a esto... */
  triggerRirAtLeast: z.number().int().min(0).max(10),
  /** ...durante esta cantidad de sesiones seguidas. Filtra el "buen día". */
  consecutiveSessions: z.number().int().min(1).max(10),
});

const regressionSchema = z.object({
  stepPct: z.number().min(0).max(50),
  /** Sesiones seguidas sin alcanzar el mínimo de reps antes de bajar la carga. */
  missedRepsSessions: z.number().int().min(1).max(10),
});

const deloadSchema = z.object({
  /** Sesiones sin progresar antes de proponer descarga. */
  stallSessions: z.number().int().min(1).max(20),
  /** Días de ausencia que disparan una descarga al volver. */
  absenceDays: z.number().int().min(1).max(365),
  /** Multiplicador de volumen durante la descarga. */
  volumeMultiplier: z.number().min(0.1).max(1),
  /**
   * Si la descarga conserva la carga y recorta solo volumen. Bajar las dos cosas
   * a la vez desentrena; el objetivo es disipar fatiga sin perder el estímulo.
   */
  keepLoad: z.boolean(),
  /** RIR objetivo mientras dura la descarga: se para bastante antes del fallo. */
  rirTarget: z.number().int().min(0).max(10).nullable(),
});

/**
 * Cuánto bajar la carga al volver después de no entrenar. Los escalones se
 * evalúan de mayor a menor: el primero cuyo `days` se haya superado, gana.
 */
const detrainingStepSchema = z.object({
  days: z.number().int().min(1).max(3650),
  loadMultiplier: z.number().min(0.1).max(1),
});

const weeklyVolumeSchema = z.object({
  /** Series semanales por grupo muscular. Debajo del mínimo no hay estímulo; arriba del máximo no rinde. */
  minSetsPerMuscle: z.number().int().min(0).max(60),
  optimalSetsPerMuscle: countRange,
  maxSetsPerMuscle: z.number().int().min(1).max(60),
  /** Veces por semana que conviene tocar cada músculo. */
  sessionsPerMusclePerWeek: countRange,
});

const goalParamsSchema = z.object({
  primary: roleParamsSchema,
  secondary: roleParamsSchema,
  isolation: roleParamsSchema,
  progression: progressionSchema,
  regression: regressionSchema,
  deload: deloadSchema,
  weeklyVolume: weeklyVolumeSchema,
  detraining: z.array(detrainingStepSchema).min(1),
});

export type GoalParams = z.infer<typeof goalParamsSchema>;

const templateSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  goals: z.array(z.enum(GOALS)).min(1),
  sessionsPerWeek: z.tuple([z.number().int().min(1), z.number().int().min(1)]),
  sessions: z
    .array(
      z.object({
        label: z.string().min(1),
        focus: z.string().min(1),
        estimatedMinutes: z.number().int().min(10).max(180),
        slots: z
          .array(
            z.object({
              pattern: z.enum(MOVEMENT_PATTERNS),
              role: z.enum(SLOT_ROLES),
              /** Referencia a `cardio.sessions[].id`. Solo para slots de patrón `cardio`. */
              cardioSessionId: z.string().min(1).optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

/**
 * El cardio no entra en series y repeticiones: se prescribe por duración, zona de
 * intensidad e intervalos. Forzarlo al formato de sala era la deuda que dejaba el
 * ruleset provisorio.
 */
const cardioSchema = z.object({
  zones: z
    .array(
      z.object({
        zone: z.number().int().min(1).max(5),
        label: z.string().min(1),
        hrPercentMax: percentRange,
        /** Cómo se siente, para quien no usa pulsómetro. */
        feels: z.string().min(1),
      }),
    )
    .min(1),
  sessions: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        type: z.enum(['steady', 'interval']),
        intensityZone: z.number().int().min(1).max(5),
        /** Duración total del bloque continuo. `null` en intervalos. */
        durationMinutes: z.number().int().min(1).max(240).nullable(),
        /** Solo en intervalos. */
        interval: z
          .object({
            workMinutes: z.number().min(0.25).max(60),
            restMinutes: z.number().min(0.25).max(60),
            reps: z.number().int().min(1).max(30),
          })
          .nullable(),
        confidence: z.enum(CONFIDENCE_LEVELS),
      }),
    )
    .min(1),
  /**
   * Qué decirle a quien mezcla cardio con trabajo de pierna.
   *
   * Antes esto eran dos reglas — no meter intervalos el mismo día que tren
   * inferior, y separar las sesiones 6 horas — que además de no aplicarse nunca,
   * prescribían justo lo que el metaanálisis **no** encontró: ni el orden dentro
   * de la sesión ni entrenar el mismo día contra días separados mostraron
   * diferencia. Lo único que discriminó fue la modalidad: correr interfiere
   * (SMD −0,81 en fibras tipo I), pedalear no. Ver `docs/research/13`.
   */
  interference: z.object({
    note: z.string().min(1),
    confidence: z.enum(CONFIDENCE_LEVELS),
  }),
});

/**
 * Reglas de seguridad. **Opcional a propósito**: un ruleset provisorio no debe
 * inventar contenido de seguridad — es preferible que la app no ofrezca cribado a
 * que ofrezca uno fabricado. Cuando el bloque está, la app lo activa sola.
 */
const safetySchema = z.object({
  /** Texto que el socio acepta explícitamente antes de entrenar. */
  disclaimer: z.string().min(1),
  /** Cada cuántos meses se vuelve a pedir la aceptación. */
  disclaimerRenewMonths: z.number().int().min(1).max(60),
  screening: z.object({
    intro: z.string().min(1),
    questions: z
      .array(
        z.object({
          id: z.string().min(1),
          text: z.string().min(1),
          /** Si responder que sí frena el alta hasta tener autorización médica. */
          blocking: z.boolean(),
        }),
      )
      .min(1),
    /** Qué se le dice a quien queda frenado por el cribado. */
    blockedMessage: z.string().min(1),
    clearedMessage: z.string().min(1),
    confidence: z.enum(CONFIDENCE_LEVELS),
  }),
  /** Síntomas que obligan a frenar y consultar, se reporten cuando se reporten. */
  redFlags: z
    .array(
      z.object({
        id: z.string().min(1),
        text: z.string().min(1),
        action: z.string().min(1),
      }),
    )
    .min(1),
  /**
   * Qué significa cada punto de la escala de severidad (1..5) que elige el socio,
   * traducido al NPRS 0-10 que usan las fuentes. Sin esto el socio elige un
   * número sin anclas y ese número decide si se le saca un ejercicio.
   */
  severityScale: z
    .array(
      z.object({
        severity: z.number().int().min(1).max(5),
        /** Equivalente aproximado en NPRS 0-10, para poder citar las fuentes. */
        nprs: z.tuple([z.number().int().min(0).max(10), z.number().int().min(0).max(10)]),
        label: z.string().min(1),
      }),
    )
    .length(5),
  /**
   * Qué hacer cuando duele una zona. **No parar del todo**: tres metaanálisis
   * coinciden en que el dolor no es barrera para entrenar y que lo que manda es
   * la exposición y la adherencia, no la carga. Ver `docs/research/09`.
   *
   * Por eso hay dos umbrales y no uno: en el tramo de en medio el ejercicio se
   * mantiene con la regla de monitoreo a la vista; recién arriba se saca.
   */
  painRules: z
    .array(
      z.object({
        bodyRegion: z.enum(BODY_REGIONS),
        /**
         * Desde qué severidad (1..5) se muestra la regla de monitoreo sin sacar
         * nada del plan.
         */
        monitorFrom: z.number().int().min(1).max(5),
        /** Desde qué severidad (1..5) sí se sacan los patrones y músculos. */
        avoidFrom: z.number().int().min(1).max(5),
        /** Patrones que se sacan del plan a partir de `avoidFrom`. */
        avoidPatterns: z.array(z.enum(MOVEMENT_PATTERNS)),
        /** Músculos cuyo trabajo directo se saca a partir de `avoidFrom`. */
        avoidMuscles: z.array(z.enum(MUSCLE_GROUPS)),
        /** Qué sí se puede seguir haciendo, en castellano. */
        keepDoing: z.string().min(1),
        /** Cuándo hay que ir a un profesional en vez de seguir ajustando. */
        referIf: z.string().min(1),
        confidence: z.enum(CONFIDENCE_LEVELS),
      }),
    )
    .min(1)
    .refine(
      (rules) => rules.every((r) => r.monitorFrom <= r.avoidFrom),
      'Una regla de dolor no puede empezar a evitar antes de empezar a monitorear.',
    ),
  /**
   * La regla de monitoreo de dolor, en castellano, tal cual se le muestra al
   * socio: hasta cuánto dolor es aceptable y cuándo eso deja de serlo.
   */
  painMonitoring: z.object({
    text: z.string().min(1),
    confidence: z.enum(CONFIDENCE_LEVELS),
  }),
  /**
   * Qué se le dice a quien declara una zona para la que **no hay regla**.
   *
   * El socio elige entre diez zonas (`BODY_REGIONS`) y `painRules` cubre cinco.
   * Sin esto, declarar una lesión de severidad 5 en la cadera producía el plan
   * completo y **cero avisos** — indistinguible de "miramos y no hay nada que
   * ajustar". Es la regla dura 4 al revés: el silencio afirma una cobertura que
   * no existe.
   *
   * No se inventan reglas para las zonas que faltan. Una `avoidPatterns` para la
   * cadera sin una fuente que la sostenga sería exactamente el número inventado
   * que este proyecto no admite. Lo que se puede hacer sin inventar nada es
   * decir que no hay.
   *
   * `{region}` se reemplaza por la zona en castellano.
   */
  noRuleForRegion: z
    .object({
      text: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Qué decir cuando una molestia sacó todo un patrón y el plan lo reemplazó
   * por trabajo complementario en vez de dejar el día más corto.
   *
   * El reemplazo no sale de una tabla de "qué sustituye a qué": sale del
   * catálogo real, buscando ejercicios permitidos que toquen los músculos que
   * el patrón bloqueado cubría en ESE gimnasio. Por eso el texto no nombra
   * ejercicios: los nombra el plan, que es donde están.
   *
   * `text` lleva `{region}`, `{session}` y `{pattern}`. `textSinZona` es el
   * mismo aviso para cuando lo que vació el patrón fue un ejercicio o una
   * máquina que el socio marcó, sin zona del cuerpo asociada: ahí no hay
   * ninguna zona que nombrar, e interpolar "la zona que marcaste" sería
   * inventar una molestia que nadie declaró.
   */
  painSubstitution: z
    .object({
      text: z.string().min(1),
      textSinZona: z.string().min(1),
      /**
       * No ofrecer trabajo explosivo como reemplazo.
       *
       * Medido sobre el catálogo real: sin esto, a alguien con lumbalgia que
       * saca todo el patrón de bisagra el motor le ofrecía un **wall ball**, y
       * a alguien con la rodilla lesionada un **slam ball**. Los dos son
       * lanzamientos balísticos, y los dos aparecían justo para quien acababa
       * de declarar severidad 5.
       *
       * Contradice al propio ruleset: `acuteInjury` dice "se saca todo lo que
       * cargue la zona" y "mientras esté reciente, no uses el dolor como
       * permiso para cargar". Y no es una regla nueva: `sports.matchDay` ya
       * tiene este mismo `avoidExplosive` para el día del partido, que es el
       * otro momento en que el criterio es no arriesgar.
       *
       * Los tres explosivos del catálogo (salto al cajón, wall ball, slam ball)
       * no entraban a ningún plan hasta ahora, pero por un efecto colateral
       * —son de peso corporal y el slot principal prefiere algo a lo que se le
       * pueda subir la carga—, no por una decisión. La sustitución no pasa por
       * ese filtro, así que necesita la regla escrita.
       */
      avoidExplosive: z.boolean(),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Qué ofrecerle a alguien que avisa que le duele **en el medio** de la
   * sesión, con el teléfono en la mano y la máquina adelante.
   *
   * Hasta acá la app solo preguntaba por molestias al cerrar, o sea cuando ya
   * no se podía hacer nada al respecto. El dato servía para el plan siguiente
   * y para nada más.
   *
   * `limitsMovementFrom` es el punto de `severityScale` en el que el dolor deja
   * de ser algo que se aguanta: el 4 de esa escala es literalmente "duele
   * bastante y me hace cambiar cómo hago el movimiento". De ahí para arriba se
   * muestra `limitedText`, que suma la opción de cortar y la de preguntarle a
   * un instructor. Abajo va `text`, que ofrece cambiar o saltear.
   *
   * **Ninguno de los dos bloquea nada.** Las dos pantallas dejan seguir: quien
   * decide si sigue es la persona, no la app. Una app que le prohíbe entrenar
   * a alguien que vino al gimnasio deja de usarse, y entonces tampoco se entera
   * de la próxima molestia.
   */
  inSessionPain: z
    .object({
      limitsMovementFrom: z.number().int().positive(),
      text: z.string().min(1),
      limitedText: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Qué hacer cuando lo que el socio declaró es una **lesión**, no un dolor que
   * viene de arrastre.
   *
   * Toda la evidencia que sostiene `painMonitoring` y los dos umbrales de
   * `painRules` es de dolor **crónico**: que cargar la zona es seguro, que el
   * dolor durante el ejercicio no es barrera, y que lo que decide el resultado
   * es la exposición. Ninguna de esas fuentes estudió tejido que se lesionó
   * hace poco. Extrapolarla es lo que hacía el motor hasta acá, y el resultado
   * era decirle a alguien recién lesionado que podía cargar hasta 5 sobre 10.
   *
   * No hay acá ninguna ventana en días: la evidencia verificada no da un corte
   * limpio, y ponerlo sería inventarlo. La distinción es la que el socio ya
   * declara al cargar la restricción. Ver `docs/research/17`.
   */
  acuteInjury: z.object({
    /** Reemplaza a `painMonitoring` cuando hay una lesión declarada. */
    note: z.string().min(1),
    confidence: z.enum(CONFIDENCE_LEVELS),
  }),
  /** Situaciones que requieren autorización médica antes de entrenar. */
  specialPopulations: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        requiresClearance: z.boolean(),
        note: z.string().min(1),
      }),
    )
    .min(1),
});

export type Safety = z.infer<typeof safetySchema>;
export type PainRule = Safety['painRules'][number];

/**
 * Ajustes que no dependen del objetivo ni del nivel. Opcionales: si el ruleset no
 * los define, el motor no ajusta nada — no hay un default escondido en el código.
 */
const modifiersSchema = z.object({
  /**
   * A partir de cierta edad conviene menos carga, más repeticiones y más descanso.
   * No es que se adapten peor: se adaptan bien, pero con más margen.
   */
  /**
   * Ajuste por edad. **No es un multiplicador**: son las ventanas de intensidad
   * y repeticiones medidas directamente en 60-90 años (Borde 2015, 25 ECAs),
   * que reemplazan a las del adulto joven en los objetivos donde hay evidencia.
   *
   * Rebajar la carga por edad —lo que hacía la versión anterior— empuja fuera
   * de la ventana óptima justo donde la intensidad es el predictor más fuerte
   * (p < 0,01), y no compra seguridad: la alta intensidad no muestra más
   * eventos adversos ni más caídas. Ver `docs/research/08-edad.md`.
   */
  /**
   * Qué decir cuando el nivel declarado no cambia la dosis del objetivo elegido.
   *
   * Se le pregunta al socio con cuatro tarjetas, pero en varios objetivos el
   * `byLevel` está vacío y los cuatro niveles reciben la misma prescripción. La
   * mejor evidencia dosis-respuesta (67 estudios) solo distingue entrenado de no
   * entrenado, así que no hay con qué llenarlos sin inventar. Lo que sí
   * corresponde es no presentarlo como individualizado: ver `docs/research/10`.
   */
  experienceLevel: z
    .object({
      noDoseEffectNote: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Qué decirle a quien vuelve después de una pausa larga.
   *
   * El texto vivía en `placeholder-engine.ts`. Si los números de entrenamiento
   * no viven en el código, el texto que los explica tampoco: es contenido, y
   * cambia cuando cambia la investigación. Ver `docs/research/14`.
   *
   * Dos formas porque el plan no siempre trae carga: sin baseline cargado,
   * `targetLoad` es `null` en todos los items, y anunciar "un 15 % menos" es
   * prometer un ajuste sobre un número que el socio no va a ver en ningún lado.
   * `withLoad` usa `{dias}` y `{recorte}`; `withoutLoad`, solo `{dias}`.
   */
  detraining: z
    .object({
      withLoad: z.string().min(1),
      withoutLoad: z.string().min(1),
      /**
       * Lo aeróbico se pierde por otra vía y mucho más rápido que la fuerza, así
       * que el aviso de sala no le sirve a quien vuelve a hacer cardio: le habla
       * de tendones y le dice que no perdió nada. Se emite además del otro
       * cuando el plan trae cardio. Usa `{dias}`. Ver `docs/research/19`.
       *
       * No hay multiplicador que lo acompañe a propósito: los tamaños de efecto
       * medidos son SMD sobre atletas, no porcentajes de duración ni de
       * intensidad, y convertirlos en un recorte sería inventarlo.
       */
      cardioNote: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Qué decir cuando el socio declara menos sesiones de las que la plantilla
   * necesita. La frecuencia no pesa igual en todos lados: a igual volumen, su
   * pendiente sobre la fuerza es diez veces la que tiene sobre la hipertrofia,
   * y en hipertrofia el intervalo cruza el cero. Ver `docs/research/11`.
   */
  frequency: z
    .object({
      /** Usa `{declaradas}` y `{minimo}` como marcadores. */
      belowTemplateNote: z.string().min(1),
      /** Qué se pierde exactamente, según el objetivo. */
      byGoal: z.partialRecord(z.enum(GOALS), z.string().min(1)),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Cuando el plan no entra en el tiempo que el socio dijo tener.
   *
   * El onboarding pregunta los minutos por sesión, Perfil los muestra de vuelta,
   * y el motor **no los leía**: quien contestaba "tengo 30 minutos" recibía el
   * mismo plan que quien tiene 90, y la pantalla le prometía los 55 de la
   * plantilla.
   *
   * Lo que se compara no es una estimación: es el **descanso solo**, que sale
   * entero del ruleset (`restSeconds` × series). Una sesión no puede durar menos
   * que la suma de sus descansos, así que si eso ya no entra, el plan no entra —
   * sin necesidad de suponer cuánto tarda una serie. Ese supuesto sí sería un
   * número inventado: la investigación mide el tempo (`01`, confianza ALTA) y
   * dice que entre 0,5 y 8 segundos por repetición da lo mismo, o sea que da un
   * rango, no un valor.
   *
   * Medido sobre los 33 perfiles: la misma "Sesión A" promete 55 minutos a los
   * 27 perfiles que la reciben, y el descanso solo va de 12 a 46 minutos. En
   * fuerza avanzada quedaban 35 segundos por serie para hacer la serie, caminar
   * hasta el rack y cargar los discos.
   *
   * `{declarados}` son los minutos que dijo tener y `{descanso}` los que se van
   * solo en descansos.
   */
  sessionLength: z
    .object({
      overTargetNote: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  /**
   * Qué decir cuando el objetivo elegido no tiene señal que la app pueda leer
   * para decidir subir la carga.
   *
   * La autorregulación del motor se apoya en el RIR, que es lo único que la app
   * puede preguntar: no hay dinamómetro, ni sensor de velocidad, ni nadie
   * mirando (`docs/research/20-arranque-sin-test.md`). En potencia el ruleset
   * deja `rirTarget` nulo a propósito, porque la investigación regula ese
   * objetivo por velocidad de ejecución (VBT, `03-progresion-descarga.md`, 15 %
   * de pérdida de velocidad, confianza ALTA) — y eso la app no lo mide.
   *
   * Medido sobre un socio de potencia con series que le sobran: no recibe
   * **ninguna** propuesta. `proposeIncrease` se corta por el `rirTarget` nulo, y
   * `proposeStallDeload` se corta porque `isReadyToIncrease` da verdadero —el
   * RIR se registra igual aunque el objetivo no lo use—, así que las dos guardas
   * se ceden el paso. Con el `triggerRirAtLeast` de potencia en 10 el mismo
   * socio recibe `stalled`: el silencio dependía de que ese número fuera bajo.
   *
   * Inventar un `velocityLossThresholdPct` sería peor: es el número correcto
   * según la investigación, y no hay con qué alimentarlo. Lo accionable es
   * decirlo, que es lo que la regla dura 4 sí deja avisar. `{objetivo}` es el
   * nombre visible del objetivo.
   */
  autoregulation: z
    .object({
      noSignalForGoal: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
  olderAdults: z
    .object({
      fromAge: z.number().int().min(40).max(100),
      /** `[min, max]` de %1RM a prescribir a partir de `fromAge`. */
      intensityWindowPct1RM: z.tuple([z.number().min(1).max(100), z.number().min(1).max(100)]),
      /** `[min, max]` de repeticiones por serie a partir de `fromAge`. */
      repsWindow: z.tuple([z.number().int().min(1).max(30), z.number().int().min(1).max(30)]),
      /**
       * Objetivos donde la ventana aplica. Borde midió fuerza y morfología; en
       * resistencia y potencia no hay dato, y extrapolar sería inventar.
       */
      appliesToGoals: z.array(z.enum(GOALS)).min(1),
      note: z.string().min(1),
      /**
       * Qué decirle a alguien que pasó `fromAge` y eligió un objetivo que la
       * ventana no cubre.
       *
       * Hasta acá el motor salía en silencio: medido, alguien de **85 años** con
       * objetivo potencia recibía un plan byte a byte idéntico al de uno de 30
       * —3×1-3 explosivas— y **la misma cantidad de avisos**. Lo mismo en
       * resistencia, cardio y recomposición: cuatro de los seis objetivos.
       *
       * Es el mismo agujero que `safety.noRuleForRegion` vino a tapar del lado
       * de las zonas del cuerpo, y se cierra igual: no se inventa una ventana
       * para los objetivos que nadie midió, se dice que no hay. El silencio se
       * lee como "miramos tu edad y no hay nada que ajustar".
       *
       * `{objetivo}` se reemplaza por el objetivo en castellano.
       */
      noWindowForGoal: z.string().min(1),
      confidence: z.enum(CONFIDENCE_LEVELS),
    })
    .optional(),
});

/**
 * Deporte, momento de la temporada y día de partido.
 *
 * La regla que ordena todo el bloque, y que sale de `06`: **el deporte NO toca
 * la dosis**. Cargas pesadas y livianas dan lo mismo en rendimiento deportivo
 * (SMD −0,03, IC −0,38 a 0,31, I² = 0%), así que un deporte solo puede sesgar
 * QUÉ ejercicio se elige entre los equivalentes. Lo que sí mueve volumen es la
 * temporada y el día de partido, que son otra cosa.
 */
const sportsSchema = z.object({
  /**
   * Qué hace cada categoría. `hasMatches` decide si al socio se le pregunta
   * siquiera por el partido: un corredor tiene carreras esporádicas, no
   * partidos semanales, y preguntarle sería ruido.
   */
  categories: z.record(
    z.enum(SPORT_CATEGORIES),
    z.object({
      label: z.string().min(1),
      hasMatches: z.boolean(),
      /** Multiplicador sobre las series de sala. 1 = el plan no cambia. */
      volumeMultiplier: z.number().min(0.1).max(1),
      note: z.string().min(1),
    }),
  ),
  /**
   * El catálogo que ve el socio. Ancho a propósito, pero cada entrada aporta
   * solo `category` y `emphasis`: si dos deportes coinciden en los dos, son el
   * mismo deporte para el motor. Hay un test que lo verifica.
   */
  catalog: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        category: z.enum(SPORT_CATEGORIES),
        /** Músculos del gesto, para desempatar la selección. Nunca la dosis. */
        emphasis: z.array(z.enum(MUSCLE_GROUPS)),
      }),
    )
    .min(1),
  /**
   * Qué decirle a quien declaró un deporte cuyo énfasis el gimnasio no puede
   * cubrir. `{muscles}` se reemplaza con la lista.
   */
  emphasisUnreachableNote: z.string().min(1).optional(),
  /**
   * Y qué decirle cuando sí puede llegar, pero solo cambiando un ejercicio
   * por uno de sus equivalentes. `{muscles}` se reemplaza con la lista.
   */
  emphasisOnlyBySwapNote: z.string().min(1).optional(),
  seasonPhases: z.record(
    z.enum(SEASON_PHASES),
    z.object({
      label: z.string().min(1),
      volumeMultiplier: z.number().min(0.1).max(1.5),
      note: z.string().min(1),
    }),
  ),
  /**
   * Ajuste de la sesión de hoy según el partido. No entra en `generatePlan`:
   * el plan es una cola sin fechas, y esto lo declara el socio al entrar.
   */
  matchDay: z.record(
    z.enum(MATCH_DAY_STATES),
    z.object({
      label: z.string().min(1),
      /** Multiplicador de series sobre los ejercicios de tren inferior. */
      lowerBodyVolumeMultiplier: z.number().min(0).max(1),
      /** Multiplicador sobre el resto. El daño se concentra abajo. */
      upperBodyVolumeMultiplier: z.number().min(0).max(1),
      /**
       * Saca el trabajo explosivo. A las 48 h el salto ya se recuperó pero el
       * sprint no: se puede cargar pierna, no hacer saltos.
       */
      avoidExplosive: z.boolean(),
      /** Qué se le dice al socio y por qué. Se muestra tal cual. */
      note: z.string().min(1),
    }),
  ),
  confidence: z.enum(CONFIDENCE_LEVELS),
  confidenceNote: z.string().min(1).optional(),
});

export const rulesetSchema = z.object({
  version: z.string().min(1),
  source: z.enum(RULESET_SOURCES),
  /** Advertencias visibles: por qué estos números no son de fiar todavía. */
  notes: z.array(z.string()),
  planning: z.object({
    /** Cuántas sesiones se generan por adelantado en la cola. */
    sessionsAhead: z.number().int().min(1).max(60),
    /**
     * Cada cuántas semanas conviene rotar los ejercicios. Rotar todas las semanas
     * impide medir progreso; no rotar nunca deja partes del músculo sin trabajar.
     */
    rotationWeeks: countRange,
  }),
  prescription: z.record(
    z.enum(GOALS),
    z.object({
      default: goalParamsSchema,
      byLevel: z.partialRecord(z.enum(EXPERIENCE_LEVELS), goalParamsSchema.partial()).optional(),
      /** Qué tan firme es la evidencia de este objetivo. */
      confidence: z.enum(CONFIDENCE_LEVELS),
      /** Por qué esa confianza, en castellano. Se muestra si es `low`. */
      confidenceNote: z.string().min(1).optional(),
    }),
  ),
  templates: z.array(templateSchema).min(1),
  /**
   * Cómo se elige el ejercicio de cada slot entre los que sirven. No cambia la
   * dosis (series, reps, RIR): cambia cuál de los ejercicios válidos toca.
   */
  selection: z
    .object({
      /**
       * Cuántos ejercicios tiene que dejar disponibles un slot antes de que una
       * preferencia blanda pueda seguir achicando. Con un pool más chico que
       * esto, todos los socios del mismo perfil terminan en el mismo ejercicio
       * —y en la misma máquina— aunque el catálogo tenga alternativas.
       */
      minPoolSize: z.number().int().min(1).max(10),
      /**
       * El mismo piso, pero para el desempate por el deporte que practica.
       *
       * Va aparte de `minPoolSize` porque compartirlo dejaba al deporte casi sin
       * efecto. La única palanca que la investigación sostiene para el campo
       * "deporte" es esta (`06-deporte-y-temporada.md`: "el deporte se usa como
       * sesgo de selección entre ejercicios ya equivalentes", CONFIANZA MEDIA,
       * SMD 1,59 para el gesto local), y el paso anterior de la selección ya deja
       * el pool justo en el piso, así que cualquier filtro posterior que comparta
       * ese piso se saltea.
       *
       * Medido sobre el catálogo real, 336 combinaciones de los 34 perfiles de
       * `tools/motor-matriz.test.ts` × los 13 deportes con músculos del gesto,
       * contando en cuántas declarar el deporte cambia algún ejercicio:
       *
       * | piso | combinaciones donde el deporte cambia algo |
       * |---|---|
       * | 3 (el de `minPoolSize`) | 15 de 336 — 4,5 % |
       * | 2 | 39 de 336 — 11,6 % |
       *
       * Y no cuesta variedad. Sobre otro barrido —4320 slots de 3 objetivos × 3
       * niveles × 13 deportes × 30 socios—, los slots que quedan con una sola
       * opción para todos los socios del perfil son los **mismos 720 (16,7 %)**
       * con el piso en 3 que con el piso en 2. Bajarlo a 1 llevaría el efecto del
       * deporte mucho más arriba (945 de 1296 en ese mismo barrido) pero sube los
       * slots colapsados a 1104 (25,6 %), o sea reintroduce el problema que el
       * piso existe para evitar. Ese último paso es decisión del dueño.
       *
       * Tiene que quedar **estrictamente por debajo** de `minPoolSize`: si se
       * igualan, el deporte vuelve a los 15 de 336. Lo fija
       * `tools/motor-matriz.test.ts`, "el deporte tiene que cambiar algún
       * ejercicio".
       */
      emphasisMinPoolSize: z.number().int().min(1).max(10),
      /**
       * Cuántos niveles por debajo del suyo se le pueden proponer a la persona.
       * Hacia arriba no hay tolerancia: eso lo sigue tapando el filtro de
       * seguridad, que nunca propone un ejercicio que exija más técnica de la
       * que tiene.
       */
      levelTolerance: z.number().int().min(0).max(3),
      confidence: z.enum(CONFIDENCE_LEVELS),
      confidenceNote: z.string().min(1).optional(),
    })
    .optional(),
  sports: sportsSchema.optional(),
  cardio: cardioSchema.optional(),
  safety: safetySchema.optional(),
  modifiers: modifiersSchema.optional(),
  substitution: z.object({
    /** Debajo de esto no se ofrece el reemplazo. */
    minEquivalence: z.number().min(0).max(1),
    /** Peso de compartir patrón de movimiento en el puntaje de equivalencia. */
    patternWeight: z.number().min(0).max(1),
    /** Peso de compartir músculos primarios. */
    muscleWeight: z.number().min(0).max(1),
    /**
     * Un reemplazo tiene que ser del mismo patrón de movimiento.
     *
     * Sin esto el puntaje solo alcanzaba: con `patternWeight` 0,4 y
     * `muscleWeight` 0,6, un candidato de otro patrón pasa el piso de 0,5 con
     * que comparta los músculos (0,6 × 1 = 0,6). Medido sobre el catálogo real,
     * a las **dominadas** les ofrecía un **remo sentado** — mismos músculos,
     * pero tirón horizontal en vez de vertical.
     *
     * El botón no existe para cambiar de ejercicio: existe para hacer el mismo
     * trabajo de otra forma cuando la máquina está ocupada o cuando algo
     * molesta. Si deja elegir otra cosa, el plan deja de ser el plan.
     * Decisión del dueño, 12/09/2026.
     *
     * No aplica a las equivalencias cargadas a mano en `/panel`: si el staff
     * escribió que dos ejercicios se reemplazan, sabe algo que el puntaje no.
     */
    requireSamePattern: z.boolean(),
    maxOptions: z.number().int().min(1).max(10),
  }),
  /** Plantillas de texto para el "por qué va acá". `{exercise}` se reemplaza. */
  rationale: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
    isolation: z.string().min(1),
  }),
});

export type Ruleset = z.infer<typeof rulesetSchema>;

/** Valida un ruleset crudo. Se llama al cargarlo, no en cada uso. */
export function parseRuleset(raw: unknown): Ruleset {
  return rulesetSchema.parse(raw);
}

/**
 * Parámetros efectivos para un objetivo y nivel: el `default` del objetivo con
 * los ajustes de nivel encima. Si el ruleset no cubre el objetivo, tira error:
 * es preferible fallar a inventar una prescripción.
 */
export function resolveParams(ruleset: Ruleset, goal: Goal, level: ExperienceLevel): GoalParams {
  const block = ruleset.prescription[goal];
  if (!block) {
    throw new Error(
      `El ruleset ${ruleset.version} no define prescripción para el objetivo "${goal}".`,
    );
  }
  const override = block.byLevel?.[level];
  if (!override) return block.default;

  // Merge explícito: un `byLevel` puede pisar un bloque suelto (solo `primary`,
  // por ejemplo) y el resto tiene que caer al default sin quedar `undefined`.
  const base = block.default;
  return {
    primary: override.primary ?? base.primary,
    secondary: override.secondary ?? base.secondary,
    isolation: override.isolation ?? base.isolation,
    progression: override.progression ?? base.progression,
    regression: override.regression ?? base.regression,
    deload: override.deload ?? base.deload,
    weeklyVolume: override.weeklyVolume ?? base.weeklyVolume,
    detraining: override.detraining ?? base.detraining,
  };
}

/**
 * `true` cuando los cuatro niveles reciben exactamente la misma dosis para este
 * objetivo, o sea que el nivel declarado no individualiza nada.
 *
 * No alcanza con mirar si falta el `byLevel` del nivel de este socio: lo que
 * importa es si el objetivo diferencia a alguien. Un `byLevel` vacío significa
 * que no, y uno que solo define otros niveles sí diferencia — pero a otros.
 */
export function levelChangesDose(ruleset: Ruleset, goal: Goal): boolean {
  const byLevel = ruleset.prescription[goal]?.byLevel;
  return byLevel !== undefined && Object.keys(byLevel).length > 0;
}

/** `true` cuando lo generado no debe presentarse como consejo real. */
export function isPlaceholder(ruleset: Ruleset): boolean {
  return ruleset.source === 'placeholder';
}

/**
 * Cuánto ajustar la carga al volver tras `days` sin entrenar. Devuelve 1 (sin
 * ajuste) si la ausencia no llega al primer escalón.
 */
export function detrainingMultiplier(params: GoalParams, days: number): number {
  const applicable = params.detraining
    .filter((step) => days >= step.days)
    .sort((a, b) => b.days - a.days);
  return applicable[0]?.loadMultiplier ?? 1;
}
