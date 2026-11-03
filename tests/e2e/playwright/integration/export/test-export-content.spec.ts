import test, { expect } from "@playwright/test";
import {
  assertHiddenFrames,
  clickTool,
  createThreeFrames,
  downloadGifExport,
  downloadPngExport,
  drawAtPixel,
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
} from "../../testutils";

test.describe('Export content', () => {

  test('exports should compose all layers', { tag: ['@export.content'] }, async ({ page }) => {
    // Start from a sprite with red pixels in the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['R', 'T'],
    ]);

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
      'K....K....K.',
      '............',
      '............',
      '............',
    ]);

    // The GIF has the three frames too.
    expect((await downloadGifExport(page)).frames).toEqual([
      ['K...', '....', '....', '....'],
      ['.K..', '....', '....', '....'],
      ['..K.', '....', '....', '....'],
    ]);
  });
});
