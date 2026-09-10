import { BookOpen, ChevronRight, FlaskConical, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { Card, fieldClass, Notice, SectionLabel } from '../components/ui/index.ts';
import { documentos } from '../lib/docs.ts';
import { fadeUp, listContainer, listItem } from '../lib/motion.ts';

/**
 * TODA LA DOCUMENTACIÓN
 *
 * `/evidencia` responde "¿de dónde salen estos números?" con la ficha de cada
 * paper. Esto responde la otra mitad: **qué leímos nosotros en esos papers y
 * qué decidimos**. Son los archivos de `docs/research/`, publicados enteros.
 *
 * Es la parte incómoda de la promesa de la app, y por eso está: hay documentos
 * que dicen que un parámetro no se puede sostener, otros que declaran un hueco
 * sin cerrar, y uno que registra tres citas fabricadas por los agentes de
 * investigación. Publicar solo lo que salió bien sería el mismo problema que
 * presentar una fila de consenso con la cara de un metaanálisis.
 */
export function Documentacion() {
  const [busqueda, setBusqueda] = useState('');
  const buscadorId = useId();

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return documentos;
    return documentos.filter(
      (d) =>
        d.titulo.toLowerCase().includes(q) ||
        (d.resumen ?? '').toLowerCase().includes(q) ||
        d.archivo.toLowerCase().includes(q),
    );
  }, [busqueda]);

  return (
    <AppShell>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5"
      >
        <header className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 font-display text-[0.65rem] uppercase tracking-[0.16em] text-brand">
            <BookOpen size={12} aria-hidden="true" />
            Documentación
          </p>
          <h1 className="font-display text-2xl font-semibold uppercase leading-tight tracking-tight">
            Cómo se arman los planes
          </h1>
        </header>

        <Notice tone="info">
          Estos son los documentos con los que se construyó el motor: qué dice la investigación de
          cada tema, qué se tomó, qué se descartó y qué quedó sin resolver. Están publicados como
          están, con el lenguaje técnico y los errores encontrados anotados adentro.
        </Notice>

        <Link
          to="/evidencia"
          className="flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 transition-colors hover:border-brand/40"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/25 bg-brand/10 text-brand">
            <FlaskConical size={16} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">Los papers, uno por uno</span>
            <span className="text-xs text-slate">
              Cada fuente citada, con el enlace al trabajo original.
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-slate-dim" aria-hidden="true" />
        </Link>

        <label htmlFor={buscadorId} className="sr-only">
          Buscar en la documentación
        </label>
        <div className="relative">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-dim"
          />
          <input
            id={buscadorId}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por tema"
            className={`${fieldClass} pl-9`}
          />
        </div>

        <section className="flex flex-col gap-2.5">
          <SectionLabel>
            {visibles.length === documentos.length
              ? `${documentos.length} documentos`
              : `${visibles.length} de ${documentos.length}`}
          </SectionLabel>

          {visibles.length === 0 && (
            <p className="px-1 text-sm text-slate">Ningún documento menciona eso.</p>
          )}

          <motion.ul
            variants={listContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-2"
          >
            {visibles.map((doc) => (
              <motion.li key={doc.id} variants={listItem}>
                <Link to={`/documentacion/${doc.id}`} className="block">
                  <Card
                    animate={false}
                    className="flex items-start gap-3 p-3.5 transition-colors hover:border-brand/40"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-semibold leading-snug text-ink">
                        {doc.titulo}
                      </span>
                      {doc.resumen && (
                        <span className="line-clamp-3 text-xs leading-relaxed text-slate">
                          {doc.resumen}
                        </span>
                      )}
                      {/* El nombre del archivo real: quien quiera puede buscarlo
                          en el repositorio y comparar con lo que ve acá. */}
                      <span className="font-mono text-[0.6rem] text-slate-dim">{doc.archivo}</span>
                    </span>
                    <ChevronRight
                      size={16}
                      className="mt-0.5 shrink-0 text-slate-dim"
                      aria-hidden="true"
                    />
                  </Card>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      </motion.div>
    </AppShell>
  );
}
