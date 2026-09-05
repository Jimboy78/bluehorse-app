import { describe, expect, it } from 'vitest';
import { describeOutboxError } from './outbox.ts';

describe('describeOutboxError', () => {
  it('guarda el mensaje de un Error normal', () => {
    expect(describeOutboxError(new Error('sin señal'))).toBe('sin señal');
  });

  it('desarma el error de Supabase, que no es un Error sino un objeto plano', () => {
    const real = {
      code: '23502',
      message: 'null value in column "load_unit" violates not-null constraint',
      details: null,
      hint: null,
    };
    const texto = describeOutboxError(real);
    expect(texto).toContain('23502');
    expect(texto).toContain('load_unit');
  });

  it('nunca devuelve "[object Object]": era lo que ocultaba por qué no se guardaba una serie', () => {
    for (const raro of [{}, { foo: 1 }, { code: 'PGRST301' }]) {
      expect(describeOutboxError(raro)).not.toBe('[object Object]');
    }
  });

  it('cae a String() para lo que no es objeto', () => {
    expect(describeOutboxError('timeout')).toBe('timeout');
    expect(describeOutboxError(null)).toBe('null');
  });
});

describe('describeOutboxError con errores reales de Supabase', () => {
  it('distingue el error de FK que ocultaba el récord personal', () => {
    const fk = {
      code: '23503',
      message: 'insert or update on table "personal_records" violates foreign key constraint',
      details: 'Key (set_log_id) is not present in table "set_logs".',
    };
    const texto = describeOutboxError(fk);
    expect(texto).toContain('23503');
    expect(texto).toContain('set_log_id');
  });
});
