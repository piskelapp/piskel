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

test('Test resize the canvas and resize the content', { tag: ['@settings.resize-content'] }, async ({ page }) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));
  await openResizeSettingsPanel(page);
  await expectResizeValues(page, "2", "2");
  await expect(page.locator('.resize-ratio-checkbox')).toBeChecked();

  // Resizing the content is off by default, with the anchor enabled. Turning it on
  // disables the anchor, which no longer applies.
  const resizeContentCheckbox = page.locator('.resize-content-checkbox');
  await expect(resizeContentCheckbox).not.toBeChecked();
  await expect(page.locator('.anchor-wrapper')).not.toContainClass("disabled");
  await resizeContentCheckbox.click();
  await expect(resizeContentCheckbox).toBeChecked();
  await expect(page.locator('.anchor-wrapper')).toContainClass("disabled");

  // Resize to 4x4, which closes the panel.
  await page.locator('[name="resize-width"]').fill("4");
  await expectResizeValues(page, "4", "4");
  await page.click('.resize-button');
  expect(await isSettingsDrawerExpanded(page)).toBe(false);

  // Each pixel became a 2x2 block.
  await assertSpriteSize(page, 4, 4);
  await assertColorRows(page, [
    'BB..',
    'BB..',
    '..BB',
    '..BB',
  ]);
});
