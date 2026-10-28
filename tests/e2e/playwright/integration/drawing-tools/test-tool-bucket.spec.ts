import test, { expect } from "@playwright/test";
import {
  clickTool,
  colorToInt,
  drawAtPixel,
  getPixelColor,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
  setPrimaryColor,
} from "../../testutils";

test.describe('Paint bucket tool', () => {

  test('paint bucket: fills connected transparent area', async ({ page }) => {
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
});
