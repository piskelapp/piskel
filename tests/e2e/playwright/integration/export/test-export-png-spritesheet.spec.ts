import test, { expect, Page } from "@playwright/test";
import fs from 'fs/promises';
import AdmZip from 'adm-zip';
import {
  assertColorRows,
  assertFrameCount,
  clickTool,
  drawAtPixel,
  getAddFrameButton,
  gridFromColorRows,
  openEditor,
  openExportSettingsPanel,
  readPngColorRows,
  selectExportTab,
  setPiskelFromGrid,
  setPrimaryColor,
  testId,
} from "../../testutils";

// The sprites are 2x2, so that a spritesheet of several frames still reads at a glance.

/** A 2x2 sprite with a red, a green and a blue pixel */
const RGB_SPRITE = [
  'RG',
  'B.',
];

/** Open the PNG tab of the export panel */
async function openPngExport(page: Page) {
  await openExportSettingsPanel(page);
  await selectExportTab(page, 'png');
  await expect(page.locator('.export-panel-png')).toBeAttached();
}

/** Click a download button, and return the downloaded file */
async function download(page: Page, click: () => Promise<void>): Promise<{ name: string; file: Buffer }> {
  const downloadPromise = page.waitForEvent('download');
  await click();
  const result = await downloadPromise;
  return { name: result.suggestedFilename(), file: await fs.readFile(await result.path()) };
}

/** Add a frame, and fill it with a color using the paint bucket */
async function addFrameFilledWith(page: Page, color: string, frameCount: number) {
  await getAddFrameButton(page).click();
  await assertFrameCount(page, frameCount);
  await setPrimaryColor(page, color);
  await clickTool(page, 'tool-paint-bucket');
  await drawAtPixel(page, 0, 0);
}

/** Four frames: red, green, blue and empty */
async function createRedGreenBlueEmptyFrames(page: Page) {
  await setPiskelFromGrid(page, gridFromColorRows([
    'RR',
    'RR',
  ]));
  await addFrameFilledWith(page, '#00FF00', 2);
  await assertColorRows(page, [
    'GG',
    'GG',
  ], { frameIndex: 1 });
  await addFrameFilledWith(page, '#0000FF', 3);
  await assertColorRows(page, [
    'BB',
    'BB',
  ], { frameIndex: 2 });
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 4);
}

