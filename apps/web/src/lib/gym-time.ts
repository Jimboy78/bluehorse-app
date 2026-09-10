/**
 * LA HORA DEL GIMNASIO
 *
 * En la base todo es `timestamptz` y en el código se trabaja en UTC. Pero
 * "días consecutivos" y "esta semana" no existen en UTC: existen donde está
 * parada la persona. Blue Horse está en Arroyo Seco, UTC−3, y un gimnasio se
 * llena a la noche — que es justo la franja donde las dos zonas no coinciden.
 *
 * Qué pasaba agrupando por día UTC (medido, no supuesto):
 *
 * - Lunes 22:00 y martes 10:00, hora de acá, caen los dos en el **mismo** día
 *   UTC (el martes). Dos días seguidos de entrenamiento se mostraban como una
 *   racha de 1.
 * - Un domingo 21:00 de acá ya es lunes UTC, así que su volumen se sumaba a
 *   la barra de la semana **siguiente**. La semana que la persona entrenó
 *   quedaba más corta y la que empezaba, más larga.
 *
 * Es la regla de siempre de CLAUDE.md ("la zona del gimnasio solo al
 * formatear") aplicada a un lugar que no parecía formateo: agrupar por día ES
 * decidir qué día fue, y eso es un problema de zona.
 *
 * Una vez que la fecha es una clave `YYYY-MM-DD` de acá, la aritmética que
 * sigue (¿el día anterior?, ¿qué lunes?) es calendario puro y no vuelve a
 * tocar zonas.
 */

export const GYM_TZ = 'America/Argentina/Buenos_Aires';

/**
 * `Intl` y no una resta de horas: el offset de Argentina hoy es fijo, pero
 * restar tres horas a mano deja escrito en el código un supuesto que ninguna
 * prueba vigila. Si algún día vuelve el horario de verano, esto sigue bien y
 * la resta no.
 */
const CLAVE_DE_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: GYM_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `YYYY-MM-DD` del día en que pasó, en la zona del gimnasio. */
export function diaDelGimnasio(iso: string): string {
  return CLAVE_DE_DIA.format(new Date(iso));
}

/**
 * El lunes de la semana ISO de esa clave de día. Recibe la clave y no un
 * instante a propósito: la conversión de zona ya se hizo, y hacerla dos veces
 * es la forma de que una de las dos quede desactualizada.
 */
export function lunesDeLaSemana(claveDeDia: string): string {
  const fecha = new Date(`${claveDeDia}T00:00:00Z`);
  const diaIso = fecha.getUTCDay() === 0 ? 7 : fecha.getUTCDay(); // lunes=1 … domingo=7
  fecha.setUTCDate(fecha.getUTCDate() - (diaIso - 1));
  return fecha.toISOString().slice(0, 10);
}

/** Cuántos días de calendario hay entre dos claves. Positivo si `a` es posterior. */
export function diasEntre(a: string, b: string): number {
  const ma = new Date(`${a}T00:00:00Z`).getTime();
  const mb = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((ma - mb) / 86_400_000);
}

/**
 * Una clave `YYYY-MM-DD` como texto para mostrar, sin volver a pasar por
 * ninguna zona.
 *
 * `new Date('2026-09-07')` se parsea como medianoche **UTC**, así que
 * formatearla en la zona del gimnasio (UTC−3) retrocede un día: el gráfico de
 * volumen semanal etiquetaba "6 sept" —un domingo— la semana que arranca el
 * lunes 7. Con `2026-01-01` cambiaba hasta el año: mostraba "31 dic".
 *
 * La clave ya es una fecha de calendario: no queda nada que convertir, solo
 * que escribir. Por eso se arma la fecha por partes y se formatea sin
 * `timeZone` — es el único camino en el que entra y sale el mismo día.
 */
const DIA_Y_MES = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

export function claveComoTexto(claveDeDia: string): string {
  const [año, mes, dia] = claveDeDia.split('-').map(Number);
  if (!año || !mes || !dia) return claveDeDia;
  return DIA_Y_MES.format(new Date(año, mes - 1, dia));
}
