import test, { expect } from "@playwright/test";
import {
  colorToInt,
  getCurrentPiskelFrameCount,
  getCurrentPiskelHeight,
  getCurrentPiskelWidth,
  getPixelColor,
  openEditor,
  openImportSettingsPanel,
  setPiskelFromGrid,
  setPiskelFromImageSrc,
  TRANSPARENT,
  wait,
  waitFor,
} from "../../testutils";

// 1x1 black PNG
const BLACK_1x1 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg==';

// 2x2 multicolor PNG (R,G,B,transparent-ish)
const MULTICOLOR_2x2_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAF0lEQVQYVwXBAQEAAACCIPw/uiAYi406Ig4EARK1RMAAAAAASUVORK5CYII=';

test.describe('File handling — image import', () => {

  test('importing a PNG image as single should replace the canvas', async ({ page }) => {
    await openEditor(page);

    // Set up 1x1 black pixel first (same as working test)
    await setPiskelFromImageSrc(page, BLACK_1x1);
    await page.waitForSelector('.palettes-list-color:nth-child(1)', { state: 'attached' });

    // Import a 2x2 image
    await openImportSettingsPanel(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.file-input-button');
    const fileChooser = await fileChooserPromise;

    const base64Data = ('data:image/png;base64,' + MULTICOLOR_2x2_BASE64).split(',')[1];
    await fileChooser.setFiles([{
      name: 'hello.txt',
      mimeType: 'image/png',
      buffer: Buffer.from(base64Data, 'base64'),
    }]);

    // Image import step
    await expect(page.locator('.current-step.import-image-container')).toBeAttached();
    await expect(page.locator('input[name="import-type"][value="single"]')).toBeChecked();
    await page.click('.current-step.import-image-container .import-next-button');
    await page.waitForTimeout(3000);

    // Select mode — Replace
    await expect(page.locator('.current-step .import-mode')).toBeAttached();
    page.once('dialog', dialog => dialog.accept());
    await page.click('.import-mode-replace-button');

    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached', timeout: 10000 });
    await wait(500);

    // Canvas should now be 2x2
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);
  });

  test('importing a PNG as spritesheet should create multiple frames', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromImageSrc(page, BLACK_1x1);
    await wait(300);

    // Create a 4x2 image (two 2x2 frames side by side) in-browser
    const spritesheetBuffer = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 4;
      canvas.height = 2;
      const ctx = canvas.getContext('2d')!;
      // Left frame: red
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 2, 2);
      // Right frame: blue
      ctx.fillStyle = '#0000FF';
      ctx.fillRect(2, 0, 2, 2);
      const dataUrl = canvas.toDataURL('image/png');
      return dataUrl.split(',')[1];
    });

    await openImportSettingsPanel(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.file-input-button');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([{
      name: 'spritesheet.png',
      mimeType: 'image/png',
      buffer: Buffer.from(spritesheetBuffer, 'base64'),
    }]);

    // Image import step — select "spritesheet"
    await expect(page.locator('.current-step.import-image-container')).toBeAttached();
    await page.click('input[name="import-type"][value="sheet"]');
    await wait(200);

    // Set frame size to 2x2 via evaluate (fill/type don't trigger Piskel's input events)
    await page.evaluate(() => {
      const sx = document.querySelector('input[name="frame-size-x"]') as HTMLInputElement;
      const sy = document.querySelector('input[name="frame-size-y"]') as HTMLInputElement;
      sx.value = '2'; sy.value = '2';
      [sx, sy].forEach(el => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    await wait(1000);

    await page.click('.current-step.import-image-container .import-next-button');

    // Select mode — Replace (onNextClick → createPiskelFromImage is async)
    await expect(page.locator('.current-step .import-mode')).toBeAttached({ timeout: 30000 });
    page.once('dialog', dialog => dialog.accept());
    await page.click('.import-mode-replace-button');

    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached', timeout: 10000 });

    // Wait until import is fully processed
    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 2,
      { timeout: 10000, message: 'Spritesheet import did not produce 2 frames' });

    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);

    // Frame 0 should be red, frame 1 should be blue
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 0, 0, 0, 1)).toBe(colorToInt('#0000FF'));
  });

  test('spritesheet import with offset should extract correct frames', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromImageSrc(page, BLACK_1x1);
    await page.waitForSelector('.palettes-list-color:nth-child(1)', { state: 'attached' });

    // Create 6x4 image: 1px gray border, then 2x2 red | 2x2 green inside top row
    const buf = await page.evaluate(() => {
      const c = document.createElement('canvas');
      c.width = 6; c.height = 4;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, 6, 4);
      ctx.fillStyle = '#FF0000'; ctx.fillRect(1, 1, 2, 2);
      ctx.fillStyle = '#00FF00'; ctx.fillRect(3, 1, 2, 2);
      return c.toDataURL('image/png').split(',')[1];
    });

    await openImportSettingsPanel(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.file-input-button');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles([{
      name: 'padded.png',
      mimeType: 'image/png',
      buffer: Buffer.from(buf, 'base64'),
    }]);

    await expect(page.locator('.current-step.import-image-container')).toBeAttached();
    await page.click('input[name="import-type"][value="sheet"]');
    await wait(200);

    // Verify offset inputs exist and default to 0
    await expect(page.locator('input[name="frame-offset-x"]')).toHaveValue('0');
    await expect(page.locator('input[name="frame-offset-y"]')).toHaveValue('0');

    // Set frame size 2x2 with offset 1,1 via evaluate (fill/type don't trigger Piskel's input events)
    await page.evaluate(() => {
      const sx = document.querySelector('input[name="frame-size-x"]') as HTMLInputElement;
      const sy = document.querySelector('input[name="frame-size-y"]') as HTMLInputElement;
      const ox = document.querySelector('input[name="frame-offset-x"]') as HTMLInputElement;
      const oy = document.querySelector('input[name="frame-offset-y"]') as HTMLInputElement;

      sx.value = '2'; sy.value = '2';
      ox.value = '1'; oy.value = '1';
      [sx, sy, ox, oy].forEach(el => {
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    await wait(1000);

    await page.click('.current-step.import-image-container .import-next-button');

    // Replace
    // Select mode — Replace (onNextClick → createPiskelFromImage is async)
    await expect(page.locator('.current-step .import-mode')).toBeAttached({ timeout: 30000 });
    page.once('dialog', dialog => dialog.accept());
    await page.click('.import-mode-replace-button');

    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached', timeout: 10000 });

    // Wait until import is fully processed: 2 frames with 2x2 size
    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 2,
      { timeout: 10000, message: 'Spritesheet import did not produce 2 frames' });

    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);

    // Frame 0 should be red, frame 1 should be green
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 0, 0, 0, 1)).toBe(colorToInt('#00FF00'));
  });
});

