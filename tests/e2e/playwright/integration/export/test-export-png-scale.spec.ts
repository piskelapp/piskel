import test, {  expect } from "@playwright/test";
import { openEditor, openExportSettingsPanel, setPiskelFromGrid } from "../../testutils";
import fs from 'fs/promises';
import PNG from 'png-ts';

test('Test export png with scaling', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [["B", "T"],["T", "B"]]);

    await openExportSettingsPanel(page);

    await expect(page.locator('.export-panel-png')).not.toBeAttached();
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    const defaultHeightInputLocator = page.locator('[name="resize-width"]');
    await defaultHeightInputLocator.focus();
    await page.keyboard.type("0");

    await expect(page.locator('[name="resize-width"]')).toHaveValue("20");
    await expect(page.locator('[name="resize-height"]')).toHaveValue("20");
    await expect(page.locator('[name="scale-input"]')).toHaveValue("10");

    const downloadPromise = page.waitForEvent('download');
    await page.click('.png-download-button');

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