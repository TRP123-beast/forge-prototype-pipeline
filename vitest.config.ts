import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/smoke/**', 'node_modules/**', 'runs/**'],
    environment: 'node',
    globals: false,
  },
});
