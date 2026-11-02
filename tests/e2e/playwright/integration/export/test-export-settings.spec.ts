import test, { expect } from "@playwright/test";
import {
  downloadPngExport,
  openEditor,
  openExportSettingsPanel,
  selectExportTab,
  setExportWidth,
  setPiskelFromGrid,
  waitForEditorReady,
  testId,
} from "../../testutils";

test.describe('Export resolution', () => {
  test('typing a resolution should allow a fractional scale', { tag: ['@export.free-scale'] }, async ({ page }) => {
    // Start from a 2x2 sprite with red pixels in two opposite corners.
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['T', 'R'],
    ]);
    await openExportSettingsPanel(page);

    // Type a width of 3: the scale is 1.5x, and the slider shows the closest value.
    await setExportWidth(page, 3);
    await expect(testId(page, 'export-height-input')).toHaveValue('3');
    await expect(testId(page, 'export-scale-text')).toHaveText('1.5x');
    await expect(testId(page, 'export-scale-slider')).toHaveValue('2');

    // The PNG has this resolution. The four corners keep their color.
    const png = await downloadPngExport(page);
    expect(png.width).toBe(3);
    expect(png.height).toBe(3);
    expect(png.rows[0][0]).toBe('R');
    expect(png.rows[0][2]).toBe('.');
    expect(png.rows[2][0]).toBe('.');
    expect(png.rows[2][2]).toBe('R');
  });

  test('typing a resolution should allow a scale above 32x', { tag: ['@export.free-scale'] }, async ({ page }) => {
    // Start from a 2x2 sprite with red pixels in two opposite corners.
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['T', 'R'],
    ]);
    await openExportSettingsPanel(page);

    // Type a width of 66: the scale is 33x, and the slider stops at its maximum.
    await setExportWidth(page, 66);
    await expect(testId(page, 'export-height-input')).toHaveValue('66');
    await expect(testId(page, 'export-scale-text')).toHaveText('33.0x');
    await expect(testId(page, 'export-scale-slider')).toHaveValue('32');

    // The PNG has this resolution, with each pixel replicated 33 times.
    const png = await downloadPngExport(page);
    expect(png.width).toBe(66);
    expect(png.height).toBe(66);
    expect(png.rows[32][32]).toBe('R');
    expect(png.rows[32][33]).toBe('.');
    expect(png.rows[33][32]).toBe('.');
    expect(png.rows[33][33]).toBe('R');
  });
});

test.describe('Export settings', () => {

  test('the export drawer should have the expected defaults', { tag: ['@export.saved'] }, async ({ page }) => {
    // Open the export drawer of a new sprite.
    await openEditor(page);
    await openExportSettingsPanel(page);

    // The GIF tab is selected, at 1x, with the loop option on.
    await expect(testId(page, 'export-tab-gif')).toHaveClass(/selected/);
    await expect(testId(page, 'export-scale-slider')).toHaveValue('1');
    await expect(testId(page, 'gif-loop-checkbox')).toBeChecked();
  });

  test('the scale, the tab and the loop option should be remembered after a reload', { tag: ['@export.saved'] }, async ({ page }) => {
    await openEditor(page);
    await openExportSettingsPanel(page);

    // Turn off the loop option, in the GIF tab.
    await testId(page, 'gif-loop-checkbox').uncheck();

    // Set the scale to 2x, on the 32x32 sprite.
    await setExportWidth(page, 64);
    await expect(testId(page, 'export-scale-slider')).toHaveValue('2');

    // Go to the PNG tab.
    await selectExportTab(page, 'png');

    // Reload, and open the export drawer again.
    await page.reload();
    await waitForEditorReady(page);
    await openExportSettingsPanel(page);

    // The PNG tab and the scale are remembered.
    await expect(testId(page, 'export-tab-png')).toHaveClass(/selected/);
    await expect(testId(page, 'export-scale-slider')).toHaveValue('2');
    await expect(testId(page, 'export-width-input')).toHaveValue('64');

    // The loop option is remembered too.
    await selectExportTab(page, 'gif');
    await expect(testId(page, 'gif-loop-checkbox')).not.toBeChecked();
  });
});
