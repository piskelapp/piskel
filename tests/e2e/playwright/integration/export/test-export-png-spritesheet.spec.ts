import test, { expect } from '../../fixtures';
import { openEditor, openExportSettingsPanel, setPiskelFromGrid, testId } from "../../testutils";
import fs from 'fs/promises';
import PNG from 'png-ts';
import AdmZip from 'adm-zip';

/** Read RGBA at (x,y) from decoded PNG pixel data */
function rgbaAt(pixels: Uint8Array, width: number, x: number, y: number) {
  const i = (y * width + x) * 4;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], a: pixels[i + 3] };
}

test.describe('PNG spritesheet export', () => {

  test('should export multi-frame spritesheet with correct pixels', async ({ page }) => {
    await openEditor(page);

    // Frame 0: R G / B T
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);

    // Add frame 1 and draw: G T / T G
    await page.keyboard.press('n');
    await page.evaluate(() => {
      const frame = window.pskl.app.piskelController.getCurrentFrame();
      frame.setPixel(0, 0, '#00FF00');
      frame.setPixel(1, 1, '#00FF00');
    });

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Set columns to 2 for side-by-side layout
    const columnsInput = page.locator('[name="png-export-columns"]');
    await columnsInput.fill('2');
    await expect(page.locator('[name="png-export-rows"]')).toHaveValue('1');

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    expect(download.suggestedFilename()).toBe('test.png');

    const buffer = await fs.readFile(path);
    const png = new PNG(buffer);

    // 2 frames side by side: width = 2*2 = 4, height = 2
    expect(png.width).toBe(4);
    expect(png.height).toBe(2);

    const pixels = png.decodePixels();

    // Frame 0 (left half): (0,0)=R, (1,0)=G, (0,1)=B, (1,1)=T
    expect(rgbaAt(pixels, 4, 0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });   // R
    expect(rgbaAt(pixels, 4, 1, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });   // G
    expect(rgbaAt(pixels, 4, 0, 1)).toEqual({ r: 0, g: 0, b: 255, a: 255 });   // B
    expect(rgbaAt(pixels, 4, 1, 1)).toEqual({ r: 0, g: 0, b: 0, a: 0 });       // T

    // Frame 1 (right half): (2,0)=G, (3,0)=T, (2,1)=T, (3,1)=G
    expect(rgbaAt(pixels, 4, 2, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });   // G
    expect(rgbaAt(pixels, 4, 3, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });       // T
    expect(rgbaAt(pixels, 4, 2, 1)).toEqual({ r: 0, g: 0, b: 0, a: 0 });       // T
    expect(rgbaAt(pixels, 4, 3, 1)).toEqual({ r: 0, g: 255, b: 0, a: 255 });   // G
  });

  test('should export single selected frame with correct pixels', async ({ page }) => {
    await openEditor(page);
    // R T / T B
    await setPiskelFromGrid(page, [["R", "T"], ["T", "B"]]);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-selected-frame-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const png = new PNG(buffer);

    expect(png.width).toBe(2);
    expect(png.height).toBe(2);

    const pixels = png.decodePixels();
    expect(rgbaAt(pixels, 2, 0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });   // R
    expect(rgbaAt(pixels, 2, 1, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });       // T
    expect(rgbaAt(pixels, 2, 0, 1)).toEqual({ r: 0, g: 0, b: 0, a: 0 });       // T
    expect(rgbaAt(pixels, 2, 1, 1)).toEqual({ r: 0, g: 0, b: 255, a: 255 });   // B
  });

  test('should export vertical strip layout (1 column)', async ({ page }) => {
    await openEditor(page);

    // Create 4 frames of 2x2: R, G, B, T (one solid color each)
    await setPiskelFromGrid(page, [["R", "R"], ["R", "R"]]);
    await page.keyboard.press('n');
    await page.evaluate(() => {
      const f = window.pskl.app.piskelController.getCurrentFrame();
      f.setPixel(0, 0, '#00FF00'); f.setPixel(1, 0, '#00FF00');
      f.setPixel(0, 1, '#00FF00'); f.setPixel(1, 1, '#00FF00');
    });
    await page.keyboard.press('n');
    await page.evaluate(() => {
      const f = window.pskl.app.piskelController.getCurrentFrame();
      f.setPixel(0, 0, '#0000FF'); f.setPixel(1, 0, '#0000FF');
      f.setPixel(0, 1, '#0000FF'); f.setPixel(1, 1, '#0000FF');
    });
    await page.keyboard.press('n'); // frame 3: empty/transparent

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Set columns=1 → vertical strip, rows should auto-update to 4
    const columnsInput = page.locator('[name="png-export-columns"]');
    await columnsInput.fill('1');
    await columnsInput.dispatchEvent('input');
    await expect(page.locator('[name="png-export-rows"]')).toHaveValue('4');

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const png = new PNG(buffer);

    // Vertical strip: 2px wide, 4*2=8px tall
    expect(png.width).toBe(2);
    expect(png.height).toBe(8);

    const pixels = png.decodePixels();
    const R = { r: 255, g: 0, b: 0, a: 255 };
    const G = { r: 0, g: 255, b: 0, a: 255 };
    const B = { r: 0, g: 0, b: 255, a: 255 };
    const T = { r: 0, g: 0, b: 0, a: 0 };

    // Frame 0 (rows 0-1): Red
    expect(rgbaAt(pixels, 2, 0, 0)).toEqual(R);
    expect(rgbaAt(pixels, 2, 1, 1)).toEqual(R);
    // Frame 1 (rows 2-3): Green
    expect(rgbaAt(pixels, 2, 0, 2)).toEqual(G);
    expect(rgbaAt(pixels, 2, 1, 3)).toEqual(G);
    // Frame 2 (rows 4-5): Blue
    expect(rgbaAt(pixels, 2, 0, 4)).toEqual(B);
    expect(rgbaAt(pixels, 2, 1, 5)).toEqual(B);
    // Frame 3 (rows 6-7): Transparent
    expect(rgbaAt(pixels, 2, 0, 6)).toEqual(T);
    expect(rgbaAt(pixels, 2, 1, 7)).toEqual(T);
  });

  test('should export 2x2 grid layout (2 columns)', async ({ page }) => {
    await openEditor(page);

    // Create 4 frames of 2x2: R, G, B, T
    await setPiskelFromGrid(page, [["R", "R"], ["R", "R"]]);
    await page.keyboard.press('n');
    await page.evaluate(() => {
      const f = window.pskl.app.piskelController.getCurrentFrame();
      f.setPixel(0, 0, '#00FF00'); f.setPixel(1, 0, '#00FF00');
      f.setPixel(0, 1, '#00FF00'); f.setPixel(1, 1, '#00FF00');
    });
    await page.keyboard.press('n');
    await page.evaluate(() => {
      const f = window.pskl.app.piskelController.getCurrentFrame();
      f.setPixel(0, 0, '#0000FF'); f.setPixel(1, 0, '#0000FF');
      f.setPixel(0, 1, '#0000FF'); f.setPixel(1, 1, '#0000FF');
    });
    await page.keyboard.press('n'); // frame 3: transparent

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Set columns=2 → 2x2 grid, rows should auto-update to 2
    const columnsInput = page.locator('[name="png-export-columns"]');
    await columnsInput.fill('2');
    await columnsInput.dispatchEvent('input');
    await expect(page.locator('[name="png-export-rows"]')).toHaveValue('2');

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const png = new PNG(buffer);

    // 2x2 grid: 2*2=4px wide, 2*2=4px tall
    expect(png.width).toBe(4);
    expect(png.height).toBe(4);

    const pixels = png.decodePixels();
    const R = { r: 255, g: 0, b: 0, a: 255 };
    const G = { r: 0, g: 255, b: 0, a: 255 };
    const B = { r: 0, g: 0, b: 255, a: 255 };
    const T = { r: 0, g: 0, b: 0, a: 0 };

    // Grid layout:
    // [Frame0=R][Frame1=G]  (top row)
    // [Frame2=B][Frame3=T]  (bottom row)
    // Top-left 2x2 = Red (frame 0)
    expect(rgbaAt(pixels, 4, 0, 0)).toEqual(R);
    expect(rgbaAt(pixels, 4, 1, 1)).toEqual(R);
    // Top-right 2x2 = Green (frame 1)
    expect(rgbaAt(pixels, 4, 2, 0)).toEqual(G);
    expect(rgbaAt(pixels, 4, 3, 1)).toEqual(G);
    // Bottom-left 2x2 = Blue (frame 2)
    expect(rgbaAt(pixels, 4, 0, 2)).toEqual(B);
    expect(rgbaAt(pixels, 4, 1, 3)).toEqual(B);
    // Bottom-right 2x2 = Transparent (frame 3)
    expect(rgbaAt(pixels, 4, 2, 2)).toEqual(T);
    expect(rgbaAt(pixels, 4, 3, 3)).toEqual(T);
  });

  test('should export scaled PNG with correct pixel replication', async ({ page }) => {
    await openEditor(page);
    // Single pixel: R
    await setPiskelFromGrid(page, [["R"]]);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Scale to 10x
    const widthInput = page.locator('[name="resize-width"]');
    await widthInput.fill('10');
    await expect(page.locator('[name="resize-height"]')).toHaveValue('10');

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const png = new PNG(buffer);
    expect(png.width).toBe(10);
    expect(png.height).toBe(10);

    // Every pixel in the 10x10 image should be red
    const pixels = png.decodePixels();
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        expect(rgbaAt(pixels, 10, x, y)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
      }
    }
  });

  test('should export spritesheet as data-uri in popup', async ({ page }) => {
    await openEditor(page);
    // R G / B T
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Click "Open" data-uri button and capture the popup
    const popupPromise = page.waitForEvent('popup');
    await page.click('.datauri-open-button');
    const popup = await popupPromise;

    // Wait for the popup to render (PngExportController uses setTimeout 500ms)
    await popup.waitForTimeout(1000);

    // The popup title should be a data:image/png;base64 URI
    const title = await popup.title();
    expect(title).toMatch(/^data:image\/png;base64,/);

    // The popup body should contain an <img> with the same data-uri as src
    const imgSrc = await popup.locator('img').getAttribute('src');
    expect(imgSrc).toBe(title);

    // The textarea should contain the same data-uri for easy copy
    const textareaValue = await popup.locator('textarea').inputValue();
    expect(textareaValue).toBe(title);

    // Decode the base64 PNG and verify pixel content
    const base64Data = title.replace('data:image/png;base64,', '');
    const buffer = Buffer.from(base64Data, 'base64');
    const png = new PNG(buffer);

    expect(png.width).toBe(2);
    expect(png.height).toBe(2);

    const pixels = png.decodePixels();
    expect(rgbaAt(pixels, 2, 0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });   // R
    expect(rgbaAt(pixels, 2, 1, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });   // G
    expect(rgbaAt(pixels, 2, 0, 1)).toEqual({ r: 0, g: 0, b: 255, a: 255 });   // B
    expect(rgbaAt(pixels, 2, 1, 1)).toEqual({ r: 0, g: 0, b: 0, a: 0 });       // T

    await popup.close();
  });

  test('should export PixiJS ZIP with PNG and JSON metadata', async ({ page }) => {
    await openEditor(page);

    // Create 2 frames of 2x2: frame 0 = R G / B T, frame 1 = empty
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);
    await page.keyboard.press('n');

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Ensure inline image is unchecked (external PNG file in ZIP)
    const inlineCheckbox = page.locator('#png-pixi-inline-image');
    if (await inlineCheckbox.isChecked()) {
      await inlineCheckbox.uncheck();
    }

    const downloadPromise = page.waitForEvent('download');
    await page.click('.png-pixi-download-button');
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    expect(download.suggestedFilename()).toBe('test.zip');

    const buffer = await fs.readFile(path);
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries().map(e => e.entryName).sort();

    // Should contain a JSON and a PNG file
    expect(entries).toEqual(['test.json', 'test.png']);

    // Verify JSON metadata
    const jsonContent = zip.getEntry('test.json')!.getData().toString('utf-8');
    const meta = JSON.parse(jsonContent);

    // meta.meta should reference the PNG file
    expect(meta.meta.image).toBe('test.png');
    expect(meta.meta.format).toBe('RGBA8888');
    expect(meta.meta.size.w).toBe(2); // 1 column × 2px
    expect(meta.meta.size.h).toBe(4); // 2 rows × 2px

    // frames should have 2 entries with correct frame rects
    const frameKeys = Object.keys(meta.frames);
    expect(frameKeys.length).toBe(2);

    const frame0 = meta.frames['test0.png'];
    expect(frame0.frame).toEqual({ x: 0, y: 0, w: 2, h: 2 });
    expect(frame0.sourceSize).toEqual({ w: 2, h: 2 });

    const frame1 = meta.frames['test1.png'];
    expect(frame1.frame).toEqual({ x: 0, y: 2, w: 2, h: 2 });

    // Verify the PNG spritesheet pixels
    const pngBuffer = zip.getEntry('test.png')!.getData();
    const png = new PNG(pngBuffer);
    expect(png.width).toBe(2);
    expect(png.height).toBe(4);

    const pixels = png.decodePixels();
    // Frame 0 (top): R G / B T
    expect(rgbaAt(pixels, 2, 0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(rgbaAt(pixels, 2, 1, 0)).toEqual({ r: 0, g: 255, b: 0, a: 255 });
    expect(rgbaAt(pixels, 2, 0, 1)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
    expect(rgbaAt(pixels, 2, 1, 1)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    // Frame 1 (bottom): all transparent
    expect(rgbaAt(pixels, 2, 0, 2)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(rgbaAt(pixels, 2, 1, 3)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  test('should export PixiJS ZIP with inline data-uri', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="png"]');
    await expect(page.locator('.export-panel-png')).toBeAttached();

    // Enable inline image
    const inlineCheckbox = page.locator('#png-pixi-inline-image');
    if (!(await inlineCheckbox.isChecked())) {
      await inlineCheckbox.check();
    }

    const downloadPromise = page.waitForEvent('download');
    await page.click('.png-pixi-download-button');
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries().map(e => e.entryName);

    // With inline image, ZIP should only contain the JSON (no separate PNG)
    expect(entries).toEqual(['test.json']);

    const jsonContent = zip.getEntry('test.json')!.getData().toString('utf-8');
    const meta = JSON.parse(jsonContent);

    // meta.meta.image should be a data-uri instead of a filename
    expect(meta.meta.image).toMatch(/^data:image\/png;base64,/);
    expect(meta.meta.format).toBe('RGBA8888');
    expect(Object.keys(meta.frames).length).toBe(1);
  });
});
