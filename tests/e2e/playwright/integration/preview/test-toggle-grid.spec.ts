import test, { expect } from "@playwright/test";
import {
  enableVisibleGrid,
  expectHasClass,
  expectHasNotClass,
  gridFromRows,
  openEditor,
  readGridLines,
  setPiskelFromGrid,
} from "../../testutils";

const GRID_BUTTON_SELECTOR = '.toggle-grid-button';
const ACTIVE_GRID_BUTTON_CLASS = 'icon-minimap-grid-gold';
const INACTIVE_GRID_BUTTON_CLASS = 'icon-minimap-grid-white';

/** An empty 10x10 sprite: a visible grid draws 9 lines across it */
const EMPTY = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test('Test toggling the grid using the animated preview toggle grid icon', { tag: ['@preview.toggle-grid', '@canvas.grid'] }, async ({ page }) => {
  // The grid is off by default.
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await expectHasClass(page, GRID_BUTTON_SELECTOR, INACTIVE_GRID_BUTTON_CLASS);
  await expectHasNotClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);

  // Turn it on with a visible color in the preferences, as its default color is
  // transparent. The button follows.
  await enableVisibleGrid(page);
  await page.locator('[data-setting="user"]').click();
  await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [1] });
  await expectHasClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);

  // The icon turns it off: the lines go away.
  await page.click(GRID_BUTTON_SELECTOR);
  await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 0, widths: [] });
  await expectHasClass(page, GRID_BUTTON_SELECTOR, INACTIVE_GRID_BUTTON_CLASS);
  await expectHasNotClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);

  // The icon turns it back on.
  await page.click(GRID_BUTTON_SELECTOR);
  await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [1] });
  await expectHasClass(page, GRID_BUTTON_SELECTOR, ACTIVE_GRID_BUTTON_CLASS);
  await expectHasNotClass(page, GRID_BUTTON_SELECTOR, INACTIVE_GRID_BUTTON_CLASS);
});
