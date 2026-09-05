import { describe, expect, it } from 'vitest';
import { signInSchema, signUpSchema } from './schemas.ts';

describe('signInSchema', () => {
  it('acepta un email y contraseña no vacíos', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rechaza un email mal formado', () => {
    expect(signInSchema.safeParse({ email: 'no-es-un-email', password: 'x' }).success).toBe(false);
  });

  it('rechaza contraseña vacía (no exige longitud mínima: puede ser cualquier contraseña ya creada)', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('signUpSchema', () => {
  const base = { email: 'a@b.com', password: 'password123', displayName: 'Ana' };

  it('acepta datos válidos', () => {
    expect(signUpSchema.safeParse(base).success).toBe(true);
  });

  it('exige al menos 8 caracteres de contraseña', () => {
    expect(signUpSchema.safeParse({ ...base, password: '1234567' }).success).toBe(false);
  });

  it('exige al menos 2 caracteres de nombre, recortando espacios', () => {
    expect(signUpSchema.safeParse({ ...base, displayName: ' a ' }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, displayName: ' Ana ' }).data?.displayName).toBe('Ana');
  });

  it('rechaza un email mal formado', () => {
    expect(signUpSchema.safeParse({ ...base, email: 'no-es-un-email' }).success).toBe(false);
  });
});
