import { defineConfig } from '@playwright/test';

const baseUrl = 'http://localhost:9001';

export default defineConfig({
  outputDir: 'tests/e2e/playwright/tmp',
  snapshotPathTemplate: '{testDir}/{testFileDir}/snapshots/{arg}{ext}',
  retries: 3,

  projects: [
    {
      name: 'integration',
      testDir: 'tests/e2e/playwright/integration',
    },
    {
      // Committed baselines come only from the pinned Linux container on CI.
      // VISUAL_LOCAL=1 compares against a gitignored directory instead, to
      // write and review states on a machine with different fonts.
      name: 'visual',
      testDir: 'tests/e2e/playwright/visual',
      snapshotPathTemplate: process.env.VISUAL_LOCAL
        ? 'tests/e2e/playwright/tmp-visual-local/{testFileDir}/{arg}{ext}'
        : '{testDir}/{testFileDir}/snapshots/{arg}{ext}',
      // A retry would hide an unstable screenshot.
      retries: 0,
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        timezoneId: 'UTC',
        locale: 'en-US',
      },
      expect: {
        toHaveScreenshot: {
          animations: 'disabled',
          caret: 'hide',
          maxDiffPixels: 0,
          threshold: 0,
        },
      },
    },
  ],

  // Run a local server before starting the tests
  webServer: {
    command: 'npm run start:test',
    url: baseUrl,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
  },

  use: {
    baseURL: baseUrl
  },
});