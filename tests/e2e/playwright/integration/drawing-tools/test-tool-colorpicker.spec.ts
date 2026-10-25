import test, { expect } from "@playwright/test";
import {
  clickTool,
  colorToInt,
  drawAtPixel,
  getPixelColor,
  openEditor,
  setPiskelFromGrid,
} from "../../testutils";

test.describe('Color picker tool', () => {

  test('color picker tool: picks color from canvas', async ({ page }) => {
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
});
