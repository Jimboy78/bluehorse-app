import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { AppShell } from '../components/AppShell.tsx';
import { Bloques } from '../components/DocBlocks.tsx';
import { Card, Notice, Skeleton } from '../components/ui/index.ts';
import { useDoc } from '../lib/docs.ts';

/**
 * UN DOCUMENTO DE INVESTIGACIÓN, ENTERO
 *
 * Lo que se lee acá es el archivo de `docs/research/` como está, no un resumen
 * escrito para la pantalla. Están las citas textuales de los papers, los
 * intervalos de confianza, lo que se decidió, lo que NO se pudo decidir, y los
 * errores encontrados —incluidas tres citas que resultaron inventadas y
 * quedaron documentadas en vez de borradas—.
 *
 * El aviso de arriba no es un descargo: es la única forma honesta de mostrar
 * un texto que fue escrito para quien construye la app. Suavizar el lenguaje
 * hasta que suene a folleto sería dejar de mostrarlo.
 */
export function Documento() {
  const { docId = null } = useParams();
  const estado = useDoc(docId);

  return (
    <AppShell>
      <div className="flex flex-col gap-5">
        <Link
          to="/documentacion"
          className="flex items-center gap-1.5 self-start text-xs text-slate transition-colors hover:text-brand"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Toda la documentación
        </Link>

        {estado.kind === 'cargando' && (
          <div role="status" className="flex flex-col gap-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
            <span className="sr-only">Cargando el documento…</span>
          </div>
        )}

        {estado.kind === 'no-existe' && (
          <Notice tone="warn">
            No hay ningún documento con ese nombre. Volvé a la lista y elegí uno.
          </Notice>
        )}

        {estado.kind === 'error' && (
          <Notice tone="error" role="alert">
            No se pudo bajar el documento. Revisá tu conexión y probá de nuevo.
          </Notice>
        )}

        {estado.kind === 'listo' && (
          <>
            <header className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 font-display text-[0.65rem] uppercase tracking-[0.16em] text-brand">
                <FileText size={12} aria-hidden="true" />
                Investigación
              </p>
              <h1 className="font-display text-2xl font-semibold uppercase leading-tight tracking-tight">
                {estado.doc.titulo}
              </h1>
            </header>

            <Notice tone="info">
              Esto es una nota de trabajo, no un manual de entrenamiento. Está escrita para quien
              construye la app: nombra partes del programa, usa lenguaje estadístico y deja anotado
              lo que todavía no se pudo resolver. Se muestra tal cual para que puedas ver de dónde
              sale cada número.
            </Notice>

            <Card className="flex flex-col gap-3.5 p-4">
              <Bloques bloques={estado.doc.bloques} />
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
