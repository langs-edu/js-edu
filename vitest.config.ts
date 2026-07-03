import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/engine/runner/**', 'scripts/lib/**'],
      exclude: [
        'src/engine/runner/**/*.test.ts',
        'src/engine/runner/sandbox.worker.ts',
        'scripts/lib/**/*.test.mjs',
        'scripts/lib/run-process.mjs',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
