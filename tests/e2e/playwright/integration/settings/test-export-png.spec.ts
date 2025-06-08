import test, {  expect } from "@playwright/test";
import { openEditor, openExportSettingsPanel, setPiskelFromGrid } from "../../testutils";
import fs from 'fs/promises';

test('Test export png', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [["B", "T"],["T", "B"]]);

    await openExportSettingsPanel(page);

    await expect(page.locator('.export-panel-png')).not.toBeAttached();
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    const downloadPromise = page.waitForEvent('download');
    await page.click('.png-download-button');

    const download = await downloadPromise;
    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const suggestedFilename = await download.suggestedFilename();
    expect(suggestedFilename).toBe("test.png");

    const buffer = await fs.readFile(path);
    const base64 = buffer.toString('base64');
    const expectedBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAABdJREFUGFdjZGD4/5+BgZGRkQEM/v8HACAiBAG2A8HlAAAAAElFTkSuQmCC";
    expect(base64).toBe(expectedBase64);


});