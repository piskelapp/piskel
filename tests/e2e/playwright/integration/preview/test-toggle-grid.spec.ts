import test, { Page, expect } from "@playwright/test";
import { expectHasClass, expectHasNotClass, getRequiredElementBySelector, openEditor } from "../../testutils";

const GRID_BUTTON_CLASS = 'toggle-grid-button';
const GRID_BUTTON_SELECTOR = `.${GRID_BUTTON_CLASS}`;
const ACTIVE_GRID_BUTTON_CLASS = 'icon-minimap-grid-gold';
const INACTIVE_GRID_BUTTON_CLASS = 'icon-minimap-grid-white';

const isGridEnabled = async(page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
      return window.pskl.UserSettings.get(window.pskl.UserSettings.GRID_ENABLED) as boolean;
  })
};

test('Test toggling the grid using the animated preview toggle grid icon', async ({ page }) => {
  await openEditor(page);

  expect(await isGridEnabled(page)).toBe(false);
  await expectHasNotClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);
  await expectHasClass(page, GRID_BUTTON_SELECTOR, INACTIVE_GRID_BUTTON_CLASS);

  await page.click(GRID_BUTTON_SELECTOR);
  await expect.poll(() => isGridEnabled(page), {
    timeout: 10000,
    message: 'Grid should be enabled',
  }).toBe(true);

  expect(await isGridEnabled(page)).toBe(true);
  await expectHasClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);
  await expectHasNotClass(page, GRID_BUTTON_SELECTOR, INACTIVE_GRID_BUTTON_CLASS);

  await page.click(GRID_BUTTON_SELECTOR);
  await expect.poll(() => isGridEnabled(page), {
    timeout: 10000,
    message: 'Grid should be disabled',
  }).toBe(false);

  await expectHasNotClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);
  await expectHasClass(page, GRID_BUTTON_SELECTOR, INACTIVE_GRID_BUTTON_CLASS);
});