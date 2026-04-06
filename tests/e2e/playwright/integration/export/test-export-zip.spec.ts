import test, { expect } from '../../fixtures';
import { openEditor, openExportSettingsPanel, setPiskelFromGrid, testId, clickTool, setPrimaryColor, drawAtPixel, getAddLayerButton } from "../../testutils";
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import PNG from 'png-ts';

/** Read RGBA at (x,y) from decoded PNG pixel data */
function rgbaAt(pixels: Uint8Array, width: number, x: number, y: number) {
  const i = (y * width + x) * 4;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2], a: pixels[i + 3] };
}

const R = { r: 255, g: 0, b: 0, a: 255 };
const G = { r: 0, g: 255, b: 0, a: 255 };
const B = { r: 0, g: 0, b: 255, a: 255 };
const T = { r: 0, g: 0, b: 0, a: 0 };

/** Draw frame 1 with G B / T G pattern using real UI interactions */
async function fillFrame1(page: import('@playwright/test').Page) {
  await clickTool(page, 'tool-pen');
  await setPrimaryColor(page, '#00FF00');
  await drawAtPixel(page, 0, 0);
  await setPrimaryColor(page, '#0000FF');
  await drawAtPixel(page, 1, 0);
  await setPrimaryColor(page, '#00FF00');
  await drawAtPixel(page, 1, 1);
}

test.describe('ZIP export', () => {

  test('should export ZIP with one PNG per frame and correct pixels', async ({ page }) => {
    await openEditor(page);
    // Frame 0: R G / B T
    await setPiskelFromGrid(page, [["R", "G"], ["B", "T"]]);

    // Frame 1: G B / T G
    await page.keyboard.press('n');
    await fillFrame1(page);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="zip"]');
    await expect(page.locator('.export-panel-zip')).toBeAttached();

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'zip-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    expect(download.suggestedFilename()).toMatch(/\.zip$/);

    const buffer = await fs.readFile(path);
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    // 2 frames = 2 PNG files
    expect(entries.length).toBe(2);
    expect(entries.every(e => e.entryName.endsWith('.png'))).toBe(true);

    // Verify frame 0: R G / B T
    const f0 = new PNG(entries[0].getData());
    expect(f0.width).toBe(2);
    expect(f0.height).toBe(2);
    const f0px = f0.decodePixels();
    expect(rgbaAt(f0px, 2, 0, 0)).toEqual(R);
    expect(rgbaAt(f0px, 2, 1, 0)).toEqual(G);
    expect(rgbaAt(f0px, 2, 0, 1)).toEqual(B);
    expect(rgbaAt(f0px, 2, 1, 1)).toEqual(T);

    // Verify frame 1: G B / T G
    const f1 = new PNG(entries[1].getData());
    expect(f1.width).toBe(2);
    expect(f1.height).toBe(2);
    const f1px = f1.decodePixels();
    expect(rgbaAt(f1px, 2, 0, 0)).toEqual(G);
    expect(rgbaAt(f1px, 2, 1, 0)).toEqual(B);
    expect(rgbaAt(f1px, 2, 0, 1)).toEqual(T);
    expect(rgbaAt(f1px, 2, 1, 1)).toEqual(G);
  });

  test('should export ZIP with custom prefix', async ({ page }) => {
    await openEditor(page);
    // Frame 0: R T / T R
    await setPiskelFromGrid(page, [["R", "T"], ["T", "R"]]);

    // Frame 1: G B / T G
    await page.keyboard.press('n');
    await fillFrame1(page);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="zip"]');
    await expect(page.locator('.export-panel-zip')).toBeAttached();

    // Set custom prefix
    const prefixInput = page.locator('.zip-prefix-name');
    await prefixInput.fill('mysprite_');

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'zip-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    expect(entries.length).toBe(2);
    expect(entries.every(e => e.entryName.startsWith('mysprite_'))).toBe(true);

    // Verify frame 0: R T / T R
    const f0px = new PNG(entries[0].getData()).decodePixels();
    expect(rgbaAt(f0px, 2, 0, 0)).toEqual(R);
    expect(rgbaAt(f0px, 2, 1, 0)).toEqual(T);
    expect(rgbaAt(f0px, 2, 0, 1)).toEqual(T);
    expect(rgbaAt(f0px, 2, 1, 1)).toEqual(R);

    // Verify frame 1: G B / T G
    const f1px = new PNG(entries[1].getData()).decodePixels();
    expect(rgbaAt(f1px, 2, 0, 0)).toEqual(G);
    expect(rgbaAt(f1px, 2, 1, 0)).toEqual(B);
    expect(rgbaAt(f1px, 2, 0, 1)).toEqual(T);
    expect(rgbaAt(f1px, 2, 1, 1)).toEqual(G);
  });

  test('should export ZIP split by layers with correct content', async ({ page }) => {
    await openEditor(page);
    // Layer 0: R T / T R
    await setPiskelFromGrid(page, [["R", "T"], ["T", "R"]]);

    // Add layer 1 and draw: T G / B T
    await getAddLayerButton(page).click();
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 0);
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 1);

    await openExportSettingsPanel(page);
    await page.click('[data-tab-id="zip"]');
    await expect(page.locator('.export-panel-zip')).toBeAttached();

    // Enable split by layers
    await page.locator('#zip-split-layers').check();

    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'zip-download-button').click();
    const download = await downloadPromise;

    const path = await download.path();
    if (!path) throw new Error('Download path is null');

    const buffer = await fs.readFile(path);
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    // 2 layers × 1 frame = 2 PNG files
    expect(entries.length).toBe(2);

    // Layer 0: R T / T R
    const l0px = new PNG(entries[0].getData()).decodePixels();
    expect(rgbaAt(l0px, 2, 0, 0)).toEqual(R);
    expect(rgbaAt(l0px, 2, 1, 0)).toEqual(T);
    expect(rgbaAt(l0px, 2, 0, 1)).toEqual(T);
    expect(rgbaAt(l0px, 2, 1, 1)).toEqual(R);

    // Layer 1: T G / B T
    const l1px = new PNG(entries[1].getData()).decodePixels();
    expect(rgbaAt(l1px, 2, 0, 0)).toEqual(T);
    expect(rgbaAt(l1px, 2, 1, 0)).toEqual(G);
    expect(rgbaAt(l1px, 2, 0, 1)).toEqual(B);
    expect(rgbaAt(l1px, 2, 1, 1)).toEqual(T);
  });
});
