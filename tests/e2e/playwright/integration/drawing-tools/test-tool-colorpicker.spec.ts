import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  clickTool,
  colorToInt,
  rightClickAtPixel,
  drawAtPixel,
  getPixelColor,
  getPrimaryColor,
  getSecondaryColor,
  gridFromColorRows,
  openEditor,
  setPiskelFromGrid,
} from "../../testutils";

test.describe('Color picker tool', () => {

  test('color picker tool: picks color from canvas', { tag: ['@drawing-tools.color-picker'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ["R", "R", "G", "G", "R", "R", "G", "G", "R", "R"],
      ["R", "R", "G", "G", "R", "R", "G", "G", "R", "R"],
      ["G", "G", "T", "T", "G", "G", "T", "T", "G", "G"],
      ["G", "G", "T", "T", "G", "G", "T", "T", "G", "G"],
      ["R", "R", "G", "G", "R", "R", "G", "G", "R", "R"],
      ["R", "R", "G", "G", "R", "R", "G", "G", "R", "R"],
      ["G", "G", "T", "T", "G", "G", "T", "T", "G", "G"],
      ["G", "G", "T", "T", "G", "G", "T", "T", "G", "G"],
      ["R", "R", "G", "G", "R", "R", "G", "G", "R", "R"],
      ["R", "R", "G", "G", "R", "R", "G", "G", "R", "R"],
    ]);

    // Pick green from (2,1)
    await clickTool(page, 'tool-colorpicker');
    await drawAtPixel(page, 2, 1);

    // Draw with picked color in transparent area
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 3, 3);

    expect(await getPixelColor(page, 3, 3)).toBe(colorToInt('#00FF00'));
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
