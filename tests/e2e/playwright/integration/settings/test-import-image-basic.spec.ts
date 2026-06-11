import test, {  expect } from "@playwright/test";
import { getCurrentPiskelColorCount, getCurrentPiskelFrameCount, getCurrentPiskelHeight, getCurrentPiskelLayerCount, getCurrentPiskelWidth, isCurrentPiskelEmpty, isSettingsDrawerExpanded, openEditor, openImportSettingsPanel, openResizeSettingsPanel, setPiskelFromImageSrc } from "../../testutils";

test('Test importing a simple image', async ({ page }) => {
    await openEditor(page);
    
    
    // Set-up dummy image first.
    const black_1x1_pixel_base64Image = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcS',
      'JAAAADUlEQVQYV2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg=='
    ].join('');
    await setPiskelFromImageSrc(page, black_1x1_pixel_base64Image);
    
    await page.waitForSelector('.palettes-list-color:nth-child(1)', { state: 'attached' });
    expect(await getCurrentPiskelColorCount(page)).toBe(1);
    expect(await isCurrentPiskelEmpty(page)).toBe(false);
    expect(await getCurrentPiskelWidth(page)).toBe(1);
    expect(await getCurrentPiskelHeight(page)).toBe(1);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
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
    // Check for import and replacing as a single image.
    await expect(page.locator('input[name="import-type"][value="single"]')).toBeChecked();
    
    await page.click('.current-step.import-image-container .import-next-button');
    
    await page.waitForTimeout(3000);

    await expect(page.locator('.current-step .import-mode')).toBeAttached();

    // Go to next step (adjust size)
    await page.click('.import-mode-merge-button');
    
    // Adjust size step is displayed
    await page.waitForSelector('.current-step .import-resize-info', { state: 'attached' });
    
    // Go to next step (insert location)
    await page.click('.current-step .import-next-button');
    
    // Insert location step is displayed
    await page.waitForSelector('.current-step .insert-mode-container', { state: 'attached' });
    
    // Select the mode "insert in existing frames"
    await page.click('#insert-mode-insert');

    // Finalize the import
    await page.click('.current-step .import-next-button');

    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached' });
    
    expect(await getCurrentPiskelHeight(page)).toBe(2);
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
});