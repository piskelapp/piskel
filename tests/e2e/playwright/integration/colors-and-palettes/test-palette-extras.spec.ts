import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  testId,
  getPaletteColors,
  waitFor,
  wait,
} from "../../testutils";

/** Open the edit dialog for the currently selected palette */
async function openEditPaletteDialog(page: Page) {
  await page.locator('.edit-palette-button').click();
  await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });
}

/** Select a palette from the dropdown by name */
async function selectPaletteByName(page: Page, name: string) {
  await page.locator('.palettes-list-select').selectOption({ label: name });
  await wait(200);
}

/** Create a simple palette with a given name and save it */
async function createPalette(page: Page, name: string) {
  await testId(page, 'create-palette-button').click();
  await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });
  await page.locator('input[name="palette-name"]').fill(name);
  await page.locator('.create-palette-submit').click();
  await wait(300);
}

test.describe('Palette extras — edit and delete', () => {

  test('edit palette button should open dialog with palette data', async ({ page }) => {
    await openEditor(page);

    await createPalette(page, 'Edit Test');
    await selectPaletteByName(page, 'Edit Test');
    await openEditPaletteDialog(page);

    // Dialog should show "Edit Palette" title and the palette name
    await expect(page.locator('.dialog-title')).toHaveText('Edit Palette');
    await expect(page.locator('input[name="palette-name"]')).toHaveValue('Edit Test');

    // Download button should be visible (only in edit mode)
    await expect(page.locator('.create-palette-download-button')).toBeVisible();
    // Delete button should be visible
    await expect(page.locator('.create-palette-delete')).toBeVisible();
    // Import button should be hidden
    await expect(page.locator('.create-palette-import-button')).toBeHidden();
  });

  test('delete palette should remove it after confirmation', async ({ page }) => {
    await openEditor(page);

    await createPalette(page, 'Delete Me');
    await selectPaletteByName(page, 'Delete Me');
    await openEditPaletteDialog(page);

    // Click delete and accept confirm dialog
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.create-palette-delete').click();
    await wait(500);

    // Palette should no longer be in the dropdown
    const options = await page.locator('.palettes-list-select option').allInnerTexts();
    expect(options).not.toContain('Delete Me');
  });

  test('delete palette cancel should keep the palette', async ({ page }) => {
    await openEditor(page);

    await createPalette(page, 'Keep Me');
    await selectPaletteByName(page, 'Keep Me');
    await openEditPaletteDialog(page);

    // Click delete but dismiss confirm dialog
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('.create-palette-delete').click();
    await wait(500);

    // Close dialog
    await page.locator('.dialog-close').click();
    await wait(300);

    // Palette should still be in the dropdown
    const options = await page.locator('.palettes-list-select option').allInnerTexts();
    expect(options).toContain('Keep Me');
  });
});

test.describe('Palette extras — import .gpl', () => {

  test('importing a .gpl file should populate palette colors', async ({ page }) => {
    await openEditor(page);

    // Open create palette dialog
    await testId(page, 'create-palette-button').click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });

    // Create a .gpl file content
    const gplContent = [
      'GIMP Palette',
      'Name: Test Import',
      'Columns: 0',
      '#',
      '255   000   000 Red',
      '000   255   000 Green',
      '000   000   255 Blue',
    ].join('\r\n');

    // Set up the file chooser before clicking import
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('.create-palette-import-button').click();
    const fileChooser = await fileChooserPromise;

    // Upload the .gpl content
    await fileChooser.setFiles({
      name: 'test-palette.gpl',
      mimeType: 'text/plain',
      buffer: Buffer.from(gplContent, 'utf-8'),
    });
    await wait(500);

    // The colors list should now have 3 colors
    const colorItems = page.locator('.create-palette-color');
    await waitFor(async () => (await colorItems.count()) >= 3);
    expect(await colorItems.count()).toBe(3);

    // Save the imported palette
    await page.locator('input[name="palette-name"]').fill('Imported GPL');
    await page.locator('.create-palette-submit').click();
    await wait(300);

    // Select it and verify the colors
    await selectPaletteByName(page, 'Imported GPL');
    const colors = await getPaletteColors(page);
    expect(colors).toContain('#ff0000');
    expect(colors).toContain('#00ff00');
    expect(colors).toContain('#0000ff');
  });
});

test.describe('Palette extras — download .gpl', () => {

  test('download button should produce a valid .gpl file', async ({ page }) => {
    await openEditor(page);

    await createPalette(page, 'Download Test');
    await selectPaletteByName(page, 'Download Test');
    await openEditPaletteDialog(page);

    const downloadBtn = page.locator('.create-palette-download-button');
    await expect(downloadBtn).toBeVisible();

    // Click download and capture the file
    const downloadPromise = page.waitForEvent('download');
    await downloadBtn.click();
    const download = await downloadPromise;

    // Verify filename
    expect(download.suggestedFilename()).toBe('Download Test.gpl');

    // Read and verify content
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Download path is null');
    const fs = await import('fs/promises');
    const content = await fs.readFile(downloadPath, 'utf-8');

    expect(content).toContain('GIMP Palette');
    expect(content).toContain('Name: Download Test');
    // Should contain at least one RGB color line
    expect(content).toMatch(/\d+\s+\d+\s+\d+/);
  });
});
