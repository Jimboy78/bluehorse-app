import { GOALS } from '@bh/domain';
import {
  BookOpen,
  ExternalLink,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import { AppShell } from '../components/AppShell.tsx';
import { Card, Chip, Notice, SectionLabel } from '../components/ui/index.ts';
import catalogo from '../content/sources.generated.json' with { type: 'json' };
import { activeRuleset } from '../lib/engine.ts';
import { GOAL_LABELS } from '../lib/labels.ts';
import { fadeUp, listContainer, listItem } from '../lib/motion.ts';

/**
 * EN QUÉ SE BASA TU PLAN
 *
 * Blue Horse dice que los números de sus planes salen de investigación y no
 * están inventados. Esta pantalla es donde eso se puede comprobar en vez de
 * tener que creerlo: cada objetivo con su nivel de confianza declarado, y las
 * fuentes con el DOI enlazado al paper.
 *
 * El catálogo (`content/sources.generated.json`) se **genera** con
 * `node scripts/build-sources.mjs`, que junta los DOIs citados en
 * `docs/research/` y resuelve título, autores y revista contra Crossref. No se
 * escribe a mano a propósito: los títulos y las autorías son justo lo que se
 * inventa sin querer, y la auditoría del motor encontró varias citas
 * fabricadas — una resolvía a un corrigendum sobre atletas transgénero, otra a
 * un paper de modelos windkessel. `content/sources.test.ts` impide que una cita
 * nueva llegue acá sin resolver.
 *
 * Lo que NO hace esta pantalla es interpretar los papers. Muestra qué se usó y
 * lleva al original; el socio que quiera leerlo, lo lee.
 */

const CONFIDENCE_META = {
  high: {
    label: 'Evidencia sólida',
    hint: 'Varios metaanálisis que coinciden.',
    icon: ShieldCheck,
    className: 'text-brand',
  },
  medium: {
    label: 'Evidencia limitada',
    hint: 'Hay estudios, pero son pocos o no coinciden del todo.',
    icon: ShieldQuestion,
    className: 'text-ink',
  },
  low: {
    label: 'Evidencia floja',
    hint: 'Consenso de expertos más que medición. Se usa el extremo prudente del rango.',
    icon: ShieldAlert,
    className: 'text-warn',
  },
} as const;

export function Evidencia() {
  const [busqueda, setBusqueda] = useState('');
  const [tema, setTema] = useState<string | null>(null);
  const buscadorId = useId();

  const temas = useMemo(
    () =>
      [...new Set(catalogo.sources.flatMap((s) => s.temas))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [],
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return catalogo.sources.filter((s) => {
      if (tema && !s.temas.includes(tema)) return false;
      if (!q) return true;
      return (
        s.title?.toLowerCase().includes(q) ||
        s.journal?.toLowerCase().includes(q) ||
        s.authors.some((a) => a.toLowerCase().includes(q)) ||
        s.doi.toLowerCase().includes(q) ||
        s.temas.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [busqueda, tema]);

  return (
    <AppShell>
      <motion.section
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2.5"
      >
        <SectionLabel icon={<BookOpen size={13} aria-hidden="true" />}>
          En qué se basa tu plan
        </SectionLabel>
        <Card tone="brand" className="flex flex-col gap-2 p-4 text-sm leading-relaxed">
          <p>
            Las series, las repeticiones y los descansos que te propone la app no los elegimos
            nosotros: salen de investigación publicada. Acá está toda, con el enlace a cada trabajo
            para que lo leas si querés.
          </p>
          <p className="text-xs text-slate">
            Y donde la evidencia es floja, lo decimos. No todo lo que prescribe la app está igual de
            respaldado, y presentar una cosa como la otra sería mentirte.
          </p>
        </Card>
      </motion.section>

      <ConfianzaPorObjetivo />

      <section className="flex flex-col gap-2.5">
        <SectionLabel>Las fuentes ({catalogo.sources.length})</SectionLabel>

        <label htmlFor={buscadorId} className="relative flex items-center">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 text-slate"
          />
          <input
            id={buscadorId}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por tema, autor o revista"
            className="w-full rounded-card border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-slate-dim focus:border-brand focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-1.5">
          <Chip selected={tema === null} onClick={() => setTema(null)}>
            Todo
          </Chip>
          {temas.map((t) => (
            <Chip key={t} selected={tema === t} onClick={() => setTema(tema === t ? null : t)}>
              {t}
            </Chip>
          ))}
        </div>

        {visibles.length === 0 ? (
          <Notice tone="info">No hay ninguna fuente que coincida con esa búsqueda.</Notice>
        ) : (
          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            {visibles.map((fuente) => (
              <motion.li key={fuente.doi} variants={listItem}>
                <FuenteCard fuente={fuente} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </section>

      <p className="pb-2 text-center text-[0.65rem] text-slate-dim">
        Catálogo actualizado el {catalogo.generatedAt}. Cada DOI se resolvió contra Crossref: si un
        trabajo no existe, no aparece acá.
      </p>
    </AppShell>
  );
}

/** El nivel de confianza que el ruleset declara para cada objetivo. */
function ConfianzaPorObjetivo() {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionLabel>Qué tan firme es cada objetivo</SectionLabel>
      <motion.ul
        variants={listContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-2"
      >
        {GOALS.map((goal) => {
          const bloque = activeRuleset.prescription[goal];
          if (!bloque) return null;
          const meta = CONFIDENCE_META[bloque.confidence];
          const Icono = meta.icon;

          return (
            <motion.li key={goal} variants={listItem}>
              <Card className="flex flex-col gap-1.5 p-3.5">
                <div className="flex items-center gap-2">
                  <Icono size={15} aria-hidden="true" className={`shrink-0 ${meta.className}`} />
                  <span className="font-display text-sm font-semibold uppercase tracking-tight text-ink">
                    {GOAL_LABELS[goal]}
                  </span>
                  <span className={`ml-auto shrink-0 text-[0.65rem] ${meta.className}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-slate">
                  {bloque.confidenceNote ?? meta.hint}
                </p>
              </Card>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}

function FuenteCard({ fuente }: { readonly fuente: (typeof catalogo.sources)[number] }) {
  const autores =
    fuente.authors.length === 0
      ? null
      : `${fuente.authors.join(', ')}${fuente.moreAuthors > 0 ? ` y ${fuente.moreAuthors} más` : ''}`;

  return (
    <a
      href={`https://doi.org/${fuente.doi}`}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-1.5 rounded-card border border-line bg-surface p-3.5 transition-colors hover:border-brand"
    >
      <p className="text-sm font-medium leading-snug text-ink">{fuente.title}</p>
      <p className="text-xs text-slate">
        {autores && <span>{autores} · </span>}
        {fuente.year}
        {fuente.journal && <span> · {fuente.journal}</span>}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {fuente.temas.map((t) => (
          <span
            key={t}
            className="rounded-full bg-brand/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-brand"
          >
            {t}
          </span>
        ))}
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[0.65rem] text-slate-dim group-hover:text-brand">
          Leer <ExternalLink size={11} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}
