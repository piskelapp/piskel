import test, {  expect } from "@playwright/test";
import { openEditor, openExportSettingsPanel, setPiskelFromGrid } from "../../testutils";
import fs from 'fs/promises';

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
    const base64 = buffer.toString('base64');
    const expectedBase64 = "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAADxJREFUOE9jZGD4/5+BKMDISIwyxlED8QTTaBjiCJwhkWyISf8gNcTlKKKyE8TKUQNxJ5vRSMEZAgOUbABlzSgBIg8P4wAAAABJRU5ErkJgggAA";
    expect(base64).toBe(expectedBase64);
});