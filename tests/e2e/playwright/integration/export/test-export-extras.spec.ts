import test, { expect } from "@playwright/test";
import fs from 'fs/promises';
import {
  assertColorRows,
  assertCurrentLayer,
  assertFrameCount,
  clickTool,
  downloadGifExport,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  gridFromColorRows,
  openEditor,
  openExportSettingsPanel,
  readPngColorRows,
  selectExportTab,
  setPiskelFromGrid,
  setPrimaryColor,
  testId,
} from "../../testutils";

// The sprites are 2x2 or 4x4, so that the exported images read at a glance.

/** A 2x2 sprite with two red pixels on a diagonal */
const RED_DIAGONAL = [
  'R.',
  '.R',
];

test.describe('Export extras — GIF loop toggle', () => {

  test('GIF repeat checkbox should be present and toggleable', { tag: ['@export.gif-loop'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_DIAGONAL));
    await openExportSettingsPanel(page);
    await selectExportTab(page, 'gif');

    // The GIF loops by default: it holds the NETSCAPE2.0 block that sets the loops.
    const repeatCheckbox = testId(page, 'gif-loop-checkbox');
    await expect(repeatCheckbox).toBeChecked();
    expect((await downloadGifExport(page)).file.includes('NETSCAPE2.0')).toBe(true);

    // Uncheck it: the GIF plays once.
    await repeatCheckbox.uncheck();
    await expect(repeatCheckbox).not.toBeChecked();
    expect((await downloadGifExport(page)).file.includes('NETSCAPE2.0')).toBe(false);

    // Check it again: the GIF loops again.
    await repeatCheckbox.check();
    await expect(repeatCheckbox).toBeChecked();
    expect((await downloadGifExport(page)).file.includes('NETSCAPE2.0')).toBe(true);
  });

  test('downloading a GIF should produce a valid file', { tag: ['@export.gif'] }, async ({ page }) => {
    // A frame with two red pixels, and a second one with a blue pixel.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_DIAGONAL));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await setPrimaryColor(page, '#0000FF');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await assertColorRows(page, [
      'B.',
      '..',
    ], { frameIndex: 1 });

    // Download the GIF.
    await openExportSettingsPanel(page);
    await selectExportTab(page, 'gif');
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'gif-download-button').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.gif$/i);

    // It's a GIF file, starting with "GIF87a" or "GIF89a".
    const file = await fs.readFile(await download.path());
    expect(file.subarray(0, 6).toString('ascii')).toMatch(/^GIF8[79]a$/);

    // It has both frames.
    const { frames } = await downloadGifExport(page);
    expect(frames).toEqual([
      RED_DIAGONAL,
      [
        'B.',
        '..',
      ],
    ]);
  });
});

test.describe('Export extras — ZIP layer names', () => {

  test('use layer names checkbox should appear when split by layers is checked', { tag: ['@export.zip-layer-names'] }, async ({ page }) => {
    // A sprite with two layers, so that splitting by layers makes sense.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_DIAGONAL));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    await openExportSettingsPanel(page);
    await selectExportTab(page, 'zip');
    const splitLayersCheckbox = page.locator('.zip-split-layers-checkbox');
    const useLayerNamesContainer = page.locator('.use-layer-names-container');
    const useLayerNamesCheckbox = page.locator('.zip-use-layer-names-checkbox');

    // Splitting by layers is off by default, and the layer names option is hidden.
    await expect(splitLayersCheckbox).not.toBeChecked();
    await expect(useLayerNamesContainer).toBeHidden();

    // Split by layers: the layer names option shows, and can be checked.
    await splitLayersCheckbox.check();
    await expect(useLayerNamesContainer).toBeVisible();
    await useLayerNamesCheckbox.check();
    await expect(useLayerNamesCheckbox).toBeChecked();

    // Stop splitting by layers: the option is hidden again.
    await splitLayersCheckbox.uncheck();
    await expect(useLayerNamesContainer).toBeHidden();
  });
});

test.describe('Export extras — scale slider', () => {

  test('scale slider should sync with width/height inputs', { tag: ['@export.scale', '@export.resolution'] }, async ({ page }) => {
    // A 2x2 sprite with a red pixel: at a scale of 1, the export is 2x2.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'R.',
      '..',
    ]));
    await openExportSettingsPanel(page);
    const widthInput = testId(page, 'export-width-input');
    const heightInput = testId(page, 'export-height-input');
    await expect(widthInput).toHaveValue('2');
    await expect(heightInput).toHaveValue('2');

    // A scale of 2 makes it 4x4.
    await testId(page, 'export-scale-slider').fill('2');
    await expect(widthInput).toHaveValue('4');
    await expect(heightInput).toHaveValue('4');

    // The PNG tab shows that size, and the PNG has each pixel twice as large.
    await selectExportTab(page, 'png');
    await expect(page.locator('.png-export-dimension-info')).toContainText('4');
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'png-download-button').click();
    const download = await downloadPromise;
    expect(readPngColorRows(await fs.readFile(await download.path()))).toEqual([
      'RR..',
      'RR..',
      '....',
      '....',
    ]);
  });

  test('changing width input should update scale and height', { tag: ['@export.resolution'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'R...',
      '....',
      '....',
      '....',
    ]));
    await openExportSettingsPanel(page);

    // Type a width of 8, twice the size of the sprite: the height follows, and the
    // scale is 2.
    const widthInput = testId(page, 'export-width-input');
    await widthInput.fill('8');
    await widthInput.dispatchEvent('change');
    await expect(testId(page, 'export-height-input')).toHaveValue('8');
    await expect(testId(page, 'export-scale-text')).toContainText('2');
  });
});
