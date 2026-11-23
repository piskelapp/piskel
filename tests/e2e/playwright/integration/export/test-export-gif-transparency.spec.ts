import test, { expect, Page } from "@playwright/test";
import {
  assertCurrentLayer,
  clickTool,
  downloadGifExport,
  drawAtPixel,
  getAddLayerButton,
  getCurrentPiskelColorCount,
  importPiskelFile,
  openEditor,
  openExportSettingsPanel,
  readPixelGrid,
  readPixelRows,
  selectExportTab,
  setPiskelFromGrid,
  setPrimaryColor,
  setTopLayerOpacity,
  waitFor,
  testId,
  gridFromColorRows,
} from "../../testutils";

const TOO_MANY_COLORS = 'misc/gif-tests/too-many-colors-with-transparency.piskel';
const LOW_COLORS = 'misc/gif-tests/low-colors-with-transparency.piskel';

/** Check that a color is white, or close to it as the GIF may reduce its colors */
function expectNearlyWhite(color: number[]) {
  for (const component of color) {
    expect(component).toBeGreaterThanOrEqual(250);
  }
}

/** Import a sample sprite and wait for its colors to be counted */
async function importSpriteAndCountColors(page: Page, path: string) {
  await importPiskelFile(page, path);
  await waitFor(async () => (await getCurrentPiskelColorCount(page)) > 0);
}

test.describe('GIF transparency', () => {

  test('a sprite with few colors should keep its transparency', { tag: ['@export.gif-transparency'] }, async ({ page }) => {
    // Start from a sprite with few colors and empty pixels.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'R.',
      '.B',
    ]));

    // Download the GIF.
    await openExportSettingsPanel(page);
    const gif = await downloadGifExport(page);

    // The colors are kept, and the empty pixels are transparent.
    expect(gif.hasTransparentColor).toBe(true);
    expect(gif.frames).toEqual([[
      'R.',
      '.B',
    ]]);
  });

  test('the transparent color should be a color the sprite does not use', { tag: ['@export.gif-transparency'] }, async ({ page }) => {
    // Start from a sprite using yellow, the first color tried as the transparent color.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(['..']));
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FFFF00');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 2, 1)).toEqual(['X.']);
    await waitFor(async () => (await getCurrentPiskelColorCount(page)) === 1);

    // The yellow pixel stays yellow, and only the empty pixel is transparent.
    await openExportSettingsPanel(page);
    const gif = await downloadGifExport(page);
    expect(gif.hasTransparentColor).toBe(true);
    expect(gif.frames).toEqual([['Y.']]);
  });

  test('a layer below full opacity should render transparent pixels on white', { tag: ['@export.gif-transparency'] }, async ({ page }) => {
    // Start from an empty sprite with a top layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(['..']));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    // Draw in the top layer, at half opacity.
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 2, 1, 1, 0)).toEqual(['X.']);
    await setTopLayerOpacity(page, 0.5);

    // Download the GIF.
    await openExportSettingsPanel(page);
    const gif = await downloadGifExport(page);

    // The GIF has no transparent color: the empty pixel is white.
    expect(gif.hasTransparentColor).toBe(false);
    expectNearlyWhite(gif.rgbAt(0, 1, 0));
  });

  test('a sprite with too many colors should render transparent pixels on white', { tag: ['@export.gif-transparency'] }, async ({ page }) => {
    // Import a sprite with too many colors.
    await openEditor(page);
    await importSpriteAndCountColors(page, TOO_MANY_COLORS);
    await waitFor(async () => (await getCurrentPiskelColorCount(page)) >= 256);

    // Find an empty pixel of the sprite.
    const sprite = await readPixelGrid(page, 60, 60);
    const y = sprite.findIndex(row => row.includes('.'));
    const x = sprite[y].indexOf('.');

    // Download the GIF.
    await openExportSettingsPanel(page);
    const gif = await downloadGifExport(page);

    // The GIF has no transparent color: the empty pixel is white.
    expect(gif.hasTransparentColor).toBe(false);
    expectNearlyWhite(gif.rgbAt(0, x, y));
  });
});

test.describe('GIF warning', () => {

  test('a warning should be shown when the sprite has too many colors', { tag: ['@export.gif-warning'] }, async ({ page }) => {
    // Import a sprite with too many colors.
    await openEditor(page);
    await importSpriteAndCountColors(page, TOO_MANY_COLORS);
    await waitFor(async () => (await getCurrentPiskelColorCount(page)) >= 256);

    // The GIF tab shows the warning.
    await openExportSettingsPanel(page);
    await selectExportTab(page, 'gif');
    await expect(testId(page, 'gif-colors-warning')).toBeVisible();
  });

  test('no warning should be shown when the sprite has few colors', { tag: ['@export.gif-warning'] }, async ({ page }) => {
    // Import a sprite with few colors.
    await openEditor(page);
    await importSpriteAndCountColors(page, LOW_COLORS);
    expect(await getCurrentPiskelColorCount(page)).toBeLessThan(256);

    // The GIF tab doesn't show the warning.
    await openExportSettingsPanel(page);
    await selectExportTab(page, 'gif');
    await expect(testId(page, 'gif-export-panel')).toBeVisible();
    await expect(testId(page, 'gif-colors-warning')).not.toBeVisible();
  });
});
