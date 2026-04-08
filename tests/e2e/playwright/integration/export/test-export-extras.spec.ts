import test, { expect, Page } from '../../fixtures';
import {
  openEditor,
  openExportSettingsPanel,
  setPiskelFromGrid,
  setPrimaryColor,
  clickTool,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  getFrameTiles,
  wait,
  waitFor,
} from "../../testutils";
import PNG from 'png-ts';
import { parseGIF, decompressFrames } from 'gifuct-js';
import fs from 'fs/promises';

/** Switch to a specific export tab */
async function selectExportTab(page: Page, tabName: string) {
  await page.click(`.export-tab[data-tab-id="${tabName}"]`);
  await wait(200);
}

test.describe('Export extras — GIF loop toggle', () => {

  test('GIF repeat checkbox should be present and toggleable', async ({ page }) => {
    await openEditor(page);
    await openExportSettingsPanel(page);
    await selectExportTab(page, 'gif');

    const repeatCheckbox = page.locator('.gif-repeat-checkbox');
    await expect(repeatCheckbox).toBeVisible();

    // Check default state
    const initialState = await repeatCheckbox.isChecked();

    // Toggle it
    if (initialState) {
      await repeatCheckbox.uncheck();
      await expect(repeatCheckbox).not.toBeChecked();
    } else {
      await repeatCheckbox.check();
      await expect(repeatCheckbox).toBeChecked();
    }

    // Toggle back
    if (initialState) {
      await repeatCheckbox.check();
      await expect(repeatCheckbox).toBeChecked();
    } else {
      await repeatCheckbox.uncheck();
      await expect(repeatCheckbox).not.toBeChecked();
    }
  });

  test('downloading a GIF should produce a valid file', async ({ page }) => {
    await openEditor(page);

    // Create 2 frames with different colors so the GIF has animation
    await setPiskelFromGrid(page, [['R', 'T'], ['T', 'R']]);
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await setPrimaryColor(page, '#0000FF');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await wait(200);

    await openExportSettingsPanel(page);
    await selectExportTab(page, 'gif');

    // Download the GIF
    const downloadPromise = page.waitForEvent('download');
    await page.locator('.gif-download-button').click();
    const download = await downloadPromise;

    // Verify filename ends with .gif
    expect(download.suggestedFilename()).toMatch(/\.gif$/i);

    // Parse GIF and verify frames
    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Download path is null');
    const fileData = await fs.readFile(downloadPath);
    expect(fileData.length).toBeGreaterThan(0);

    // GIF magic bytes: "GIF89a" or "GIF87a"
    const header = fileData.subarray(0, 6).toString('ascii');
    expect(header).toMatch(/^GIF8[79]a$/);

    // Decode and verify frame content
    const gif = parseGIF(fileData as unknown as ArrayBuffer);
    const frames = decompressFrames(gif, true);

    // Should have 2 frames
    expect(frames.length).toBe(2);

    // Frame dimensions should match the 2x2 canvas
    expect(frames[0].dims.width).toBe(2);
    expect(frames[0].dims.height).toBe(2);

    // Frame 0 pixel (0,0) should be red (from setPiskelFromGrid R)
    const frame0Color = frames[0].colorTable[frames[0].pixels[0]].toString();
    expect(frame0Color).toBe('255,0,0');
  });
});

test.describe('Export extras — ZIP layer names', () => {

  test('use layer names checkbox should appear when split by layers is checked', async ({ page }) => {
    await openEditor(page);

    // Need 2 layers for split-by-layers to be meaningful
    await setPiskelFromGrid(page, [['R', 'T'], ['T', 'R']]);
    await getAddLayerButton(page).click();
    await wait(300);

    await openExportSettingsPanel(page);
    await selectExportTab(page, 'zip');

    const splitLayersCheckbox = page.locator('.zip-split-layers-checkbox');
    const useLayerNamesContainer = page.locator('.use-layer-names-container');
    const useLayerNamesCheckbox = page.locator('.zip-use-layer-names-checkbox');

    // Initially split-layers is unchecked → layer names container hidden
    await expect(splitLayersCheckbox).not.toBeChecked();
    await expect(useLayerNamesContainer).toBeHidden();

    // Check split-layers → layer names checkbox should appear
    await splitLayersCheckbox.check();
    await wait(200);
    await expect(useLayerNamesContainer).toBeVisible();
    await expect(useLayerNamesCheckbox).toBeVisible();

    // Toggle the layer names checkbox
    await useLayerNamesCheckbox.check();
    await expect(useLayerNamesCheckbox).toBeChecked();

    // Uncheck split-layers → layer names hidden again
    await splitLayersCheckbox.uncheck();
    await wait(200);
    await expect(useLayerNamesContainer).toBeHidden();
  });
});

test.describe('Export extras — scale slider', () => {

  test('scale slider should sync with width/height inputs', async ({ page }) => {
    await openEditor(page);

    // Use a known 2x2 canvas with R at (0,0)
    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['T', 'T'],
    ]);

    await openExportSettingsPanel(page);

    const widthInput = page.locator('.export-resize .resize-width');
    const heightInput = page.locator('.export-resize .resize-height');

    // Default scale should be 1 → width/height = 2x2
    await expect(widthInput).toHaveValue('2');
    await expect(heightInput).toHaveValue('2');

    // Change scale to 2 → width/height should become 4x4
    await page.evaluate(() => {
      const slider = document.querySelector('.export-scale .scale-input') as HTMLInputElement;
      slider.value = '2';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      slider.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await wait(300);

    await expect(widthInput).toHaveValue('4');
    await expect(heightInput).toHaveValue('4');

    // Download scaled PNG and verify dimensions
    await selectExportTab(page, 'png');
    await wait(300);
    const dimensionInfo = await page.locator('.png-export-dimension-info').innerText();
    expect(dimensionInfo).toContain('4');

    const downloadPromise = page.waitForEvent('download');
    await page.locator('.png-download-button').click();
    const download = await downloadPromise;
    const dlPath = await download.path();
    if (!dlPath) throw new Error('Download path is null');

    const pngData = await fs.readFile(dlPath);
    const png = new PNG(pngData);

    // 2x2 canvas scaled 2x → 4x4 PNG
    expect(png.width).toBe(4);
    expect(png.height).toBe(4);

    // Verify pixel grid matches expected scaled pattern
    const pixels = png.decodePixels();
    const grid: string[][] = [];
    for (let y = 0; y < png.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < png.width; x++) {
        const i = (y * png.width + x) * 4;
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2], a = pixels[i + 3];
        row.push(r === 255 && g === 0 && b === 0 && a === 255 ? 'R' : 'T');
      }
      grid.push(row);
    }

    // Red pixel at (0,0) scaled 2x → 2x2 block at top-left
    expect(grid).toEqual([
      ['R', 'R', 'T', 'T'],
      ['R', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
  });

  test('changing width input should update scale and height', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await openExportSettingsPanel(page);

    const widthInput = page.locator('.export-resize .resize-width');
    const heightInput = page.locator('.export-resize .resize-height');
    const scaleText = page.locator('.export-scale .scale-text');

    // Type 8 into width (2x scale for 4x4 canvas)
    await widthInput.fill('8');
    await widthInput.dispatchEvent('change');
    await wait(300);

    // Height should sync to 8 (maintaining 1:1 ratio)
    await expect(heightInput).toHaveValue('8');

    // Scale text should show 2x
    const text = await scaleText.innerText();
    expect(text).toContain('2');
  });
});
