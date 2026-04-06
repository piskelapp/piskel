import { test as base, expect } from '@playwright/test';
import type { Page, Locator, Download } from '@playwright/test';

const withCoverage = !!process.env.COVERAGE;

const test = withCoverage
  ? base.extend<{ autoTestFixture: string }>({
      autoTestFixture: [async ({ page }, use) => {
        const { addCoverageReport } = await import('monocart-reporter');
        await page.coverage.startJSCoverage({ resetOnNavigation: false });
        await use('autoTestFixture');
        const coverage = await page.coverage.stopJSCoverage();
        await addCoverageReport(coverage, test.info());
      }, { scope: 'test', auto: true }]
    })
  : base;

export { test, expect };
export type { Page, Locator, Download };
export default test;
