import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  assertSpriteSize,
  expectResizeValues,
  gridFromColorRows,
  isSettingsDrawerExpanded,
  openEditor,
  openResizeSettingsPanel,
  setPiskelFromGrid,
} from "../../testutils";

/** A 2x2 sprite, small so that the sprite resized to 4x4 still reads at a glance */
const DIAGONAL = [
  'B.',
  '.B',
];

test('Test resize the canvas and anchor in the right corner', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));
  await openResizeSettingsPanel(page);
  await expectResizeValues(page, "2", "2");
  await expect(page.locator('.resize-ratio-checkbox')).toBeChecked();

  // Type a width of 4: the height follows.
  await page.locator('[name="resize-width"]').fill("4");
  await expectResizeValues(page, "4", "4");

  // The anchor is at the top left by default. Pick the bottom right one, and resize.
  await expect(page.locator('[data-origin="TOPLEFT"].selected')).toBeAttached();
  await page.click('[data-origin="BOTTOMRIGHT"]');
  await expect(page.locator('[data-origin="BOTTOMRIGHT"].selected')).toBeAttached();
  await page.click('.resize-button');
  expect(await isSettingsDrawerExpanded(page)).toBe(false);

  // The pixels moved to the bottom right.
  await assertSpriteSize(page, 4, 4);
  await assertColorRows(page, [
    '....',
    '....',
    '..B.',
    '...B',
  ]);
});
