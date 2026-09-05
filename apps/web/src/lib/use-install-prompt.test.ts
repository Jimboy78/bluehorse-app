import { describe, expect, it } from 'vitest';
import { detectPlatform } from './use-install-prompt.ts';

const IOS_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const IOS_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0 Mobile/15E148 Safari/604.1';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36';
const DESKTOP_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

describe('detectPlatform', () => {
  it('reconoce Safari en iOS: no tiene instalación programática', () => {
    expect(detectPlatform(IOS_SAFARI)).toBe('ios');
  });

  it('Chrome en iOS no cuenta como "ios": usa el motor de Safari igual, pero sin el share sheet nativo esperado', () => {
    expect(detectPlatform(IOS_CHROME)).toBe('other');
  });

  it('reconoce Android/Chrome: acá sí hay beforeinstallprompt', () => {
    expect(detectPlatform(ANDROID_CHROME)).toBe('android-chrome');
  });

  it('desktop cae en "other": instrucciones genéricas', () => {
    expect(detectPlatform(DESKTOP_CHROME)).toBe('other');
  });
});
