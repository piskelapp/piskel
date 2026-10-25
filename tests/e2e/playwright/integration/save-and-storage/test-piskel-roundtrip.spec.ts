import test, { expect } from "@playwright/test";
import {
  openEditor,
  openSaveSettingsPanel,
  openImportSettingsPanel,
  setPiskelFromGrid,
  getCurrentPiskelWidth,
  getCurrentPiskelHeight,
  getCurrentPiskelFrameCount,
  getCurrentPiskelLayerCount,
  getPixelColor,
  colorToInt,
  testId,
} from "../../testutils";

test.describe('.piskel round-trip', () => {

  test('should save and re-import a .piskel file with identical content', async ({ page }) => {
    await openEditor(page);

    // Create a known 2x2 sprite: R G / B T
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);

    // Verify initial state
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);

    // Save as .piskel file
    await openSaveSettingsPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'save-file-download-button').click();
    const download = await downloadPromise;

    const suggestedFilename = download.suggestedFilename();
    expect(suggestedFilename).toMatch(/\.piskel$/);

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Download path is null');

    // Save to a known path with .piskel extension (needed for import validation)
    const fs = await import('fs/promises');
    const path = await import('path');
    const piskelFilePath = path.join(path.dirname(downloadPath), 'test-roundtrip.piskel');
    await fs.copyFile(downloadPath, piskelFilePath);

    // Close settings panel by clicking the same setting button
    await page.click('[data-setting="save"]');

    // Now create a fresh empty piskel to clear the canvas
    await setPiskelFromGrid(page, [["T", "T"], ["T", "T"]]);

    // Import the saved .piskel file
    await openImportSettingsPanel(page);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await testId(page, 'import-piskel-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(piskelFilePath);

    // .piskel import goes to SELECT_MODE step — choose "Replace"
    await page.waitForSelector('.current-step .import-mode', { state: 'attached', timeout: 10000 });
    // Accept the browser confirm dialog that appears on replace
    page.once('dialog', dialog => dialog.accept());
    await page.click('.import-mode-replace-button');

    // Wait for the dialog to close after import
    await page.waitForSelector('#dialog-container-wrapper:not(.show)', {
      state: 'attached',
      timeout: 10000
    });
    await page.waitForTimeout(500);

    // Verify the re-imported piskel matches the original
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);

    // Verify pixel colors
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000')); // R
    expect(await getPixelColor(page, 1, 0)).toBe(colorToInt('#00FF00')); // G
    expect(await getPixelColor(page, 0, 1)).toBe(colorToInt('#0000FF')); // B
    expect(await getPixelColor(page, 1, 1)).toBe(0); // T (transparent)
  });
});
