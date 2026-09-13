import type { BodyRegion } from '@bh/domain';
import { BODY_REGIONS } from '@bh/domain';
import { describe, expect, it } from 'vitest';
import { activeRuleset } from './engine.ts';
import { anotarRestriccionDeDolor, umbralDeRestriccion } from './session-log.ts';

/**
 * DESDE QUÉ SEVERIDAD UNA MOLESTIA QUEDA ANOTADA COMO VIGENTE
 *
 * `pain_reports` es el historial; `user_constraints` es lo que el motor mira. La
 * app escribía el primero y nunca el segundo, así que ningún socio podía producir
 * una molestia: el cribado escribe `health_screenings`, el onboarding no pregunta
 * por zonas, y Perfil solo lista y da de baja. Toda la maquinaria de dolor del
 * motor existía sin poder dispararse, y el texto que el ruleset muestra al
 * reportar dolor promete "Lo tenemos en cuenta para el próximo plan".
 *
 * El umbral no es un número elegido: sale de `safety.painRules`, que es quien
 * decide si el motor hace algo con esa zona.
 */
describe('umbralDeRestriccion', () => {
  const reglas = activeRuleset.safety?.painRules ?? [];

  it('el ruleset trae reglas de dolor con sus umbrales', () => {
    // Verde y vacío no sirve: sin reglas el umbral caería a 1 y todo lo de abajo
    // pasaría sin significar nada.
    expect(reglas.length).toBeGreaterThan(3);
    expect(reglas.every((r) => r.monitorFrom >= 1)).toBe(true);
  });

  it('para una zona con regla, es el menor monitorFrom de esa zona', () => {
    const conRegla = [...new Set(reglas.map((r) => r.bodyRegion))];
    expect(conRegla.length).toBeGreaterThan(0);
    for (const region of conRegla) {
      const suyos = reglas.filter((r) => r.bodyRegion === region).map((r) => r.monitorFrom);
      expect(umbralDeRestriccion(region), `${region}`).toBe(Math.min(...suyos));
    }
  });

  it('la rodilla tiene dos reglas y gana la más baja', () => {
    // Es el caso que distingue "el menor de la zona" de "el primero que aparece":
    // `knee` trae monitorFrom 3 y 4.
    const rodilla = reglas.filter((r) => r.bodyRegion === 'knee').map((r) => r.monitorFrom);
    expect(rodilla.length, 'la rodilla dejó de tener dos reglas').toBeGreaterThan(1);
    expect(umbralDeRestriccion('knee')).toBe(Math.min(...rodilla));
    expect(umbralDeRestriccion('knee')).toBeLessThan(Math.max(...rodilla));
  });

  it('una zona sin regla medida no queda más estricta que las que sí tienen', () => {
    const conRegla = new Set(reglas.map((r) => r.bodyRegion));
    const sinRegla = (BODY_REGIONS as readonly BodyRegion[]).filter((r) => !conRegla.has(r));
    expect(sinRegla.length, 'todas las zonas tienen regla: este caso ya no existe').toBeGreaterThan(
      0,
    );
    const menorDeTodas = Math.min(...reglas.map((r) => r.monitorFrom));
    for (const region of sinRegla) {
      expect(umbralDeRestriccion(region), `${region}`).toBe(menorDeTodas);
    }
  });

  it('nunca devuelve cero, que anotaría cualquier cosa', () => {
    for (const region of BODY_REGIONS as readonly BodyRegion[]) {
      expect(umbralDeRestriccion(region)).toBeGreaterThan(0);
    }
  });

  /**
   * Con un ruleset que NO es uniforme.
   *
   * Los tests de arriba sacan su expectativa del ruleset activo, y ahí las seis
   * reglas tienen el mismo `monitorFrom` (3). Medido: falsificando la función con
   * un `return 3` hardcodeado, los diez pasaban. Estos dos casos usan reglas
   * propias con umbrales distintos, que es lo único que distingue la derivación
   * de una constante.
   */
  describe('con reglas que no son todas iguales', () => {
    const reglas = [
      { bodyRegion: 'knee' as BodyRegion, monitorFrom: 2 },
      { bodyRegion: 'knee' as BodyRegion, monitorFrom: 5 },
      { bodyRegion: 'shoulder' as BodyRegion, monitorFrom: 4 },
    ];

    it('toma el menor de la zona, no uno fijo', () => {
      expect(umbralDeRestriccion('knee', reglas)).toBe(2);
      expect(umbralDeRestriccion('shoulder', reglas)).toBe(4);
    });

    it('una zona sin regla cae al menor de todas', () => {
      expect(umbralDeRestriccion('neck', reglas)).toBe(2);
    });

    it('sin ninguna regla no devuelve cero', () => {
      expect(umbralDeRestriccion('knee', [])).toBeGreaterThan(0);
    });
  });
});

