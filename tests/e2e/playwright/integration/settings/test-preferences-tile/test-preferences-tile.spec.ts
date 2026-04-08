import test, { expect, Page } from '../../../fixtures';
import { openEditor, setPiskelFromGrid, wait } from "../../../testutils";

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

test.describe('Preferences — Tile tab', () => {

  // ─── Seamless / tile mode toggle ──────────────────────────────

  test('tile mode should be disabled by default', async ({ page }) => {
    await openEditor(page);
    await openTilePreferences(page);

    const checkbox = page.locator('.tile-mode-checkbox');
    await expect(checkbox).not.toBeChecked();
  });

  test('canvas without tile mode', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openTilePreferences(page);
    await wait(300);

    await expect(canvas(page)).toHaveScreenshot('tile-mode-off.png', screenshotOpts);
  });

  test('enabling tile mode should tile the sprite around the canvas', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openTilePreferences(page);
    await page.locator('.tile-mode-checkbox').check();
    await wait(500);

    await expect(canvas(page)).toHaveScreenshot('tile-mode-on.png', screenshotOpts);
  });

  test('disabling tile mode should restore canvas to original', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openTilePreferences(page);

    // Enable then disable
    await page.locator('.tile-mode-checkbox').check();
    await wait(500);
    await page.locator('.tile-mode-checkbox').uncheck();
    await wait(500);

    // Should match the "off" golden screenshot
    await expect(canvas(page)).toHaveScreenshot('tile-mode-off.png', screenshotOpts);
  });

  // ─── Tile mask opacity slider ─────────────────────────────────

  test('tile mask opacity should default to 0.30', async ({ page }) => {
    await openEditor(page);
    await openTilePreferences(page);

    const slider = page.locator('.tile-mask-opacity-input');
    const value = await slider.inputValue();
    expect(parseFloat(value)).toBeCloseTo(0.30, 1);

    const text = await page.locator('.tile-mask-opacity-text').innerText();
    expect(text).toContain('0.30');
  });

  test('changing tile mask opacity should update the display text', async ({ page }) => {
    await openEditor(page);
    await openTilePreferences(page);

    await page.evaluate(() => {
      const slider = document.querySelector('.tile-mask-opacity-input') as HTMLInputElement;
      slider.value = '0.10';
      slider.dispatchEvent(new Event('input'));
      slider.dispatchEvent(new Event('change'));
    });
    await wait(200);

    const text = await page.locator('.tile-mask-opacity-text').innerText();
    expect(text).toContain('0.10');
  });

  test('tile mode with default opacity 0.30', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'R', 'T', 'T'],
      ['R', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openTilePreferences(page);
    await page.locator('.tile-mode-checkbox').check();
    await wait(500);

    await expect(canvas(page)).toHaveScreenshot('tile-opacity-030.png', screenshotOpts);
  });

  test('tile mode with opacity 0.05 should show more visible tiles', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'R', 'T', 'T'],
      ['R', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openTilePreferences(page);
    await page.locator('.tile-mode-checkbox').check();
    await wait(300);

    await page.evaluate(() => {
      const slider = document.querySelector('.tile-mask-opacity-input') as HTMLInputElement;
      slider.value = '0.05';
      slider.dispatchEvent(new Event('input'));
      slider.dispatchEvent(new Event('change'));
    });
    await wait(500);

    await expect(canvas(page)).toHaveScreenshot('tile-opacity-005.png', screenshotOpts);
  });
});
