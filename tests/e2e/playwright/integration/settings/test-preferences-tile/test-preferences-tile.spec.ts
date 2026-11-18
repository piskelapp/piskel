import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  setPiskelFromGrid,
  gridFromColorRows,
} from "../../../testutils";

test.use({ viewport: { width: 1280, height: 720 } });

/** Open the preferences panel and switch to the Tile tab */
async function openTilePreferences(page: Page) {
  await page.locator('[data-setting="user"]').click();
  await expect(page.locator('.settings-section-preferences')).toBeAttached();
  await page.locator('[data-tab-id="tile"]').click();
  await expect(page.locator('.preferences-panel-tile')).toBeAttached();
}

const canvas = (page: Page) => page.locator('#drawing-canvas-container');

const screenshotOpts = { maxDiffPixelRatio: 0.01 };

/** 4x4 sprites: the screenshots of the canvas were taken with them */
const RED_PIXEL = [
  'R...',
  '....',
  '....',
  '....',
];
const RED_BLOCK = [
  'RR..',
  'RR..',
  '....',
  '....',
];

test.describe('Preferences — Tile tab', () => {

  // ─── Seamless / tile mode toggle ──────────────────────────────

  test('tile mode should be disabled by default', { tag: ['@settings.tile-mode'] }, async ({ page }) => {
    await openEditor(page);
    await openTilePreferences(page);

    const checkbox = page.locator('.tile-mode-checkbox');
    await expect(checkbox).not.toBeChecked();
  });

  test('canvas without tile mode', { tag: ['@canvas.tile-mode'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));

    await openTilePreferences(page);

    await expect(canvas(page)).toHaveScreenshot('tile-mode-off.png', screenshotOpts);
  });

  test('enabling tile mode should tile the sprite around the canvas', { tag: ['@settings.tile-mode', '@canvas.tile-mode'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));

    await openTilePreferences(page);
    await page.locator('.tile-mode-checkbox').check();

    await expect(canvas(page)).toHaveScreenshot('tile-mode-on.png', screenshotOpts);
  });

  test('disabling tile mode should restore canvas to original', { tag: ['@settings.tile-mode', '@canvas.tile-mode'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));

    await openTilePreferences(page);

    // Enable then disable
    await page.locator('.tile-mode-checkbox').check();
    await expect(canvas(page)).toHaveScreenshot('tile-mode-on.png', screenshotOpts);
    await page.locator('.tile-mode-checkbox').uncheck();

    // Should match the "off" golden screenshot
    await expect(canvas(page)).toHaveScreenshot('tile-mode-off.png', screenshotOpts);
  });

  // ─── Tile mask opacity slider ─────────────────────────────────

  test('tile mask opacity should default to 0.30', { tag: ['@settings.tile-opacity'] }, async ({ page }) => {
    await openEditor(page);
    await openTilePreferences(page);

    await expect(page.locator('.tile-mask-opacity-input')).toHaveValue('0.3');
    await expect(page.locator('.tile-mask-opacity-text')).toContainText('0.30');
  });

  test('changing tile mask opacity should update the display text', { tag: ['@settings.tile-opacity'] }, async ({ page }) => {
    await openEditor(page);
    await openTilePreferences(page);

    await page.locator('.tile-mask-opacity-input').fill('0.1');
    await expect(page.locator('.tile-mask-opacity-text')).toContainText('0.10');
  });

  test('tile mode with default opacity 0.30', { tag: ['@settings.tile-opacity', '@canvas.tile-mode'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, gridFromColorRows(RED_BLOCK));

    await openTilePreferences(page);
    await page.locator('.tile-mode-checkbox').check();

    await expect(canvas(page)).toHaveScreenshot('tile-opacity-030.png', screenshotOpts);
  });

  test('tile mode with opacity 0.05 should show more visible tiles', { tag: ['@settings.tile-opacity', '@canvas.tile-mode'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, gridFromColorRows(RED_BLOCK));

    await openTilePreferences(page);
    await page.locator('.tile-mode-checkbox').check();

    await page.locator('.tile-mask-opacity-input').fill('0.05');
    await expect(page.locator('.tile-mask-opacity-text')).toContainText('0.05');

    await expect(canvas(page)).toHaveScreenshot('tile-opacity-005.png', screenshotOpts);
  });
});
