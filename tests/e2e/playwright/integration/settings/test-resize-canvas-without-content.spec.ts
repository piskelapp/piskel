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

test('Test resize the canvas without resizing the content', { tag: ['@settings.resize'] }, async ({ page }) => {
  // The resize panel shows the size of the sprite, with the ratio kept by default.
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));
  await openResizeSettingsPanel(page);
  await expectResizeValues(page, "2", "2");
  await expect(page.locator('.resize-ratio-checkbox')).toBeChecked();

  // Type a width of 4: the height follows. Resize, which closes the panel.
  await page.locator('[name="resize-width"]').fill("4");
  await expectResizeValues(page, "4", "4");
  await page.click('.resize-button');
  expect(await isSettingsDrawerExpanded(page)).toBe(false);

  // The pixels keep their size and stay at the top left.
  await assertSpriteSize(page, 4, 4);
  await assertColorRows(page, [
    'B...',
    '.B..',
    '....',
    '....',
  ]);
});
