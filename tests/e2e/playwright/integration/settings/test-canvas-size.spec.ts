import test, { expect } from '../../fixtures';
import {
  expectGrid,
  expectDefaultResizeValues,
  expectResizeValues,
  getCurrentPiskelHeight,
  getCurrentPiskelWidth,
  openEditor,
  openResizeSettingsPanel,
  setPiskelFromGrid,
  wait,
} from "../../testutils";

/** Resize helper: open panel, set size, pick anchor, click resize */
async function resizeWithAnchor(
  page: any, width: string, height: string, origin: string
) {
  await openResizeSettingsPanel(page);
  // Uncheck ratio to allow independent width/height
  const ratioCheckbox = page.locator('.resize-ratio-checkbox');
  if (await ratioCheckbox.isChecked()) {
    await ratioCheckbox.uncheck();
  }
  await page.locator('[name="resize-width"]').fill(width);
  await page.locator('[name="resize-height"]').fill(height);
  await page.click(`[data-origin="${origin}"]`);
  await expect(page.locator(`[data-origin="${origin}"].selected`)).toBeAttached();
  await page.click('.resize-button');
  await wait(300);
}

test.describe('Resize panel — anchor origins', () => {

  // All tests: start with 2x2 diagonal pattern, resize to 4x4 with different anchors

  test('TOP anchor should center content at top', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'TOP');

    expect(await expectGrid(page,
      [['T', 'B', 'T', 'T'],
       ['T', 'T', 'B', 'T'],
       ['T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('TOPRIGHT anchor should place content at top-right', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'TOPRIGHT');

    expect(await expectGrid(page,
      [['T', 'T', 'B', 'T'],
       ['T', 'T', 'T', 'B'],
       ['T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('MIDDLELEFT anchor should place content at middle-left', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'MIDDLELEFT');

    expect(await expectGrid(page,
      [['T', 'T', 'T', 'T'],
       ['B', 'T', 'T', 'T'],
       ['T', 'B', 'T', 'T'],
       ['T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('MIDDLE anchor should center content', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'MIDDLE');

    expect(await expectGrid(page,
      [['T', 'T', 'T', 'T'],
       ['T', 'B', 'T', 'T'],
       ['T', 'T', 'B', 'T'],
       ['T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('MIDDLERIGHT anchor should place content at middle-right', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'MIDDLERIGHT');

    expect(await expectGrid(page,
      [['T', 'T', 'T', 'T'],
       ['T', 'T', 'B', 'T'],
       ['T', 'T', 'T', 'B'],
       ['T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('BOTTOMLEFT anchor should place content at bottom-left', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'BOTTOMLEFT');

    expect(await expectGrid(page,
      [['T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T'],
       ['B', 'T', 'T', 'T'],
       ['T', 'B', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('BOTTOM anchor should center content at bottom', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await resizeWithAnchor(page, '4', '4', 'BOTTOM');

    expect(await expectGrid(page,
      [['T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T'],
       ['T', 'B', 'T', 'T'],
       ['T', 'T', 'B', 'T']], 0, 0)).toBe(true);
  });
});

test.describe('Resize panel — ratio and content checkboxes', () => {

  test('maintain ratio should sync width/height for non-square canvas', async ({ page }) => {
    await openEditor(page);
    // Start with a 4x2 canvas
    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'R'],
    ]);

    await openResizeSettingsPanel(page);
    await expectResizeValues(page, '4', '2');

    // Ratio is checked by default — changing width should update height proportionally
    await page.locator('[name="resize-width"]').fill('8');
    await expectResizeValues(page, '8', '4');

    await page.click('.resize-button');
    await wait(300);

    // Content stays at top-left (default TOPLEFT anchor), canvas expanded
    expect(await expectGrid(page,
      [['R', 'T', 'T', 'T', 'T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'R', 'T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T', 'T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T', 'T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('unchecking ratio should allow independent width/height', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['B', 'T'], ['T', 'B']]);

    await openResizeSettingsPanel(page);

    await page.locator('.resize-ratio-checkbox').uncheck();
    await page.locator('[name="resize-width"]').fill('6');
    await page.locator('[name="resize-height"]').fill('3');
    await expectResizeValues(page, '6', '3');

    await page.click('.resize-button');
    await wait(300);

    // 2x2 content at top-left of 6x3 canvas
    expect(await expectGrid(page,
      [['B', 'T', 'T', 'T', 'T', 'T'],
       ['T', 'B', 'T', 'T', 'T', 'T'],
       ['T', 'T', 'T', 'T', 'T', 'T']], 0, 0)).toBe(true);
  });

  test('resize content checkbox should disable anchor widget', async ({ page }) => {
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

  test('resize content should scale pixels proportionally', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['R', 'T'], ['T', 'R']]);

    await openResizeSettingsPanel(page);
    await page.locator('.resize-content-checkbox').check();
    await page.locator('[name="resize-width"]').fill('4');
    await expectResizeValues(page, '4', '4');
    await page.click('.resize-button');
    await wait(300);

    // 2x2 → 4x4 with content scaling: each pixel becomes a 2x2 block
    expect(await expectGrid(page,
      [['R', 'R', 'T', 'T'],
       ['R', 'R', 'T', 'T'],
       ['T', 'T', 'R', 'R'],
       ['T', 'T', 'R', 'R']], 0, 0)).toBe(true);
  });

  test('shrinking canvas should clip content', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'G', 'T', 'T'],
      ['B', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openResizeSettingsPanel(page);
    await page.locator('.resize-ratio-checkbox').uncheck();
    await page.locator('[name="resize-width"]').fill('2');
    await page.locator('[name="resize-height"]').fill('2');
    await page.click('.resize-button');
    await wait(300);

    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);

    // Content at top-left should be preserved, rest clipped
    expect(await expectGrid(page,
      [['R', 'G'],
       ['B', 'R']], 0, 0)).toBe(true);
  });

  test('changing default size should persist after reload', async ({ page }) => {
    await openEditor(page);
    await openResizeSettingsPanel(page);

    // Verify initial default is 32x32
    await expectDefaultResizeValues(page, '32', '32');

    // Change default size to 64x48
    await page.locator('[name="default-width"]').fill('64');
    await page.locator('[name="default-height"]').fill('48');
    await page.click('.default-size-button');
    await wait(300);

    // Reload the page
    await openEditor(page);

    // Reopen resize panel and verify the default size persisted
    await openResizeSettingsPanel(page);
    await expectDefaultResizeValues(page, '64', '48');

    // Also verify the new piskel was created with the new default size
    expect(await getCurrentPiskelWidth(page)).toBe(64);
    expect(await getCurrentPiskelHeight(page)).toBe(48);
  });
});
