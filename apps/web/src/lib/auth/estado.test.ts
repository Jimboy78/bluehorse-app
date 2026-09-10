import { describe, expect, it } from 'vitest';
import { estadoDeSesion, haySesionGuardada } from './estado.ts';

function entrada(over: Partial<Parameters<typeof estadoDeSesion>[0]> = {}) {
  return { configurado: true, cargando: false, haySesion: false, falloAlConsultar: false, ...over };
}

describe('estadoDeSesion', () => {
  it('sin Supabase configurado, no se puede saber nada', () => {
    expect(estadoDeSesion(entrada({ configurado: false }))).toBe('unconfigured');
  });

  it('mientras se resuelve, es "cargando"', () => {
    expect(estadoDeSesion(entrada({ cargando: true }))).toBe('loading');
  });

  it('con sesión, adentro', () => {
    expect(estadoDeSesion(entrada({ haySesion: true }))).toBe('signed-in');
  });

  it('sin sesión y sin error, la persona cerró sesión', () => {
    expect(estadoDeSesion(entrada())).toBe('signed-out');
  });

  it('sin sesión PERO con error, no es que cerró sesión: no se pudo confirmar', () => {
    // Medido con el servidor apagado: `getSession()` devuelve `session: null`
    // y `error: "Failed to fetch"` con el token todavía guardado. Mandar a esa
    // persona al login es decirle "no sos vos" — y el login necesita el mismo
    // servidor que no contesta.
    expect(estadoDeSesion(entrada({ falloAlConsultar: true }))).toBe('sin-confirmar');
  });

  it('un error que llega tarde no pisa una sesión que sí se pudo leer', () => {
    expect(estadoDeSesion(entrada({ haySesion: true, falloAlConsultar: true }))).toBe('signed-in');
  });
});

/** Un almacenamiento de mentira, con solo lo que `haySesionGuardada` usa. */
function almacen(pares: Record<string, string>) {
  const claves = Object.keys(pares);
  return {
    length: claves.length,
    key: (i: number) => claves[i] ?? null,
    getItem: (k: string) => pares[k] ?? null,
  };
}

describe('haySesionGuardada', () => {
  it('reconoce la sesión que deja supabase-js', () => {
    const guardado = JSON.stringify({ user: { id: 'u1' }, expires_at: 1 });
    expect(haySesionGuardada(almacen({ 'sb-127-auth-token': guardado }))).toBe(true);
  });

  it('sin nada guardado, la persona cerró sesión de verdad', () => {
    expect(haySesionGuardada(almacen({}))).toBe(false);
  });

  it('ignora otras claves del mismo navegador', () => {
    expect(haySesionGuardada(almacen({ 'sb-127-otra-cosa': '{"user":{"id":"u1"}}' }))).toBe(false);
  });

  it('una clave ilegible no cuenta como sesión', () => {
    expect(haySesionGuardada(almacen({ 'sb-127-auth-token': 'no es json' }))).toBe(false);
  });

  it('una sesión sin usuario adentro tampoco', () => {
    expect(haySesionGuardada(almacen({ 'sb-127-auth-token': '{"expires_at":1}' }))).toBe(false);
  });
});
