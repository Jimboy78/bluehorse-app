/**
 * SALIDA COMPACTA
 *
 * Estas herramientas se leen tanto desde una terminal como desde un agente, y
 * en los dos casos el costo es el mismo: cada línea impresa se paga. Por eso la
 * regla es una sola —**se imprime lo que está mal, y una línea por lo que está
 * bien**—. Un barrido que revisa 22 tablas y encuentra un problema imprime dos
 * renglones, no veintitrés.
 *
 * Con `--json` la salida pasa a ser una sola línea de JSON, para encadenar con
 * otra herramienta sin tener que parsear texto.
 */

/** Un chequeo que corrió: cómo se llama, cuántas cosas miró, qué encontró. */
export function chequeo(nombre, mirados, hallazgos = []) {
  return { nombre, mirados, hallazgos };
}

/** Un hallazgo. `donde` es opcional y sirve para saltar al archivo. */
export function hallazgo(que, donde = null, detalle = null) {
  return { que, donde, detalle };
}

const LIMITE_POR_CHEQUEO = 12;

/**
 * Imprime el resultado y devuelve el código de salida.
 *
 * Un hallazgo NO es un error de la herramienta: `qa dead` encontrando una
 * columna sin usar es información, no una falla. El código 1 se reserva para
 * cuando la herramienta no pudo correr (Docker apagado, archivo ilegible), que
 * es lo único que amerita frenar un pipeline.
 */
export function imprimir(titulo, chequeos, { json = false } = {}) {
  if (json) {
    console.log(JSON.stringify({ titulo, chequeos }));
    return 0;
  }

  const conHallazgos = chequeos.filter((c) => c.hallazgos.length > 0);
  const limpios = chequeos.filter((c) => c.hallazgos.length === 0);

  for (const c of conHallazgos) {
    console.log(`\n${c.nombre}  —  ${c.hallazgos.length} de ${c.mirados}`);
    for (const h of c.hallazgos.slice(0, LIMITE_POR_CHEQUEO)) {
      const donde = h.donde ? `  ${h.donde}` : '';
      const detalle = h.detalle ? `  ${h.detalle}` : '';
      console.log(`  · ${h.que}${donde}${detalle}`);
    }
    if (c.hallazgos.length > LIMITE_POR_CHEQUEO) {
      console.log(
        `  … y ${c.hallazgos.length - LIMITE_POR_CHEQUEO} más (--json para verlos todos)`,
      );
    }
  }

  // Los limpios en un solo renglón: importa que corrieron, no cada uno.
  if (limpios.length > 0) {
    const total = limpios.reduce((n, c) => n + c.mirados, 0);
    console.log(`\nLimpio (${limpios.length} chequeos, ${total} cosas miradas):`);
    console.log(`  ${limpios.map((c) => c.nombre).join(' · ')}`);
  }

  const totalHallazgos = conHallazgos.reduce((n, c) => n + c.hallazgos.length, 0);
  console.log(
    totalHallazgos === 0
      ? `\n${titulo}: nada que reportar.`
      : `\n${titulo}: ${totalHallazgos} hallazgos en ${conHallazgos.length} chequeos.`,
  );
  return 0;
}

/** Termina con código 1: la herramienta no pudo correr. Distinto de encontrar algo. */
export function noSePudo(motivo, comoArreglarlo = null) {
  console.error(`No se pudo correr: ${motivo}`);
  if (comoArreglarlo) console.error(comoArreglarlo);
  process.exit(1);
}
