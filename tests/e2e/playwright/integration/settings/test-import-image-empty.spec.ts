import test, {  expect } from "@playwright/test";
import { getCurrentPiskelColorCount, getCurrentPiskelFrameCount, getCurrentPiskelHeight, getCurrentPiskelLayerCount, getCurrentPiskelWidth, isCurrentPiskelEmpty, isSettingsDrawerExpanded, openEditor, openImportSettingsPanel, openResizeSettingsPanel, setPiskelFromGrid, setPiskelFromImageSrc } from "../../testutils";

test('Test importing a simple image over an empty one', async ({ page }) => {
    await openEditor(page);
    
    // Set-up empty image first.
    await setPiskelFromGrid(page, [["T"]]);
    await page.waitForTimeout(1000);
    expect(await isCurrentPiskelEmpty(page)).toBe(true);

    await openImportSettingsPanel(page);

    const fileChooserPromise = page.waitForEvent('filechooser');    
    await page.click('.file-input-button');

    const fileChooser = await fileChooserPromise;
    const multicolor_2x2_pixel_base64Image = [
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0',
          'kAAAAF0lEQVQYVwXBAQEAAACCIPw/uiAYi406Ig4EARK1RMAAAAAASUVORK5CYII='
        ].join('');
    const base64Data = multicolor_2x2_pixel_base64Image.split(',')[1];
    await fileChooser.setFiles([{
      name: 'hello.txt',
      mimeType: 'image/png',
      buffer: Buffer.from(base64Data, 'base64')
    }]);

    // Check for import dialog.
    await expect(page.locator('.current-step.import-image-container')).toBeAttached();

    // Close confirm dialog.
    page.on('dialog', dialog => dialog.accept());
    await page.click('.current-step.import-image-container .import-next-button');

    // Since the current sprite is empty clicking on the button should directly finalize the import.
    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached' });
});