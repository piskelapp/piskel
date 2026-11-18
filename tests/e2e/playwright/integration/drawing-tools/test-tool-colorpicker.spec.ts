import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  clickTool,
  rightClickAtPixel,
  drawAtPixel,
  getPrimaryColor,
  getSecondaryColor,
  gridFromColorRows,
  openEditor,
  setPiskelFromGrid,
} from "../../testutils";

test.describe('Color picker tool', () => {

  test('color picker tool: picks color from canvas', { tag: ['@drawing-tools.color-picker'] }, async ({ page }) => {
    // Start from a pattern of red, green and transparent squares.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RRGGRRGGRR',
      'RRGGRRGGRR',
      'GG..GG..GG',
      'GG..GG..GG',
      'RRGGRRGGRR',
      'RRGGRRGGRR',
      'GG..GG..GG',
      'GG..GG..GG',
      'RRGGRRGGRR',
      'RRGGRRGGRR',
    ]));

    // Pick the green of (2,1): it becomes the primary color.
    await clickTool(page, 'tool-colorpicker');
    await drawAtPixel(page, 2, 1);
    await expect.poll(() => getPrimaryColor(page)).toBe('#00ff00');

    // The pen draws with it.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 3, 3);
    await assertColorRows(page, [
      'RRGGRRGGRR',
      'RRGGRRGGRR',
      'GG..GG..GG',
      'GG.GGG..GG',
      'RRGGRRGGRR',
      'RRGGRRGGRR',
      'GG..GG..GG',
      'GG..GG..GG',
      'RRGGRRGGRR',
      'RRGGRRGGRR',
    ]);
  });

  test('color picker tool: right-click picks the secondary color', { tag: ['@drawing-tools.color-picker'] }, async ({ page }) => {
    // Start from a red and a green pixel, with the default black primary color.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      '..........',
      '..........',
      '..R.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '.......G..',
      '..........',
      '..........',
    ]));
    expect(await getPrimaryColor(page)).toBe('#000000');

    // Right-click the red pixel.
    await clickTool(page, 'tool-colorpicker');
    await rightClickAtPixel(page, 2, 2);

    // Red becomes the secondary color, and the primary color doesn't change.
    await expect.poll(() => getSecondaryColor(page)).toBe('#ff0000');
    expect(await getPrimaryColor(page)).toBe('#000000');

    // The pen draws red with the right button, and still black with the left one.
    await clickTool(page, 'tool-pen');
    await rightClickAtPixel(page, 5, 5);
    await drawAtPixel(page, 4, 4);
    await assertColorRows(page, [
      '..........',
      '..........',
      '..R.......',
      '..........',
      '....K.....',
      '.....R....',
      '..........',
      '.......G..',
      '..........',
      '..........',
    ]);
  });
});
