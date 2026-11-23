import test, { expect, Page } from "@playwright/test";
import {
  assertFrameCount,
  assertHiddenFrames,
  clickTool,
  createThreeFrames,
  downloadCFileExport,
  downloadGifExport,
  downloadPixiExport,
  downloadPngExport,
  downloadZipExport,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  assertCurrentLayer,
  gridFromRows,
  openEditor,
  openExportSettingsPanel,
  readPixelRows,
  selectExportTab,
  setPiskelFromGrid,
  setPrimaryColor,
  setTopLayerOpacity,
  toggleFrameVisibility,
  testId,
  gridFromColorRows,
} from "../../testutils";

/**
 * Create a 2x1 sprite with two layers and two frames, where the second frame is hidden
 * from the preview. The top layer is at half opacity:
 * - frame 1: red then nothing below, green on both pixels above.
 * - frame 2: nothing below, blue then nothing above.
 */
const createSpriteWithLayersAndHiddenFrame = async (page: Page) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(['X.']));

  // Add a top layer with green pixels.
  await getAddLayerButton(page).click();
  await assertCurrentLayer(page, 1);
  await clickTool(page, 'tool-pen');
  await setPrimaryColor(page, '#00FF00');
  await drawAtPixel(page, 0, 0);
  expect(await readPixelRows(page, 2, 1, 1, 0)).toEqual(['X.']);
  await drawAtPixel(page, 1, 0);
  expect(await readPixelRows(page, 2, 1, 1, 0)).toEqual(['XX']);

  // Add a second frame, with a blue pixel in the top layer.
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 2);
  await setPrimaryColor(page, '#0000FF');
  await drawAtPixel(page, 0, 0);
  expect(await readPixelRows(page, 2, 1, 1, 1)).toEqual(['X.']);

  // Hide this second frame, and lower the opacity of the top layer.
  await toggleFrameVisibility(page, 1);
  await assertHiddenFrames(page, [1]);
  await setTopLayerOpacity(page, 0.5);
};

/** Check a color, allowing for the rounding of half-transparent colors */
const expectColor = (actual: number[], expected: number[]) => {
  actual.forEach((channel, i) => {
    expect(Math.abs(channel - expected[i]), `[${actual}] should be [${expected}]`).toBeLessThanOrEqual(2);
  });
};

test.describe('Export content in other formats', () => {

  for (const { format, download } of [
    { format: 'ZIP', download: downloadZipExport },
    { format: 'PixiJS', download: downloadPixiExport },
    { format: 'C file', download: (page: Page) => downloadCFileExport(page, 2) },
  ]) {
    test(`${format} should compose the layers, with their opacity, and include hidden frames`, { tag: ['@export.content-other-formats'] }, async ({ page }) => {
      await createSpriteWithLayersAndHiddenFrame(page);

      await openExportSettingsPanel(page);
      const exported = await download(page);
      expect(exported.frameCount).toBe(2);

      // First frame: half green over red gives an opaque mix, and over nothing it stays half green.
      expectColor(exported.rgbaAt(0, 0, 0), [128, 128, 0, 255]);
      expectColor(exported.rgbaAt(0, 1, 0), [0, 255, 0, 128]);

      // Hidden frame: half blue over nothing, and then nothing.
      expectColor(exported.rgbaAt(1, 0, 0), [0, 0, 255, 128]);
      expect(exported.rgbaAt(1, 1, 0)).toEqual([0, 0, 0, 0]);
    });
  }
});

test.describe('Export content', () => {

  test('exports should compose all layers', { tag: ['@export.content'] }, async ({ page }) => {
    // Start from a sprite with red pixels in the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'R.',
      'R.',
    ]));

    // Add a top layer with a green pixel over a red one, and another one next to it.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 2, 2, 1, 0)).toEqual([
      'X.',
      '..',
    ]);
    await drawAtPixel(page, 1, 0);
    expect(await readPixelRows(page, 2, 2, 1, 0)).toEqual([
      'XX',
      '..',
    ]);

    // The PNG and the GIF show the top layer over the bottom one.
    const composed = [
      'GG',
      'R.',
    ];
    await openExportSettingsPanel(page);
    expect((await downloadPngExport(page)).rows).toEqual(composed);
    expect((await downloadGifExport(page)).frames).toEqual([composed]);
  });

  test('exports should respect the opacity of the layers', { tag: ['@export.content', '@layers.opacity-rendering'] }, async ({ page }) => {
    // Start from a sprite with a red pixel in the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(['X.']));

    // Add a top layer with green pixels, at half opacity.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 2, 1, 1, 0)).toEqual(['X.']);
    await drawAtPixel(page, 1, 0);
    expect(await readPixelRows(page, 2, 1, 1, 0)).toEqual(['XX']);
    await setTopLayerOpacity(page, 0.5);

    // Download the PNG.
    await openExportSettingsPanel(page);
    const png = await downloadPngExport(page);

    // Over the red pixel, green at half opacity gives an opaque mix of both.
    const [mixR, mixG, mixB, mixA] = png.rgbaAt(0, 0);
    expect(Math.abs(mixR - 128)).toBeLessThanOrEqual(2);
    expect(Math.abs(mixG - 128)).toBeLessThanOrEqual(2);
    expect(mixB).toBe(0);
    expect(mixA).toBe(255);

    // Over nothing, it stays green and half transparent.
    const [greenR, greenG, greenB, greenA] = png.rgbaAt(1, 0);
    expect(greenR).toBe(0);
    expect(Math.abs(greenG - 255)).toBeLessThanOrEqual(2);
    expect(greenB).toBe(0);
    expect(Math.abs(greenA - 128)).toBeLessThanOrEqual(2);
  });

  test('exports should include frames hidden from the preview', { tag: ['@export.content'] }, async ({ page }) => {
    // Start from a sprite with three frames.
    await openEditor(page);
    await createThreeFrames(page);

    // Hide the second frame.
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);

    await openExportSettingsPanel(page);

    // The spritesheet has the three frames, on a single row.
    await selectExportTab(page, 'png');
    await testId(page, 'png-columns-input').fill('3');
    expect((await downloadPngExport(page)).rows).toEqual([
      'K..........K..........K.......',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
      '..............................',
    ]);

    // The GIF has the three frames too.
    expect((await downloadGifExport(page)).frames).toEqual([
      [
        'K.........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
      [
        '.K........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
      [
        '..K.......',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    ]);
  });
});
