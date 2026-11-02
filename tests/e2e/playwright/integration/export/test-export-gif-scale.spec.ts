import test, {  expect } from "@playwright/test";
import { openEditor, openExportSettingsPanel, setPiskelFromGrid, testId, selectExportTab } from "../../testutils";
import fs from 'fs/promises';
import { parseGIF, decompressFrames } from 'gifuct-js'

test('Test export gif with scaling', { tag: ['@export.scale', '@export.gif'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [["R", "G", "B"],["B", "R", "G"], ["G", "B", "R"]]);

    await openExportSettingsPanel(page);

    await expect(testId(page, 'gif-export-panel')).toBeAttached();
    await selectExportTab(page, 'gif');

    const defaultHeightInputLocator = testId(page, 'export-width-input');
    await defaultHeightInputLocator.fill("6")
    await expect(testId(page, 'export-width-input')).toHaveValue("6");
    await expect(testId(page, 'export-height-input')).toHaveValue("6");
    await expect(testId(page, 'export-scale-slider')).toHaveValue("2");

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'gif-download-button').click();

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