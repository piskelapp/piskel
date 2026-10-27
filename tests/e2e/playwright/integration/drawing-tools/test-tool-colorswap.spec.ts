import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  colorToInt,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  getFrameTiles,
  getPixelColor,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  wait,
  waitFor,
} from "../../testutils";

test.describe('Color swap tool', () => {

  test('color swap tool: replaces all pixels of one color', async ({ page }) => {
    await openEditor(page);

    // Checkerboard of red and green
    await setPiskelFromGrid(page, [
      ["R", "G", "R", "G"],
      ["G", "R", "G", "R"],
      ["R", "G", "R", "G"],
      ["G", "R", "G", "R"],
    ]);

    // Swap red → blue by clicking a red pixel
    await clickTool(page, 'tool-colorswap');
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 0);  // click on a red pixel

    // All red should now be blue, green unchanged
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 1, 0)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 2, 0)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 0, 1)).toBe(colorToInt('#00FF00'));
  });
});

// ─── ColorSwap tool modifiers ────────────────────────────────────

test.describe('ColorSwap tool modifiers', () => {

  test('ColorSwap should replace all matching pixels on current frame', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T'],
      ['T', 'G', 'T'],
      ['T', 'T', 'R'],
    ]);

    await setPrimaryColor(page, '#0000FF');
    await clickTool(page, 'tool-colorswap');
    await drawAtPixel(page, 0, 0);
    await wait(200);

    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 2, 2)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 1, 1)).toBe(colorToInt('#00FF00'));
  });

  test('ColorSwap + Shift should apply to all frames', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['T', 'T'],
    ]);

    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    await getFrameTiles(page).nth(0).click();
    await wait(200);

    await setPrimaryColor(page, '#0000FF');
    await clickTool(page, 'tool-colorswap');

    await page.keyboard.down('Shift');
    await drawAtPixel(page, 0, 0);
    await page.keyboard.up('Shift');
    await wait(200);

    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 1, 1, 0, 1)).toBe(colorToInt('#0000FF'));
  });

  test('ColorSwap + Ctrl should apply to all layers', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['T', 'T'],
    ]);

    await getAddLayerButton(page).click();
    await wait(200);
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await wait(200);

    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-colorswap');

    await page.keyboard.down(CMD_OR_CTRL);
    await drawAtPixel(page, 1, 1);
    await page.keyboard.up(CMD_OR_CTRL);
    await wait(200);

    expect(await getPixelColor(page, 1, 1, 1, 0)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#00FF00'));
  });
});
