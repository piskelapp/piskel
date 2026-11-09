import { createRequire } from 'node:module';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const require = createRequire(import.meta.url);
const { vendors } = require('./src/vendor-list.js');

export default defineConfig({
  define: {
    __PISKEL_VENDORS__: JSON.stringify(vendors)
  },
  test: {
    include: ['tests/unit-tests/**/*Test*.ts'],
    exclude: ['tests/unit-tests/testutils/**'],
    // Spies are removed after each test, as they were with Jasmine.
    restoreMocks: true,
    setupFiles: ['tests/unit-tests/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      screenshotFailures: false
    }
  }
});
