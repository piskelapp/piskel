import test, {  expect } from "@playwright/test";
import { getCurrentPiskelFrameCount, getCurrentPiskelHeight, getCurrentPiskelLayerCount, getCurrentPiskelWidth, isSettingsDrawerExpanded, openEditor, openImportSettingsPanel, setPiskelFromImageSrc } from "../../testutils";

test('Double Image import test', async ({ page }) => {
    await openEditor(page);
    
    // Set-up dummy image first.
    const black_1x1_pixel_base64Image = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcS',
      'JAAAADUlEQVQYV2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg=='
    ].join('');
    await setPiskelFromImageSrc(page, black_1x1_pixel_base64Image);
    
    await page.waitForSelector('.palettes-list-color:nth-child(1)', { state: 'attached' });

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    await openImportSettingsPanel(page);

    // open first image:
    const fileChooserPromise = page.waitForEvent('filechooser');    
    await page.click('.file-input-button');

    const fileChooser = await fileChooserPromise;
    
    const multicolor_2x2_pixel_base64Image = [
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0',
         'kAAAAF0lEQVQYVwXBAQEAAACCIPw/uiAYi406Ig4EARK1RMAAAAAASUVORK5CYII='
        ].join('');
    const base64Data = multicolor_2x2_pixel_base64Image.split(',')[1];
    await fileChooser.setFiles([{
      name: 'image1.png',
      mimeType: 'image/png',
      buffer: Buffer.from(base64Data, 'base64')
    }]);

    await page.click('.current-step.import-image-container .import-next-button');

    // Close (future) confirm dialog.
    page.on('dialog', dialog => dialog.accept());

    // Replace previous image.
    await page.click('.current-step .import-mode-replace-button');
    
    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached' });

    // Wait for dialog to be destroyed.
    await page.waitForTimeout(3000);

    expect(await getCurrentPiskelHeight(page)).toBe(2);
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    
    // Re-open import window.
    await openImportSettingsPanel(page);

    const fileChooserPromise2 = page.waitForEvent('filechooser');    
    await page.click('.file-input-button');

    const fileChooser2 = await fileChooserPromise2;
    
    await fileChooser2.setFiles([{
      name: 'image2.png',
      mimeType: 'image/png',
      buffer: Buffer.from(black_1x1_pixel_base64Image.split(",")[1], 'base64')
    }]);

    await page.click('.current-step.import-image-container .import-next-button');

    // Replace previous image.
    await page.click('.current-step .import-mode-replace-button');

    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached' });

    expect(await getCurrentPiskelHeight(page)).toBe(1);
    expect(await getCurrentPiskelWidth(page)).toBe(1);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
});