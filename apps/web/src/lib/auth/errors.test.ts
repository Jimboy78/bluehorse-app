import { describe, expect, it } from 'vitest';
import { describeAuthError } from './errors.ts';

function authError(message: string): Error {
  return new Error(message);
}

describe('describeAuthError', () => {
  it('devuelve string vacío si no hay error', () => {
    expect(describeAuthError(null)).toBe('');
  });

  it('traduce credenciales inválidas', () => {
    expect(describeAuthError(authError('Invalid login credentials'))).toBe(
      'Email o contraseña incorrectos.',
    );
  });

  it('traduce email sin confirmar', () => {
    expect(describeAuthError(authError('Email not confirmed'))).toContain('confirmaste');
  });

  it('traduce usuario ya registrado', () => {
    expect(describeAuthError(authError('User already registered'))).toContain('Ya existe');
  });

  it('cae a un mensaje genérico ante un error desconocido', () => {
    expect(describeAuthError(authError('some_unmapped_supabase_code'))).toBe(
      'Algo salió mal. Probá de nuevo en un momento.',
    );
  });

  it('no es sensible a mayúsculas', () => {
    expect(describeAuthError(authError('INVALID LOGIN CREDENTIALS'))).toBe(
      'Email o contraseña incorrectos.',
    );
  });
});
