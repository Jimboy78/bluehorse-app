import type { ReactNode } from 'react';

/**
 * LA INVESTIGACIÓN, DIBUJADA
 *
 * `scripts/build-docs.mjs` parte cada documento de `docs/research/` en bloques
 * y tramos, y esto los dibuja. No hay `dangerouslySetInnerHTML` ni una
 * librería de markdown en el navegador: llega una estructura y cada tipo usa
 * la tipografía de la app.
 *
 * Los documentos están escritos para quien construye la app, no para el socio:
 * hablan de claves del ruleset, de intervalos de confianza y de huecos sin
 * cerrar. Eso es a propósito — la pantalla que los muestra lo aclara arriba.
 * Reescribirlos para que suenen mejor sería lo contrario de mostrarlos.
 */

interface Span {
  readonly t: string;
  readonly v?: string;
  readonly href?: string;
}

interface Block {
  readonly b: string;
  readonly nivel?: number;
  readonly spans?: readonly Span[];
  readonly bloques?: readonly Block[];
  readonly items?: readonly (readonly Block[])[];
  readonly ordenada?: boolean;
  readonly encabezado?: readonly (readonly Span[])[];
  readonly filas?: readonly (readonly (readonly Span[])[])[];
  readonly texto?: string;
}

export type DocBlock = Block;

/** Un tramo de texto con su forma. */
function Tramo({ span }: { readonly span: Span }) {
  switch (span.t) {
    case 'fuerte':
      return <strong className="font-semibold text-ink">{span.v}</strong>;
    case 'enfasis':
      return <em className="italic">{span.v}</em>;
    case 'codigo':
      // Los nombres de archivo y las claves del ruleset aparecen a cada rato:
      // sin `break-words`, uno largo desborda a lo ancho en un teléfono.
      return (
        <code className="break-words rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em] text-brand">
          {span.v}
        </code>
      );
    case 'tachado':
      // En estos documentos el tachado marca una cita que resultó fabricada.
      // Se conserva: borrarla escondería justamente lo que se quiso blanquear.
      return <del className="text-slate-dim line-through">{span.v}</del>;
    case 'enlace':
      // `break-words`: varias referencias tienen la URL entera como texto del
      // enlace, y una URL no tiene espacios donde cortar. Medido sin esto: la
      // página desbordaba 409 px a lo ancho por dos enlaces de 1155 y 1478 px.
      return (
        <a
          href={span.href}
          target="_blank"
          rel="noreferrer"
          className="break-words text-brand underline underline-offset-2"
        >
          {span.v}
        </a>
      );
    case 'salto':
      return <br />;
    default:
      return <>{span.v}</>;
  }
}

function Tramos({ spans }: { readonly spans: readonly Span[] | undefined }) {
  return (
    <>
      {(spans ?? []).map((span, i) => (
        // Los tramos no tienen identidad propia y no se reordenan nunca: el
        // documento se dibuja entero de una y no vuelve a cambiar.
        // biome-ignore lint/suspicious/noArrayIndexKey: lista estática
        <Tramo key={i} span={span} />
      ))}
    </>
  );
}

const TITULOS: Record<number, string> = {
  // Nivel 1 y 2 se dibujan igual. Los documentos `04` y `05` traen varios
  // encabezados de nivel 1 —uno por sección, ninguno es el título— y sin esta
  // fila caían al estilo más chico, que los hacía ver como sub-subtítulos.
  1: 'mt-8 font-display text-lg font-semibold uppercase tracking-tight text-ink',
  2: 'mt-8 font-display text-lg font-semibold uppercase tracking-tight text-ink',
  3: 'mt-6 font-display text-sm font-semibold uppercase tracking-[0.1em] text-brand',
  4: 'mt-5 text-sm font-semibold text-ink',
};

function Bloque({ block }: { readonly block: Block }) {
  switch (block.b) {
    case 'titulo':
      return (
        <p className={TITULOS[block.nivel ?? 4] ?? TITULOS[4]}>
          <Tramos spans={block.spans} />
        </p>
      );

    case 'parrafo':
      return (
        <p className="text-sm leading-relaxed text-slate">
          <Tramos spans={block.spans} />
        </p>
      );

    case 'cita':
      // Las citas son los fragmentos textuales de los papers y la referencia
      // que va abajo. Es el bloque que más importa distinguir: es lo que dice
      // la fuente, no lo que decidimos nosotros.
      return (
        <blockquote className="flex flex-col gap-2 border-l-2 border-brand/50 bg-surface/60 py-3 pl-4 pr-3 text-slate">
          <Bloques bloques={block.bloques} />
        </blockquote>
      );

    case 'lista': {
      const Lista = block.ordenada ? 'ol' : 'ul';
      return (
        <Lista
          className={`flex flex-col gap-2 pl-5 text-sm leading-relaxed text-slate ${
            block.ordenada ? 'list-decimal' : 'list-disc'
          } marker:text-slate-dim`}
        >
          {(block.items ?? []).map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lista estática
            <li key={i} className="flex flex-col gap-2">
              <Bloques bloques={item} />
            </li>
          ))}
        </Lista>
      );
    }

    case 'tabla':
      return <Tabla block={block} />;

    case 'codigo':
      return (
        <pre className="overflow-x-auto rounded-xl border border-line bg-navy p-3.5 font-mono text-xs leading-relaxed text-slate">
          {block.texto}
        </pre>
      );

    case 'separador':
      return <hr className="border-line/70" />;

    default:
      return null;
  }
}

/**
 * Las tablas de parámetros son lo más ancho de estos documentos: series,
 * repeticiones, descanso, confianza y fuente en la misma fila. Se desplazan
 * adentro de su propia caja en vez de estirar la pantalla.
 *
 * **`min-w-0` no es decorativo.** La tarjeta que contiene el documento es un
 * `flex-col`, y un hijo de flex arranca con `min-width: auto`: no puede
 * achicarse por debajo de su contenido, así que el `overflow-x-auto` nunca
 * llegaba a activarse y la tabla estiraba la tarjeta. Medido en el navegador:
 * la página entera se desplazaba para los costados y el texto de alrededor se
 * salía de pantalla.
 */
function Tabla({ block }: { readonly block: Block }) {
  return (
    <div className="-mx-4 w-[calc(100%+2rem)] min-w-0 overflow-x-auto px-4">
      <table className="w-max min-w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-line">
            {(block.encabezado ?? []).map((celda, i) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: lista estática
                key={i}
                className="px-2.5 py-2 font-display uppercase tracking-[0.08em] text-slate-dim"
              >
                <Tramos spans={celda} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(block.filas ?? []).map((fila, f) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: lista estática
            <tr key={f} className="border-b border-line/50 align-top">
              {fila.map((celda, c) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: lista estática
                <td key={c} className="px-2.5 py-2 leading-relaxed text-slate">
                  <Tramos spans={celda} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Bloques({
  bloques,
}: {
  readonly bloques: readonly Block[] | undefined;
}): ReactNode {
  return (
    <>
      {(bloques ?? []).map((block, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: lista estática
        <Bloque key={i} block={block} />
      ))}
    </>
  );
}
