import { defineConfig, devices } from '@playwright/test';

const PROTOTYPE_URL = process.env.PROTOTYPE_URL;

if (!PROTOTYPE_URL) {
  console.warn(
    '\n[playwright] PROTOTYPE_URL is not set. Smoke tests will be skipped.\n' +
      'Set it to a deployed prototype URL before running:\n' +
      '  PROTOTYPE_URL=https://my-proto.vercel.app npm run test:smoke\n',
  );
}

export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: PROTOTYPE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
