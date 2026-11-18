import test, {  expect } from "@playwright/test";
import {
  openEditor,
  openExportSettingsPanel,
  setPiskelFromGrid,
  testId,
  selectExportTab,
  gridFromColorRows,
} from "../../testutils";
import fs from 'fs/promises';
import PNG from 'png-ts';

test('Test export png with scaling', { tag: ['@export.scale'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'B.',
      '.B',
    ]));

    await openExportSettingsPanel(page);

    await expect(page.locator('.export-panel-png')).not.toBeAttached();
    await selectExportTab(page, 'png');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    const defaultHeightInputLocator = testId(page, 'export-width-input');
    await defaultHeightInputLocator.focus();
    await page.keyboard.type("0");

    await expect(testId(page, 'export-width-input')).toHaveValue("20");
    await expect(testId(page, 'export-height-input')).toHaveValue("20");
    await expect(testId(page, 'export-scale-slider')).toHaveValue("10");

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-download-button').click();

    const download = await downloadPromise;
    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const suggestedFilename = await download.suggestedFilename();
    expect(suggestedFilename).toBe("test.png");

    const buffer = await fs.readFile(path);
    
    const png = new PNG(buffer);
    expect(png.width).toBe(20);
    expect(png.height).toBe(20);
    
    const decodedPixelsData = png.decodePixels();
    const pixelCount = decodedPixelsData.length / 4; // RGBA
    expect(pixelCount).toBe(400); // 20x20

    const firstPixelRGBA = decodedPixelsData.slice(0,4).join("-");
    expect(firstPixelRGBA).toBe("0-0-255-255"); // Blue

    const lastPixelRGBA = decodedPixelsData.slice(-4).join("-");
    expect(lastPixelRGBA).toBe("0-0-255-255"); // Blue
});