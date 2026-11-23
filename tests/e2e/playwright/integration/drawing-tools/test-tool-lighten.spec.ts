import test, { expect, Page } from "@playwright/test";
import {
  CMD_OR_CTRL,
  assertColorRows,
  clickTool,
  colorToInt,
  dragThereAndBack,
  drawAtPixel,
  getPixelColor,
  gridFromColorRows,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
} from "../../testutils";

/** An empty 10x10 frame */
const EMPTY = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

// A lighten click adds 3 points of lightness, or 6 with Shift. Red is at 50%.
// "?" in a grid is a color without a letter, such as a lightened red.

test.describe('Lighten tool', () => {

  test('lighten tool: modifies pixel brightness', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    // Start from a red square.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      '..........',
      '.RR.......',
      '.RR.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));

    // Click one of its pixels with the lighten tool.
    await clickTool(page, 'tool-lighten');
    await drawAtPixel(page, 1, 1);

    // Only that pixel is lighter.
    await assertColorRows(page, [
      '..........',
      '.?R.......',
      '.RR.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    expect(await getPixelColor(page, 1, 1)).toBe(colorToInt('#FF0F0F'));
  });
});

test.describe('Lighten steps', () => {
  /** Open the editor on four red pixels, with the lighten tool */
  const openEditorWithLighten = async (page: Page) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RRRR......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));
    await clickTool(page, 'tool-lighten');
  };

  test('should keep lightening with repeated passes', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditorWithLighten(page);

    // Each click lightens the pixel by another step.
    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0F0F'));
    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF1E1E'));
  });

  test('should lighten once per pixel with shift, with a stronger step', { tag: ['@drawing-tools.lighten-once'] }, async ({ page }) => {
    await openEditorWithLighten(page);

    // Shift applies the lighten only once per pixel. Go over three pixels twice.
    await page.keyboard.down('Shift');
    await dragThereAndBack(page, 0, 0, 2, 0);
    await page.keyboard.up('Shift');

    // Each of them went up by one strong step, and the fourth pixel wasn't touched.
    await assertColorRows(page, [
      '???R......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    const LIGHTENED = colorToInt('#FF1F1F');
    expect(await getPixelColor(page, 0, 0)).toBe(LIGHTENED);
    expect(await getPixelColor(page, 1, 0)).toBe(LIGHTENED);
    expect(await getPixelColor(page, 2, 0)).toBe(LIGHTENED);
  });

  test('should apply again with shift in a new stroke', { tag: ['@drawing-tools.lighten-once'] }, async ({ page }) => {
    await openEditorWithLighten(page);

    // Shift applies the lighten only once per pixel, for each stroke.
    await page.keyboard.down('Shift');
    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF1F1F'));

    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF3E3E'));
    await page.keyboard.up('Shift');
  });
});

// ─── Lighten tool modifiers ──────────────────────────────────────

test.describe('Lighten tool modifiers', () => {
  /** Open the editor on a gray pixel, at 50% lightness, with the lighten tool */
  const openEditorWithGrayPixel = async (page: Page) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(EMPTY));
    await setPrimaryColor(page, '#808080');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await expect.poll(() => getPixelColor(page, 1, 1)).toBe(colorToInt('#808080'));
    await clickTool(page, 'tool-lighten');
  };

  test('Lighten should make a pixel lighter', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditorWithGrayPixel(page);

    // The pixel goes from 50% to 53% lightness.
    await drawAtPixel(page, 1, 1);
    await expect.poll(() => getPixelColor(page, 1, 1)).toBe(colorToInt('#888888'));
  });

  test('Lighten + Ctrl should darken a pixel', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditorWithGrayPixel(page);

    // Ctrl darkens: the pixel goes from 50% to 47% lightness.
    await page.keyboard.down(CMD_OR_CTRL);
    await drawAtPixel(page, 1, 1);
    await page.keyboard.up(CMD_OR_CTRL);
    await expect.poll(() => getPixelColor(page, 1, 1)).toBe(colorToInt('#787878'));
  });
});
