import test, { expect, Page } from '../../../fixtures';
import { openEditor, setPiskelFromGrid, setPrimaryColor, isSettingsDrawerExpanded, waitFor, wait } from "../../../testutils";

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

test.describe('Preferences — Misc tab', () => {

  // ─── Defaults ──────────────────────────────────────────────────

  test('canvas background should default to lowcont-dark', async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    const selected = page.locator('.background-picker-wrapper [data-background].selected');
    await expect(selected).toHaveAttribute('data-background', 'lowcont-dark-canvas-background');
  });

  test('color format should default to hex', async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    await expect(page.locator('.color-format-select')).toHaveValue('hex');
  });

  test('changing color format should affect the color picker display', async ({ page }) => {
    await openEditor(page);

    // Set a known primary color so the picker has a non-default value
    await setPrimaryColor(page, '#FF0000');

    // Open color picker and verify hex format
    await page.evaluate(() => document.querySelectorAll('.tooltip').forEach(t => t.remove()));
    const replacer = page.locator('[data-test-id="primary-color-picker"]').locator('..').locator('.sp-replacer');
    await replacer.click();
    const spInput = page.locator('.sp-container:not(.sp-hidden) .sp-input');
    await expect(spInput).toBeVisible();
    const hexValue = await spInput.inputValue();
    expect(hexValue.toLowerCase()).toContain('ff0000');

    // Close picker
    await page.evaluate(() => {
      const $ = (window as any).$;
      $('[data-test-id="primary-color-picker"]').spectrum('hide');
    });

    // Switch to RGB format
    await openMiscPreferences(page);
    await page.locator('.color-format-select').selectOption('rgb');
    await wait(200);

    // Close preferences
    await closeMiscPreferences(page);

    // Open color picker again — should show RGB format
    await page.evaluate(() => document.querySelectorAll('.tooltip').forEach(t => t.remove()));
    await replacer.click();
    const rgbValue = await spInput.inputValue();
    expect(rgbValue).toContain('rgb');
    expect(rgbValue).toContain('255');

    // Close picker
    await page.evaluate(() => {
      const $ = (window as any).$;
      $('[data-test-id="primary-color-picker"]').spectrum('hide');
    });

    // Switch back to hex
    await openMiscPreferences(page);
    await page.locator('.color-format-select').selectOption('hex');
    await wait(200);
    await closeMiscPreferences(page);

    // Open color picker — should be back to hex
    await page.evaluate(() => document.querySelectorAll('.tooltip').forEach(t => t.remove()));
    await replacer.click();
    const backToHex = await spInput.inputValue();
    expect(backToHex.toLowerCase()).toContain('ff0000');

    await page.evaluate(() => {
      const $ = (window as any).$;
      $('[data-test-id="primary-color-picker"]').spectrum('hide');
    });
  });

  test('layer opacity should default to 0.20', async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    const value = await page.locator('.layer-opacity-input').inputValue();
    expect(parseFloat(value)).toBeCloseTo(0.20, 1);
    expect(await page.locator('.layer-opacity-text').innerText()).toContain('0.20');
  });

  test('max FPS should default to 24', async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    await expect(page.locator('.max-fps-input')).toHaveValue('24');
  });

  // ─── Canvas background screenshots ────────────────────────────

  test('default canvas background rendering', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await openMiscPreferences(page);
    await wait(300);

    await expect(canvas(page)).toHaveScreenshot('bg-lowcont-dark.png', screenshotOpts);
  });

  test('changing to light background should update the canvas', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await openMiscPreferences(page);

    await page.locator('[data-background="light-canvas-background"]').click();
    await wait(300);

    await expect(page.locator('[data-background="light-canvas-background"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-background="lowcont-dark-canvas-background"]')).not.toHaveClass(/selected/);
    await expect(canvas(page)).toHaveScreenshot('bg-light.png', screenshotOpts);
  });

  test('changing to medium background should update the canvas', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await openMiscPreferences(page);

    await page.locator('[data-background="medium-canvas-background"]').click();
    await wait(300);

    await expect(page.locator('[data-background="medium-canvas-background"]')).toHaveClass(/selected/);
    await expect(canvas(page)).toHaveScreenshot('bg-medium.png', screenshotOpts);
  });

  // ─── Layer opacity screenshots ─────────────────────────────────

  test('layer opacity affects canvas rendering with multiple layers', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'R', 'T', 'T'],
      ['R', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await page.locator('[data-test-id="layer-add-button"]').click();
    await wait(300);

    await openMiscPreferences(page);
    await wait(300);
    await expect(canvas(page)).toHaveScreenshot('layer-opacity-020.png', screenshotOpts);

    await page.evaluate(() => {
      const slider = document.querySelector('.layer-opacity-input') as HTMLInputElement;
      slider.value = '0';
      slider.dispatchEvent(new Event('input'));
      slider.dispatchEvent(new Event('change'));
    });
    await wait(300);
    await expect(canvas(page)).toHaveScreenshot('layer-opacity-000.png', screenshotOpts);
  });

  // ─── All settings persist after close/reopen ───────────────────

  test('all misc settings should persist after closing and reopening the panel', async ({ page }) => {
    await openEditor(page);
    await openMiscPreferences(page);

    // Change all settings to non-default values
    // 1. Background → light
    await page.locator('[data-background="light-canvas-background"]').click();
    await wait(100);

    // 2. Color format → rgb
    await page.locator('.color-format-select').selectOption('rgb');
    await wait(100);

    // 3. Layer opacity → 0.50
    await page.evaluate(() => {
      const slider = document.querySelector('.layer-opacity-input') as HTMLInputElement;
      slider.value = '0.50';
      slider.dispatchEvent(new Event('input'));
      slider.dispatchEvent(new Event('change'));
    });
    await wait(100);

    // 4. Max FPS → 30
    const fpsInput = page.locator('.max-fps-input');
    await fpsInput.fill('30');
    await fpsInput.dispatchEvent('change');
    await wait(100);

    // Close panel
    await closeMiscPreferences(page);

    // Reopen and verify all settings persisted
    await openMiscPreferences(page);

    await expect(page.locator('.background-picker-wrapper [data-background].selected'))
      .toHaveAttribute('data-background', 'light-canvas-background');
    await expect(page.locator('.color-format-select')).toHaveValue('rgb');
    expect(await page.locator('.layer-opacity-text').innerText()).toContain('0.50');
    await expect(page.locator('.max-fps-input')).toHaveValue('30');
  });
});
