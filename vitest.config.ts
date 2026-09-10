import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

const alias = {
  '@bh/domain': `${root}packages/domain/src/index.ts`,
  '@bh/engine': `${root}packages/engine/src/index.ts`,
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'domain',
          root: './packages/domain',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'engine',
          root: './packages/engine',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // La matriz del motor: corre el motor real sobre el catálogo real para
        // una tanda de perfiles, chequea las invariantes de las reglas duras y
        // escribe `tools/reportes/` para poder comparar dos rulesets.
        //
        // Es un proyecto de vitest y no un script suelto porque el motor es
        // TypeScript y Node 22.3 no lo importa sin transpilar — y porque estas
        // invariantes tienen que correr en `npm run check`, no cuando alguien
        // se acuerde de correrlas.
        resolve: { alias },
        test: {
          name: 'tools',
          root: './tools',
          environment: 'node',
          include: ['*.test.ts'],
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'web',
          root: './apps/web',
          environment: 'happy-dom',
          include: ['src/**/*.test.{ts,tsx}'],
          // happy-dom no trae IndexedDB: la cola offline (Dexie) lo necesita
          // para poder correr sus tests sin un navegador real.
          setupFiles: ['fake-indexeddb/auto'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/rulesets/**'],
    },
  },
});
