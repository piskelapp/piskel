import test, { expect, Page } from "@playwright/test";
import {
  expectDefaultResizeValues,
  expectResizeValues,
  openEditor,
  openResizeSettingsPanel,
  setPiskelFromGrid,
  gridFromColorRows,
  assertColorRows,
  assertSpriteSize,
  isSettingsDrawerExpanded,
} from "../../testutils";

/** A 2x2 sprite, small so that the 4x4 result of each anchor reads at a glance */
const DIAGONAL = [
  'B.',
  '.B',
];

/** Open the resize panel, type a size, pick an anchor, and resize */
async function resizeWithAnchor(
  page: Page, width: string, height: string, origin: string
) {
  await openResizeSettingsPanel(page);
  // Uncheck the ratio, to type the width and the height.
  await page.locator('.resize-ratio-checkbox').uncheck();
  await page.locator('[name="resize-width"]').fill(width);
  await page.locator('[name="resize-height"]').fill(height);
  await page.click(`[data-origin="${origin}"]`);
  await expect(page.locator(`[data-origin="${origin}"].selected`)).toBeAttached();
  await page.click('.resize-button');
}

test.describe('Resize panel — anchor origins', () => {

  // All tests: start with 2x2 diagonal pattern, resize to 4x4 with different anchors

  test('TOP anchor should center content at top', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'TOP');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '.B..',
      '..B.',
      '....',
      '....',
    ]);
  });

  test('TOPRIGHT anchor should place content at top-right', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'TOPRIGHT');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '..B.',
      '...B',
      '....',
      '....',
    ]);
  });

  test('MIDDLELEFT anchor should place content at middle-left', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'MIDDLELEFT');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '....',
      'B...',
      '.B..',
      '....',
    ]);
  });

  test('MIDDLE anchor should center content', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'MIDDLE');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '....',
      '.B..',
      '..B.',
      '....',
    ]);
  });

  test('MIDDLERIGHT anchor should place content at middle-right', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'MIDDLERIGHT');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '....',
      '..B.',
      '...B',
      '....',
    ]);
  });

  test('BOTTOMLEFT anchor should place content at bottom-left', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'BOTTOMLEFT');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '....',
      '....',
      'B...',
      '.B..',
    ]);
  });

  test('BOTTOM anchor should center content at bottom', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await resizeWithAnchor(page, '4', '4', 'BOTTOM');

    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      '....',
      '....',
      '.B..',
      '..B.',
    ]);
  });
});

test.describe('Resize panel — ratio and content checkboxes', () => {

  test('maintain ratio should sync width/height for non-square canvas', { tag: ['@settings.resize-ratio'] }, async ({ page }) => {
    await openEditor(page);
    // Start with a 4x2 canvas
    await setPiskelFromGrid(page, gridFromColorRows([
      'R...',
      '...R',
    ]));

    await openResizeSettingsPanel(page);
    await expectResizeValues(page, '4', '2');

    // Ratio is checked by default — changing width should update height proportionally
    await page.locator('[name="resize-width"]').fill('8');
    await expectResizeValues(page, '8', '4');

    await page.click('.resize-button');

    // Content stays at top-left (default TOPLEFT anchor), canvas expanded
    await assertSpriteSize(page, 8, 4);
    await assertColorRows(page, [
      'R.......',
      '...R....',
      '........',
      '........',
    ]);
  });

  test('unchecking ratio should allow independent width/height', { tag: ['@settings.resize-ratio'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(DIAGONAL));

    await openResizeSettingsPanel(page);

    await page.locator('.resize-ratio-checkbox').uncheck();
    await page.locator('[name="resize-width"]').fill('6');
    await page.locator('[name="resize-height"]').fill('3');
    await expectResizeValues(page, '6', '3');

    await page.click('.resize-button');

    // 2x2 content at top-left of 6x3 canvas
    await assertSpriteSize(page, 6, 3);
    await assertColorRows(page, [
      'B.....',
      '.B....',
      '......',
    ]);
  });

  test('resize content checkbox should disable anchor widget', { tag: ['@settings.resize-anchor'] }, async ({ page }) => {
    await openEditor(page);
    await openResizeSettingsPanel(page);

    const anchorWrapper = page.locator('.anchor-wrapper');
    const contentCheckbox = page.locator('.resize-content-checkbox');

    // Anchor should be enabled by default
    await expect(anchorWrapper).not.toHaveClass(/disabled/);

    // Check resize content — anchor should become disabled
    await contentCheckbox.check();
    await expect(anchorWrapper).toHaveClass(/disabled/);

    // Uncheck — anchor should be re-enabled
    await contentCheckbox.uncheck();
    await expect(anchorWrapper).not.toHaveClass(/disabled/);
  });

  test('resize content should scale pixels proportionally', { tag: ['@settings.resize-content'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'R.',
      '.R',
    ]));

    await openResizeSettingsPanel(page);
    await page.locator('.resize-content-checkbox').check();
    await page.locator('[name="resize-width"]').fill('4');
    await expectResizeValues(page, '4', '4');
    await page.click('.resize-button');

    // 2x2 → 4x4 with content scaling: each pixel becomes a 2x2 block
    await assertSpriteSize(page, 4, 4);
    await assertColorRows(page, [
      'RR..',
      'RR..',
      '..RR',
      '..RR',
    ]);
  });

  test('shrinking canvas should clip content', { tag: ['@settings.resize'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RG..',
      'BR..',
      '....',
      '....',
    ]));

    await openResizeSettingsPanel(page);
    await page.locator('.resize-ratio-checkbox').uncheck();
    await page.locator('[name="resize-width"]').fill('2');
    await page.locator('[name="resize-height"]').fill('2');
    await page.click('.resize-button');

    // Content at top-left should be preserved, rest clipped
    await assertSpriteSize(page, 2, 2);
    await assertColorRows(page, [
      'RG',
      'BR',
    ]);
  });

  test('changing default size should persist after reload', { tag: ['@settings.default-size'] }, async ({ page }) => {
    await openEditor(page);
    await openResizeSettingsPanel(page);

    // Verify initial default is 32x32
    await expectDefaultResizeValues(page, '32', '32');

    // Change default size to 64x48: saving it closes the panel.
    await page.locator('[name="default-width"]').fill('64');
    await page.locator('[name="default-height"]').fill('48');
    await page.click('.default-size-button');
    await expect.poll(() => isSettingsDrawerExpanded(page)).toBe(false);

    // Reload the page
    await openEditor(page);

    // Reopen resize panel and verify the default size persisted
    await openResizeSettingsPanel(page);
    await expectDefaultResizeValues(page, '64', '48');

    // The new sprite has the new default size.
    await assertSpriteSize(page, 64, 48);
  });
});
