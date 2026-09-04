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
        resolve: { alias },
        test: {
          name: 'web',
          root: './apps/web',
          environment: 'happy-dom',
          include: ['src/**/*.test.{ts,tsx}'],
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
