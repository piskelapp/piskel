import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  isSettingsDrawerExpanded,
  waitFor,
  gridFromColorRows,
  getAddLayerButton,
  assertCurrentLayer,
} from "../../../testutils";

test.use({ viewport: { width: 1280, height: 720 } });

const screenshotOpts = { maxDiffPixelRatio: 0.01 };

/** Open the preferences panel (defaults to Misc tab) */
async function openMiscPreferences(page: Page) {
  await page.locator('[data-setting="user"]').click();
  await expect(page.locator('.settings-section-preferences')).toBeAttached();
  await expect(page.locator('.preferences-panel-misc')).toBeAttached();
}

/** Close the preferences panel and wait for it to collapse */
async function closeMiscPreferences(page: Page) {
  await page.locator('[data-setting="user"]').click();
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
}

const canvas = (page: Page) => page.locator('#drawing-canvas-container');

/** A 4x4 sprite with a red pixel: the screenshots of the canvas were taken with it */
const RED_PIXEL = [
  'R...',
  '....',
  '....',
  '....',
];

/** Open the picker of the primary color, check the value it shows, and close it */
async function assertPrimaryPickerValue(page: Page, value: RegExp) {
  // Remove the tooltips, which can cover the picker.
  await page.evaluate(() => document.querySelectorAll('.tooltip').forEach(t => t.remove()));
  await page.locator('[data-test-id="primary-color-picker"]').locator('..').locator('.sp-replacer').click();
  const input = page.locator('.sp-container:not(.sp-hidden) .sp-input');
  await expect(input).toHaveValue(value);
  await page.evaluate(() => {
    (window as any).$('[data-test-id="primary-color-picker"]').spectrum('hide');
  });
}

test.describe('Preferences — Misc tab', () => {

  // ─── Defaults ──────────────────────────────────────────────────

  test('canvas background should default to lowcont-dark', { tag: ['@settings.background'] }, async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    const selected = page.locator('.background-picker-wrapper [data-background].selected');
    await expect(selected).toHaveAttribute('data-background', 'lowcont-dark-canvas-background');
  });

  test('color format should default to hex', { tag: ['@settings.color-format'] }, async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    await expect(page.locator('.color-format-select')).toHaveValue('hex');
  });

  test('changing color format should affect the color picker display', { tag: ['@settings.color-format', '@colors-and-palettes.picker'] }, async ({ page }) => {
    await openEditor(page);

    // The picker shows the primary color in hex by default.
    await setPrimaryColor(page, '#FF0000');
    await assertPrimaryPickerValue(page, /ff0000/i);

    // Switch to RGB: the picker shows it in RGB.
    await openMiscPreferences(page);
    await page.locator('.color-format-select').selectOption('rgb');
    await closeMiscPreferences(page);
    await assertPrimaryPickerValue(page, /rgb\(255, ?0, ?0\)/);

    // Switch back to hex.
    await openMiscPreferences(page);
    await page.locator('.color-format-select').selectOption('hex');
    await closeMiscPreferences(page);
    await assertPrimaryPickerValue(page, /ff0000/i);
  });

  test('layer preview opacity should default to 0.20', { tag: ['@settings.layer-opacity'] }, async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    await expect(page.locator('.layer-opacity-input')).toHaveValue('0.2');
    await expect(page.locator('.layer-opacity-text')).toContainText('0.20');
  });

  test('max FPS should default to 24', { tag: ['@settings.max-fps'] }, async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    await expect(page.locator('.max-fps-input')).toHaveValue('24');
  });

  test('invalid maximum FPS should preserve the previous limit and animation speed', async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    const fpsInput = page.locator('.max-fps-input');
    await fpsInput.fill('30');
    await fpsInput.dispatchEvent('change');

    for (const value of ['-1', '-30', '0', '', 'abc', '9'.repeat(400)]) {
      await fpsInput.fill(value);
      await fpsInput.dispatchEvent('change');

      await expect(fpsInput).toHaveValue('30');
      await expect(page.locator('#preview-fps')).toHaveAttribute('max', '30');
      expect(await page.evaluate(() => window.pskl.app.piskelController.getFPS())).toBe(12);
    }

    await closeMiscPreferences(page);
    await openMiscPreferences(page);
    await expect(page.locator('.max-fps-input')).toHaveValue('30');
  });

  // ─── Canvas background screenshots ────────────────────────────

  test('default canvas background rendering', { tag: ['@settings.background', '@canvas.background'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));
    await openMiscPreferences(page);

    await expect(canvas(page)).toHaveScreenshot('bg-lowcont-dark.png', screenshotOpts);
  });

  test('changing to light background should update the canvas', { tag: ['@settings.background', '@canvas.background'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));
    await openMiscPreferences(page);

    await page.locator('[data-background="light-canvas-background"]').click();

    await expect(page.locator('[data-background="light-canvas-background"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-background="lowcont-dark-canvas-background"]')).not.toHaveClass(/selected/);
    await expect(canvas(page)).toHaveScreenshot('bg-light.png', screenshotOpts);
  });

  test('changing to medium background should update the canvas', { tag: ['@settings.background', '@canvas.background'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));
    await openMiscPreferences(page);

    await page.locator('[data-background="medium-canvas-background"]').click();

    await expect(page.locator('[data-background="medium-canvas-background"]')).toHaveClass(/selected/);
    await expect(canvas(page)).toHaveScreenshot('bg-medium.png', screenshotOpts);
  });

  // ─── Layer preview opacity screenshots ─────────────────────────

  test('layer preview opacity affects canvas rendering with multiple layers', { tag: ['@settings.layer-opacity', '@layers.preview'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RR..',
      'RR..',
      '....',
      '....',
    ]));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    await openMiscPreferences(page);
    await expect(canvas(page)).toHaveScreenshot('layer-opacity-020.png', screenshotOpts);

    await page.locator('.layer-opacity-input').fill('0');
    await expect(canvas(page)).toHaveScreenshot('layer-opacity-000.png', screenshotOpts);
  });

  // ─── All settings persist after close/reopen ───────────────────

  test('all misc settings should persist after closing and reopening the panel', { tag: ['@settings.persist'] }, async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    // Change all settings to non-default values
    await page.locator('[data-background="light-canvas-background"]').click();
    await page.locator('.color-format-select').selectOption('rgb');
    await page.locator('.layer-opacity-input').fill('0.5');
    await expect(page.locator('.layer-opacity-text')).toContainText('0.50');
    const fpsInput = page.locator('.max-fps-input');
    await fpsInput.fill('30');
    await fpsInput.dispatchEvent('change');

    // Close panel
    await closeMiscPreferences(page);

    // Reopen and verify all settings persisted
    await openMiscPreferences(page);

    await expect(page.locator('.background-picker-wrapper [data-background].selected'))
      .toHaveAttribute('data-background', 'light-canvas-background');
    await expect(page.locator('.color-format-select')).toHaveValue('rgb');
    await expect(page.locator('.layer-opacity-text')).toContainText('0.50');
    await expect(page.locator('.max-fps-input')).toHaveValue('30');
  });
});
