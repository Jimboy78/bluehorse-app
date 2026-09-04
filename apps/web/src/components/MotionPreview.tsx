import { Dumbbell, Flame, MapPin, Timer, Trophy } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { celebratePersonalRecord } from '../lib/celebrate.ts';
import { listContainer, listItem, screen, spring, tappable } from '../lib/motion.ts';
import { RestTimer } from './RestTimer.tsx';
import { SetRow } from './SetRow.tsx';

/**
 * VISTA PREVIA DEL SISTEMA DE MOVIMIENTO — no es una pantalla del producto.
 *
 * Existe para poder ver y ajustar el lenguaje de animación antes de construir
 * las pantallas reales. Los datos son de ejemplo y están marcados como tales:
 * el catálogo real de Blue Horse todavía no está cargado.
 */

const EJERCICIOS_DE_EJEMPLO = [
  {
    id: 'a',
    nombre: 'Prensa 45°',
    carga: '80 kg',
    series: 3,
    reps: '8-12',
    sector: 'fondo derecha',
  },
  { id: 'b', nombre: 'Press de banco', carga: '45 lb', series: 3, reps: '8-12', sector: 'centro' },
  { id: 'c', nombre: 'Remo sentado', carga: 'pin 7', series: 3, reps: '10-15', sector: 'poleas' },
  {
    id: 'd',
    nombre: 'Press de hombro',
    carga: '30 kg',
    series: 3,
    reps: '10-15',
    sector: 'centro',
  },
  {
    id: 'e',
    nombre: 'Plancha',
    carga: 'peso corporal',
    series: 2,
    reps: '40 s',
    sector: 'colchonetas',
  },
];

export function MotionPreview() {
  const [activo, setActivo] = useState<string | null>(null);
  const [seriesHechas, setSeriesHechas] = useState<number[]>([]);
  const [descansando, setDescansando] = useState(false);
  const reduceMotion = useReducedMotion();

  const ejercicio = EJERCICIOS_DE_EJEMPLO.find((e) => e.id === activo);

  function alternarSerie(indice: number) {
    setSeriesHechas((previas) => {
      const yaEstaba = previas.includes(indice);
      if (yaEstaba) return previas.filter((i) => i !== indice);
      setDescansando(true);
      return [...previas, indice];
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <AnimatePresence mode="wait">
        {ejercicio ? (
          <motion.section key="detalle" {...screen} className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">{ejercicio.nombre}</h2>
                <p className="flex items-center gap-1.5 text-sm text-slate">
                  <MapPin size={14} aria-hidden="true" />
                  {ejercicio.sector}
                </p>
              </div>
              <motion.button
                type="button"
                {...tappable}
                onClick={() => {
                  setActivo(null);
                  setSeriesHechas([]);
                  setDescansando(false);
                }}
                className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-slate"
              >
                Volver
              </motion.button>
            </div>

            {descansando ? (
              <motion.div
                key="timer"
                {...screen}
                className="rounded-2xl border border-line bg-navy-soft px-4 py-8"
              >
                <RestTimer prescribedSeconds={12} onFinish={() => setDescansando(false)} />
              </motion.div>
            ) : (
              <motion.div
                variants={listContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-2.5"
              >
                {seriesDe(ejercicio).map(({ id, numero: i }) => (
                  <motion.div key={id} variants={listItem}>
                    <SetRow
                      index={i}
                      targetLoad={ejercicio.carga}
                      targetReps={ejercicio.reps}
                      done={seriesHechas.includes(i)}
                      onToggle={() => alternarSerie(i)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        ) : (
          <motion.section key="lista" {...screen} className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-2xl font-bold tracking-tight">Hoy te toca</h2>
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-slate">
                <Flame size={13} aria-hidden="true" />
                racha 4
              </span>
            </div>

            <motion.ul
              variants={listContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2.5"
            >
              {EJERCICIOS_DE_EJEMPLO.map((e, i) => (
                <motion.li key={e.id} variants={listItem}>
                  <motion.button
                    type="button"
                    {...tappable}
                    onClick={() => setActivo(e.id)}
                    className="flex w-full items-center gap-3.5 rounded-xl border border-line bg-navy-soft px-4 py-3.5 text-left"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-navy text-teal">
                      <Dumbbell size={18} aria-hidden="true" />
                    </span>
                    <span className="flex flex-1 flex-col">
                      <span className="font-semibold">{e.nombre}</span>
                      <span className="font-mono text-xs text-slate">
                        {e.series} × {e.reps} · {e.carga}
                      </span>
                    </span>
                    {i === 0 && (
                      <span className="rounded-full border border-teal/40 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-teal">
                        sugerido
                      </span>
                    )}
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>

            <p className="text-xs text-slate">
              El orden es una sugerencia: tocá el que esté libre. Si una máquina está ocupada, la
              app te ofrece un reemplazo equivalente.
            </p>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        {...tappable}
        onClick={celebratePersonalRecord}
        {...(reduceMotion ? {} : { whileHover: { y: -2 } })}
        transition={spring.press}
        className="flex items-center justify-center gap-2.5 rounded-xl border border-orange/40 bg-orange/10 px-4 py-3.5 text-sm font-semibold text-orange"
      >
        <Trophy size={16} aria-hidden="true" />
        Probar celebración de récord
      </motion.button>

      <p className="flex items-start gap-2 text-xs text-slate">
        <Timer size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
        Tocá un ejercicio, confirmá una serie y aparece el cronómetro de descanso (12 s en esta
        vista previa; en la app real sale del plan).
      </p>
    </div>
  );
}

/** Identidad estable por serie: la posición no alcanza como clave de React. */
function seriesDe(ejercicio: { id: string; series: number }) {
  return Array.from({ length: ejercicio.series }, (_, numero) => ({
    id: `${ejercicio.id}-serie-${numero + 1}`,
    numero,
  }));
}
