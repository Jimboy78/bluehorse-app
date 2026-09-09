import { beforeEach, describe, expect, it, vi } from 'vitest';
import { markInstallDismissed, readInstallDismissed, shouldInvite } from './install-invite.ts';

/**
 * La decisión de ofrecer o no la instalación, sin renderizar nada. Las dos
 * cosas que importan: no ofrecer algo que ya está hecho, y no volver a
 * preguntar lo que ya se contestó.
 */

describe('shouldInvite', () => {
  it('ya instalada: no se ofrece nada', () => {
    expect(shouldInvite({ standalone: true, dismissed: false })).toBe(false);
  });

  it('ya instalada, aunque nunca la haya cerrado', () => {
    expect(shouldInvite({ standalone: true, dismissed: true })).toBe(false);
  });

  it('ya dijo que no: no se insiste', () => {
    expect(shouldInvite({ standalone: false, dismissed: true })).toBe(false);
  });

  it('en el navegador y sin haberla visto: se ofrece', () => {
    expect(shouldInvite({ standalone: false, dismissed: false })).toBe(true);
  });
});

describe('la preferencia guardada', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('arranca sin nada guardado', () => {
    expect(readInstallDismissed()).toBe(false);
  });

  it('lo que se marca se lee después', () => {
    markInstallDismissed();
    expect(readInstallDismissed()).toBe(true);
  });

  it('sin storage (modo privado) se falla hacia ofrecerla, no hacia romperse', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    expect(readInstallDismissed()).toBe(false);
  });

  it('si no se puede guardar, no explota: la invitación vuelve la próxima vez', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage bloqueado');
    });
    expect(() => markInstallDismissed()).not.toThrow();
  });
});