test.describe('File handling — .piskel import', () => {

  test('importing a .piskel file should restore pixel content', async ({ page }) => {
    await openEditor(page);

    // Create a known pattern and save as .piskel
    await setPiskelFromGrid(page, [['R', 'G'], ['B', 'T']]);

    await page.click('[data-setting="save"]');
    await expect(page.locator('.settings-section-save')).toBeAttached();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#save-file-download-button').click();
    const download = await downloadPromise;

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Download path is null');

    const fs = await import('fs/promises');
    const path = await import('path');
    const piskelPath = path.join(path.dirname(downloadPath), 'test-import.piskel');
    await fs.copyFile(downloadPath, piskelPath);

    // Close settings and clear canvas
    await page.click('[data-setting="save"]');
    await wait(300);
    await setPiskelFromGrid(page, [['T', 'T'], ['T', 'T']]);

    // Import the .piskel file
    await openImportSettingsPanel(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.open-piskel-button');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(piskelPath);

    // Select mode — Replace
    await page.waitForSelector('.current-step .import-mode', { state: 'attached', timeout: 10000 });
    page.once('dialog', dialog => dialog.accept());
    await page.click('.import-mode-replace-button');

    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached', timeout: 10000 });
    await wait(500);

    // Verify restored content
    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(2);
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 1, 0)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 1)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 1, 1)).toBe(TRANSPARENT);
  });
});
