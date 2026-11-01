import test, { expect, Page, Download } from "@playwright/test";
import fs from 'fs/promises';
import nodePath from 'path';
import {
  openEditor,
  openSaveSettingsPanel,
  openImportSettingsPanel,
  setPiskelFromGrid,
  getCurrentPiskelWidth,
  getCurrentPiskelHeight,
  getCurrentPiskelFrameCount,
  getCurrentPiskelLayerCount,
  getLayerName,
  testId,
  getAddLayerButton,
  waitFor,
} from "../../testutils";

/** Save the download to a .piskel file and return the path */
async function saveToPiskelFile(download: Download, name: string): Promise<string> {
  const downloadPath = await download.path();
  if (!downloadPath) throw new Error('Download path is null');
  const piskelPath = nodePath.join(nodePath.dirname(downloadPath), name);
  await fs.copyFile(downloadPath, piskelPath);
  return piskelPath;
}

/** Import a .piskel file using the import wizard (Replace mode) */
async function importPiskelFile(page: Page, filePath: string): Promise<void> {
  await openImportSettingsPanel(page);
  const fileChooserPromise = page.waitForEvent('filechooser');
  await testId(page, 'import-piskel-button').click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(filePath);

  // .piskel import goes to SELECT_MODE — choose "Replace"
  await page.waitForSelector('.current-step .import-mode', { state: 'attached', timeout: 10000 });

  // Accept the browser confirm dialog that appears on replace
  page.once('dialog', dialog => dialog.accept());
  await page.click('.import-mode-replace-button');

  // Wait for the import wizard dialog to close
  await page.waitForSelector('#dialog-container-wrapper:not(.show)', {
    state: 'attached',
    timeout: 10000
  });
  await page.waitForTimeout(500);
}

test.describe('.piskel import', () => {

  test('should import a .piskel file with multiple layers', async ({ page }) => {
    await openEditor(page);

    // Create a sprite with 2 layers
    await setPiskelFromGrid(page, [["R", "T"], ["T", "R"]]);
    await getAddLayerButton(page).click();

    // Rename second layer for identification
    await testId(page, 'layer-edit-button').click();
    const renameInput = testId(page, 'layer-name-input');
    await renameInput.fill('Top Layer');
    await renameInput.press('Enter');

    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Save as .piskel
    await openSaveSettingsPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'save-file-download-button').click();
    const download = await downloadPromise;
    const piskelPath = await saveToPiskelFile(download, 'test-layers.piskel');

    // Close settings
    await page.click('[data-setting="save"]');

    // Reset to a blank canvas
    await setPiskelFromGrid(page, [["T"]]);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);

    // Import the saved .piskel
    await importPiskelFile(page, piskelPath);

    // Verify layers were restored
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);
    expect(await getLayerName(page, 1)).toBe('Top Layer');
  });

  test('should import a .piskel file with multiple frames', async ({ page }) => {
    await openEditor(page);

    // Create a sprite with 3 frames
    await setPiskelFromGrid(page, [["R", "T"], ["T", "R"]]);
    await page.keyboard.press('n');
    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 2);
    await page.keyboard.press('n');
    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 3);

    // Save as .piskel
    await openSaveSettingsPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'save-file-download-button').click();
    const download = await downloadPromise;
    const piskelPath = await saveToPiskelFile(download, 'test-frames.piskel');

    // Close settings and reset
    await page.click('[data-setting="save"]');
    await setPiskelFromGrid(page, [["T"]]);

    // Import
    await importPiskelFile(page, piskelPath);

    // Verify frames were restored
    expect(await getCurrentPiskelFrameCount(page)).toBe(3);
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);
  });
});
