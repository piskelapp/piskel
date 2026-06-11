import { defineConfig } from '@playwright/test';

const baseUrl = 'http://localhost:9001';

export default defineConfig({
  testDir: 'tests/e2e/playwright',
  outputDir: 'tests/e2e/playwright/tmp',
  retries: 5,

  // Run a local server before starting the tests
  webServer: {
    command: 'npm run prod:test',
    url: baseUrl,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  use: {
    baseURL: baseUrl
  },
});