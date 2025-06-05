import { test, expect } from '@playwright/test';

const drawingDoneSelector = '#drawing-test-result';

export const executeTest = (testName) => {
  test(`Execute '${testName}' test`, async ({ page }) => {
    const testFilePath = `drawing/tests/${testName}`;
    await page.goto('/?test-run=' + testFilePath);
    await page.waitForSelector(drawingDoneSelector, { state: 'attached', timeout: 30000 });
    const resultElement = page.locator(drawingDoneSelector);
    await expect(resultElement).toHaveText('OK');
  })
}