/**
 * UNA FILA POR ZONA, CON LA SEVERIDAD DEL ÚLTIMO REPORTE
 *
 * Sin esto, cada toque de "me duele algo" dejaría una fila nueva y la lista de
 * Perfil se volvería el historial que `pain_reports` ya es. Y la severidad se
 * actualiza a la del último reporte y no a la peor: el dolor baja, y lo que la
 * persona dice hoy sobre su propio dolor es mejor señal que lo de la semana
 * pasada.
 *
 * El cliente es falso a mano y no un mock de Supabase: lo que se prueba es qué
 * escribe esta función según lo que ya había, y para eso alcanza con registrar
 * las llamadas. **No cubre que la escritura llegue a la base** — eso necesita
 * Supabase local, que en esta máquina no corre por falta de Docker.
 */
describe('anotarRestriccionDeDolor', () => {
  type Fila = { id: string; severity: number };

  function clienteFalso(vigente: Fila | null) {
    const hecho: { op: string; datos?: Record<string, unknown>; id?: string }[] = [];
    const cadena = {
      select: () => cadena,
      eq: () => cadena,
      is: () => cadena,
      maybeSingle: async () => ({ data: vigente, error: null }),
    };
    const client = {
      from: () => ({
        ...cadena,
        insert: async (datos: Record<string, unknown>) => {
          hecho.push({ op: 'insert', datos });
          return { error: null };
        },
        update: (datos: Record<string, unknown>) => ({
          eq: async (_col: string, id: string) => {
            hecho.push({ op: 'update', datos, id });
            return { error: null };
          },
        }),
      }),
    };
    return { client, hecho };
  }

  const alta = Math.max(
    ...(activeRuleset.safety?.painRules ?? []).map((r) => r.monitorFrom),
    umbralDeRestriccion('knee'),
  );
  const bajo = umbralDeRestriccion('knee') - 1;

  it('sin fila previa y por encima del umbral, inserta una', async () => {
    const { client, hecho } = clienteFalso(null);
    await anotarRestriccionDeDolor(client as never, 'u1', 'knee', alta, 'Sentadilla');
    expect(hecho.map((h) => h.op)).toEqual(['insert']);
    expect(hecho[0]?.datos).toMatchObject({ type: 'pain', body_region: 'knee', severity: alta });
  });

  it('sin fila previa y por debajo del umbral, no escribe nada', async () => {
    expect(bajo, 'el umbral de la rodilla es 1: este caso no se puede probar').toBeGreaterThan(0);
    const { client, hecho } = clienteFalso(null);
    await anotarRestriccionDeDolor(client as never, 'u1', 'knee', bajo, 'Sentadilla');
    expect(hecho).toEqual([]);
  });

  it('con fila previa actualiza en vez de apilar otra', async () => {
    const { client, hecho } = clienteFalso({ id: 'c1', severity: alta });
    await anotarRestriccionDeDolor(client as never, 'u1', 'knee', alta - 1, 'Prensa');
    expect(hecho.map((h) => h.op)).toEqual(['update']);
    expect(hecho[0]?.id).toBe('c1');
    expect(hecho[0]?.datos).toMatchObject({ severity: alta - 1 });
  });

  it('baja la severidad si el último reporte es menor: no se queda con la peor', async () => {
    const { client, hecho } = clienteFalso({ id: 'c1', severity: alta });
    await anotarRestriccionDeDolor(client as never, 'u1', 'knee', bajo, 'Prensa');
    expect(hecho[0]?.datos).toMatchObject({ severity: bajo });
  });

  it('si la severidad no cambió, no escribe de más', async () => {
    const { client, hecho } = clienteFalso({ id: 'c1', severity: alta });
    await anotarRestriccionDeDolor(client as never, 'u1', 'knee', alta, 'Prensa');
    expect(hecho).toEqual([]);
  });
});
