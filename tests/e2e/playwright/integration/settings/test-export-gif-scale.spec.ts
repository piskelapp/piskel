import test, {  expect } from "@playwright/test";
import { openEditor, openExportSettingsPanel, setPiskelFromGrid } from "../../testutils";
import fs from 'fs/promises';
import { parseGIF, decompressFrames } from 'gifuct-js'

test('Test export gif with scaling', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [["R", "G", "B"],["B", "R", "G"], ["G", "B", "R"]]);

    await openExportSettingsPanel(page);

    await expect(page.locator('.export-panel-gif')).toBeAttached();
    await page.click('[data-tab-id="gif"]');

    const defaultHeightInputLocator = page.locator('[name="resize-width"]');
    await defaultHeightInputLocator.fill("6")
    await expect(page.locator('[name="resize-width"]')).toHaveValue("6");
    await expect(page.locator('[name="resize-height"]')).toHaveValue("6");
    await expect(page.locator('[name="scale-input"]')).toHaveValue("2");

    const downloadPromise = page.waitForEvent('download');
    await page.click('.gif-download-button');

    const download = await downloadPromise;
    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const suggestedFilename = await download.suggestedFilename();
    expect(suggestedFilename).toBe("test.gif");

    const buffer = await fs.readFile(path);
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true)
    
    const firstFrame = frames[0]!;
    expect(firstFrame.dims.width).toBe(6);
    expect(firstFrame.dims.height).toBe(6);
    expect(firstFrame.pixels.length).toBe(36);

    const firstPixelColor = firstFrame.colorTable[firstFrame.pixels[0]].toString();
    expect(firstPixelColor).toBe("255,0,0");
    
    const lastPixelColor = firstFrame.colorTable[firstFrame.pixels[35]].toString();
    expect(lastPixelColor).toBe("255,0,0");
});