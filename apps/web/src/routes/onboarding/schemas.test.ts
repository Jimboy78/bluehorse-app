import { describe, expect, it } from 'vitest';
import { activeRuleset } from '../../lib/engine.ts';
import {
  calibrationStepSchema,
  experienceStepSchema,
  frequencyStepSchema,
  goalStepSchema,
  personalStepSchema,
} from './schemas.ts';

const adulto = { birthDate: '1994-05-10', sex: 'female', weightKg: 68, heightCm: 170 };

describe('goalStepSchema', () => {
  it('acepta un objetivo válido sin deporte', () => {
    const result = goalStepSchema.safeParse({ goal: 'hypertrophy' });
    expect(result.success).toBe(true);
  });

  it('rechaza un objetivo que no existe', () => {
    const result = goalStepSchema.safeParse({ goal: 'flexibilidad' });
    expect(result.success).toBe(false);
  });
});

describe('personalStepSchema', () => {
  it('rechaza una fecha que da menos de 13 años', () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const result = personalStepSchema.safeParse({
      ...adulto,
      birthDate: tenYearsAgo.toISOString().slice(0, 10),
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una fecha inválida', () => {
    const result = personalStepSchema.safeParse({ ...adulto, birthDate: 'no-es-una-fecha' });
    expect(result.success).toBe(false);
  });

  it('acepta un adulto con datos completos', () => {
    const result = personalStepSchema.safeParse(adulto);
    expect(result.success).toBe(true);
  });

  it('coerciona el peso y la altura que llegan como string del <input>', () => {
    const result = personalStepSchema.safeParse({ ...adulto, weightKg: '78.5', heightCm: '175' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weightKg).toBe(78.5);
      expect(result.data.heightCm).toBe(175);
    }
  });

  it('exige peso y altura: sin ellos no se puede registrar la primera medición', () => {
    const { weightKg: _w, heightCm: _h, ...sinCuerpo } = adulto;
    expect(personalStepSchema.safeParse(sinCuerpo).success).toBe(false);
  });

  /**
   * Los límites son los mismos `check` que tiene `body_metrics`. Si el
   * formulario dejara pasar un valor de más, el insert lo rechazaría y el
   * socio vería un error de Postgres en vez de un mensaje.
   */
  it('rechaza pesos y alturas fuera del rango que acepta la base', () => {
    expect(personalStepSchema.safeParse({ ...adulto, weightKg: 24 }).success).toBe(false);
    expect(personalStepSchema.safeParse({ ...adulto, weightKg: 351 }).success).toBe(false);
    expect(personalStepSchema.safeParse({ ...adulto, heightCm: 99 }).success).toBe(false);
    expect(personalStepSchema.safeParse({ ...adulto, heightCm: 251 }).success).toBe(false);
  });
});

describe('experienceStepSchema', () => {
  it('solo acepta los niveles del dominio', () => {
    expect(experienceStepSchema.safeParse({ experienceLevel: 'intermediate' }).success).toBe(true);
    expect(experienceStepSchema.safeParse({ experienceLevel: 'semidios' }).success).toBe(false);
  });
});

describe('frequencyStepSchema', () => {
  it('rechaza más de 7 sesiones por semana', () => {
    const result = frequencyStepSchema.safeParse({
      sessionsPerWeekTarget: 8,
      sessionMinutesTarget: 60,
    });
    expect(result.success).toBe(false);
  });

  it('coerciona strings numéricos de un <input>', () => {
    const result = frequencyStepSchema.safeParse({
      sessionsPerWeekTarget: '3',
      sessionMinutesTarget: '45',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sessionsPerWeekTarget).toBe(3);
    }
  });
});

describe('calibrationStepSchema', () => {
  it('solo acepta los dos modos definidos', () => {
    expect(calibrationStepSchema.safeParse({ baselineMode: 'declared' }).success).toBe(true);
    expect(calibrationStepSchema.safeParse({ baselineMode: 'calibrate' }).success).toBe(true);
    expect(calibrationStepSchema.safeParse({ baselineMode: 'ya_se' }).success).toBe(false);
  });
});

/**
 * EL DEPORTE TIENE QUE SER UN ID DEL CATÁLOGO
 *
 * `user_goals.sport` guarda el id de una entrada de `sports.catalog`, y el
 * comentario del esquema de la base lo dice: "no texto libre: un string suelto no
 * se puede mapear y el motor lo ignoraría en silencio". El motor busca por id
 * exacto, y cuando no encuentra sigue sin deporte sin avisar nada —
 * `entry?.emphasis ?? []`, `category?.volumeMultiplier ?? 1`.
 *
 * El paso era un `<input type="text">` con placeholder "Fútbol, running,
 * ninguno…". Medido sobre 17 formas de escribirlo, solo 6 matchean: fallan todas
 * las que llevan mayúscula o tilde, o sea justo la que el placeholder sugería.
 * Alguien que contestaba "Fútbol" recibía el plan de alguien que no practica
 * nada.
 */
describe('el deporte del paso 1', () => {
  const catalogo = activeRuleset.sports?.catalog ?? [];

  it('el ruleset trae un catálogo de deportes', () => {
    // Verde y vacío no sirve: sin catálogo, el `refine` aceptaría solo el vacío y
    // los casos de abajo no probarían la regla sino su ausencia.
    expect(catalogo.length).toBeGreaterThan(5);
  });

  it('acepta todos los ids del catálogo', () => {
    for (const d of catalogo) {
      const r = goalStepSchema.safeParse({ goal: 'strength', sport: d.id });
      expect(r.success, `${d.id}`).toBe(true);
    }
  });

  it('acepta el vacío, que es "no practico ninguno"', () => {
    expect(goalStepSchema.safeParse({ goal: 'strength', sport: '' }).success).toBe(true);
    expect(goalStepSchema.safeParse({ goal: 'strength' }).success).toBe(true);
  });

  it('rechaza las formas que el motor no sabe mapear', () => {
    // Las que un socio escribiría naturalmente, y que antes se guardaban tal cual.
    for (const escrito of ['Fútbol', 'Futbol', 'fútbol', 'FUTBOL', 'Tenis', 'vóley', 'soccer']) {
      const r = goalStepSchema.safeParse({ goal: 'strength', sport: escrito });
      expect(r.success, `"${escrito}" no debería pasar`).toBe(false);
    }
  });

  it('lo que el schema acepta es exactamente lo que el motor sabe mapear', () => {
    // La aserción que importa: no que rechace una lista de ejemplos, sino que el
    // conjunto aceptado coincida con el catálogo. Si alguien agrega un deporte al
    // ruleset, pasa solo; si el schema se afloja, esto cae.
    const ids = catalogo.map((d) => d.id);
    const aceptados = [...ids, 'Fútbol', 'soccer', 'fulbo', 'Tenis'].filter(
      (v) => goalStepSchema.safeParse({ goal: 'strength', sport: v }).success,
    );
    expect(aceptados.sort()).toEqual([...ids].sort());
  });
});