test.describe('PNG spritesheet export', () => {

  test('should export multi-frame spritesheet with correct pixels', { tag: ['@export.png-spritesheet', '@export.png-download'] }, async ({ page }) => {
    // A first frame with three colors, and a second one with two green pixels.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RGB_SPRITE));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await drawAtPixel(page, 1, 1);
    await assertColorRows(page, [
      'G.',
      '.G',
    ], { frameIndex: 1 });

    // Export them side by side, in 2 columns and 1 row.
    await openPngExport(page);
    await testId(page, 'png-columns-input').fill('2');
    await expect(page.locator('[name="png-export-rows"]')).toHaveValue('1');
    const { name, file } = await download(page, () => testId(page, 'png-download-button').click());

    expect(name).toBe('test.png');
    expect(readPngColorRows(file)).toEqual([
      'RGG.',
      'B..G',
    ]);
  });

  test('should export single selected frame with correct pixels', { tag: ['@export.png-selected-frame'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'R.',
      '.B',
    ]));

    await openPngExport(page);
    const { file } = await download(page, () => testId(page, 'png-selected-frame-download-button').click());

    expect(readPngColorRows(file)).toEqual([
      'R.',
      '.B',
    ]);
  });

  test('should export vertical strip layout (1 column)', { tag: ['@export.png-spritesheet'] }, async ({ page }) => {
    await openEditor(page);
    await createRedGreenBlueEmptyFrames(page);

    // One column: the rows follow, one per frame.
    await openPngExport(page);
    await testId(page, 'png-columns-input').fill('1');
    await expect(page.locator('[name="png-export-rows"]')).toHaveValue('4');
    const { file } = await download(page, () => testId(page, 'png-download-button').click());

    expect(readPngColorRows(file)).toEqual([
      'RR',
      'RR',
      'GG',
      'GG',
      'BB',
      'BB',
      '..',
      '..',
    ]);
  });

  test('should export 2x2 grid layout (2 columns)', { tag: ['@export.png-spritesheet'] }, async ({ page }) => {
    await openEditor(page);
    await createRedGreenBlueEmptyFrames(page);

    // Two columns: two rows follow.
    await openPngExport(page);
    await testId(page, 'png-columns-input').fill('2');
    await expect(page.locator('[name="png-export-rows"]')).toHaveValue('2');
    const { file } = await download(page, () => testId(page, 'png-download-button').click());

    expect(readPngColorRows(file)).toEqual([
      'RRGG',
      'RRGG',
      'BB..',
      'BB..',
    ]);
  });

  test('should export scaled PNG with correct pixel replication', { tag: ['@export.scale'] }, async ({ page }) => {
    // A sprite of a single red pixel.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(['R']));

    // Export it 10 times larger: the height follows the width.
    await openPngExport(page);
    await testId(page, 'export-width-input').fill('10');
    await expect(testId(page, 'export-height-input')).toHaveValue('10');
    const { file } = await download(page, () => testId(page, 'png-download-button').click());

    expect(readPngColorRows(file)).toEqual([
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
      'RRRRRRRRRR',
    ]);
  });

  test('should export spritesheet as data-uri in popup', { tag: ['@export.png-data-uri'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RGB_SPRITE));

    // Open the data-uri in a popup.
    await openPngExport(page);
    const popupPromise = page.waitForEvent('popup');
    await page.click('.datauri-open-button');
    const popup = await popupPromise;

    // The popup's title, image and text area all hold the data-uri.
    await expect.poll(() => popup.title()).toMatch(/^data:image\/png;base64,/);
    const dataUri = await popup.title();
    await expect(popup.locator('img')).toHaveAttribute('src', dataUri);
    await expect(popup.locator('textarea')).toHaveValue(dataUri);

    // It's the image of the sprite.
    const file = Buffer.from(dataUri.replace('data:image/png;base64,', ''), 'base64');
    expect(readPngColorRows(file)).toEqual(RGB_SPRITE);

    await popup.close();
  });

  test('should export PixiJS ZIP with PNG and JSON metadata', { tag: ['@export.pixi'] }, async ({ page }) => {
    // A frame with three colors, and an empty one.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RGB_SPRITE));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);

    // Export for PixiJS, with the image as a separate file.
    await openPngExport(page);
    await page.locator('#png-pixi-inline-image').setChecked(false);
    const { name, file } = await download(page, () => page.click('.png-pixi-download-button'));
    expect(name).toBe('test.zip');

    // The zip holds a JSON and a PNG file.
    const zip = new AdmZip(file);
    expect(zip.getEntries().map(e => e.entryName).sort()).toEqual(['test.json', 'test.png']);

    // The JSON describes the image, in 1 column of 2 frames, and where each frame is.
    const meta = JSON.parse(zip.getEntry('test.json')!.getData().toString('utf-8'));
    expect(meta.meta.image).toBe('test.png');
    expect(meta.meta.format).toBe('RGBA8888');
    expect(meta.meta.size).toEqual({ w: 2, h: 4 });
    expect(Object.keys(meta.frames)).toHaveLength(2);
    expect(meta.frames['test0.png'].frame).toEqual({ x: 0, y: 0, w: 2, h: 2 });
    expect(meta.frames['test0.png'].sourceSize).toEqual({ w: 2, h: 2 });
    expect(meta.frames['test1.png'].frame).toEqual({ x: 0, y: 2, w: 2, h: 2 });

    // The PNG is the spritesheet.
    expect(readPngColorRows(zip.getEntry('test.png')!.getData())).toEqual([
      'RG',
      'B.',
      '..',
      '..',
    ]);
  });

  test('should export PixiJS ZIP with inline data-uri', { tag: ['@export.pixi'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RGB_SPRITE));

    // Export for PixiJS, with the image inline.
    await openPngExport(page);
    await page.locator('#png-pixi-inline-image').setChecked(true);
    const { file } = await download(page, () => page.click('.png-pixi-download-button'));

    // The zip only holds the JSON, with the image as a data-uri.
    const zip = new AdmZip(file);
    expect(zip.getEntries().map(e => e.entryName)).toEqual(['test.json']);
    const meta = JSON.parse(zip.getEntry('test.json')!.getData().toString('utf-8'));
    expect(meta.meta.image).toMatch(/^data:image\/png;base64,/);
    expect(meta.meta.format).toBe('RGBA8888');
    expect(Object.keys(meta.frames)).toHaveLength(1);

    // The data-uri is the image of the sprite.
    const image = Buffer.from(meta.meta.image.replace('data:image/png;base64,', ''), 'base64');
    expect(readPngColorRows(image)).toEqual(RGB_SPRITE);
  });
});
