import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import catalogo from './sources.generated.json' with { type: 'json' };

/**
 * Ninguna cita entra a la app sin resolver contra Crossref.
 *
 * La segunda vuelta de la auditoría del motor encontró, en una sola tanda de
 * seis informes, **tres DOIs fabricados** —uno resolvía a un corrigendum sobre
 * atletas transgénero, otro a un paper de modelos windkessel de propiedades
 * arteriales— y seis citas con la autoría o la revista inventadas. Al construir
 * el catálogo de fuentes apareció además que la tabla de progresión de
 * `03-progresion-descarga.md`, de la **primera** tanda, tenía tres de sus
 * cuatro filas marcadas ALTA con la cita rota.
 *
 * Una cita inventada al lado de un número es peor que un número sin cita: el
 * número solo se lee como provisorio, y la cita lo disfraza de verificado. La
 * regla dura 4 pide que la evidencia se muestre como es, y la app ahora publica
 * estas fuentes en pantalla.
 *
 * Este test no llama a Crossref —sería lento y dependería de la red—: verifica
 * que cada DOI citado en `docs/research/` esté en el catálogo generado, que es
 * el registro de lo que sí resolvió. Agregar una cita nueva obliga a correr
 * `node scripts/build-sources.mjs`; si no resuelve, hay que declararla acá
 * abajo con su motivo.
 */
describe('catálogo de fuentes', () => {
  /**
   * Citas que NO resuelven y se conservan en la investigación a propósito, para
   * dejar constancia de que se revisaron. Ninguna llega a la pantalla.
   */
  const NO_RESUELVEN = new Map([
    [
      '10.1007/s40279-022-01783-0',
      'Atribuido a "R. Jaiswal et al., 2023, Sports Med". 404 en Crossref y no existe ningún ' +
        'trabajo de ese autor sobre progresión de carga en esa revista. Sostenía el paso de ' +
        'carga de +5 % semanal marcado ALTA; el ruleset usa 1,25 % / 2,5 %, así que el número ' +
        'fabricado nunca llegó al motor. Ver la nota al pie de `03-progresion-descarga.md`.',
    ],
  ]);

  const DOI_RE = /10\.\d{4,5}\/[^\s)\]`,;"']+/g;
  const SECCION_DESCARTADAS = '## Nota sobre las fuentes';

  function limpiar(doi: string): string {
    return doi
      .replace(/~+$/, '')
      .replace(/\/(pdf|full|abstract)$/, '')
      .replace(/[.,;:]+$/, '');
  }

  /** Los DOIs de un documento, partidos entre los que respaldan y los descartados. */
  function doisDe(texto: string): { vivos: string[]; descartados: string[] } {
    const corte = texto.indexOf(SECCION_DESCARTADAS);
    const cuerpo = corte === -1 ? texto : texto.slice(0, corte);
    const pie = corte === -1 ? '' : texto.slice(corte);
    return {
      vivos: (cuerpo.match(DOI_RE) ?? []).map(limpiar),
      descartados: (pie.match(DOI_RE) ?? []).map(limpiar),
    };
  }

  /** Los DOIs citados como respaldo, sin los que las notas al pie descartan. */
  function citados(): Set<string> {
    const dir = join(import.meta.dirname, '..', '..', '..', '..', 'docs', 'research');
    const vivos = new Set<string>();
    const descartados = new Set<string>();

    for (const archivo of readdirSync(dir).filter((f) => /^\d\d.*\.md$/.test(f))) {
      const encontrados = doisDe(readFileSync(join(dir, archivo), 'utf8'));
      for (const d of encontrados.vivos) vivos.add(d);
      for (const d of encontrados.descartados) descartados.add(d);
    }

    for (const d of descartados) vivos.delete(d);
    return vivos;
  }

  it('cada DOI citado resolvió contra Crossref, o está declarado como que no', () => {
    const enCatalogo = new Set(catalogo.sources.map((s) => s.doi));
    const huerfanos = [...citados()]
      .filter((doi) => !enCatalogo.has(doi) && !NO_RESUELVEN.has(doi))
      .sort();

    expect(huerfanos).toEqual([]);
  });

  it('lo que el catálogo no pudo resolver es exactamente lo declarado', () => {
    expect([...catalogo.unresolved].sort()).toEqual([...NO_RESUELVEN.keys()].sort());
  });

  it('ninguna fuente publicada llega sin título ni año', () => {
    const incompletas = catalogo.sources
      .filter((s) => !s.title || !s.year)
      .map((s) => s.doi)
      .sort();

    expect(incompletas).toEqual([]);
  });

  it('las citas que la auditoría descartó no se publican', () => {
    // Las dos que más caro habrían salido: un corrigendum sobre atletas
    // transgénero citado como metaanálisis de perfiles carga-velocidad, y un
    // paper de modelos windkessel citado como evidencia de daño excéntrico.
    const enCatalogo = new Set(catalogo.sources.map((s) => s.doi));
    expect(enCatalogo.has('10.1007/s40279-021-01467-0')).toBe(false);
    expect(enCatalogo.has('10.1152/japplphysiol.00664.2006')).toBe(false);
  });
});
