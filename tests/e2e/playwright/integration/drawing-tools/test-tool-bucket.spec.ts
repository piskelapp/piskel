import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  clickTool,
  colorToInt,
  drawAtPixel,
  getPixelColor,
  gridFromColorRows,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
  setPrimaryColor,
} from "../../testutils";

test.describe('Paint bucket tool', () => {

  test('paint bucket: fills connected transparent area', { tag: ['@drawing-tools.paint-bucket'] }, async ({ page }) => {
    await openEditor(page);

    // Red border, transparent inside
    await setPiskelFromGrid(page, [
      ["R", "R", "R", "R", "R", "R"],
      ["R", "T", "T", "T", "T", "R"],
      ["R", "T", "T", "T", "T", "R"],
      ["R", "T", "T", "T", "T", "R"],
      ["R", "T", "T", "T", "T", "R"],
      ["R", "R", "R", "R", "R", "R"],
    ]);

    await clickTool(page, 'tool-paint-bucket');
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 3, 3);

    const grid = await readPixelGrid(page, 6, 6);

    // Interior filled, border unchanged (both show as X since non-transparent)
    const expected = [
      'XXXXXX',  // row 0: red border
      'XXXXXX',  // row 1: red + blue fill
      'XXXXXX',  // row 2
      'XXXXXX',  // row 3
      'XXXXXX',  // row 4
      'XXXXXX',  // row 5: red border
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);

    // Verify colors precisely: border=red, interior=blue
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 3, 3)).toBe(colorToInt('#0000FF'));
  });

  test('paint bucket: does not spread to diagonal pixels', { tag: ['@drawing-tools.paint-bucket'] }, async ({ page }) => {
    // A transparent area inside a red frame. The transparent pixel at (3,3) only
    // touches it by a corner.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RRRR......',
      'R..R......',
      'R..R......',
      'RRR.R.....',
      '...R......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));

    // Fill the area with green.
    await clickTool(page, 'tool-paint-bucket');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);

    // The fill stops at the frame: the pixel at (3,3) and the outside stay transparent.
    await assertColorRows(page, [
      'RRRR......',
      'RGGR......',
      'RGGR......',
      'RRR.R.....',
      '...R......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });
});
