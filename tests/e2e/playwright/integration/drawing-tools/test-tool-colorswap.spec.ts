import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  assertColorRows,
  assertCurrentLayer,
  gridFromColorRows,
  undo,
  clickTool,
  colorToInt,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  getPixelColor,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  wait,
  assertFrameCount,
  selectFrame,
} from "../../testutils";

/** 10x10 frames with a single red or green pixel */
const RED_AT_0_0 = [
  'R.........',
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
const RED_AT_1_1 = [
  '..........',
  '.R........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const RED_AT_2_2 = [
  '..........',
  '..........',
  '..R.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const RED_AT_3_3 = [
  '..........',
  '..........',
  '..........',
  '...R......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const GREEN_AT_0_0 = [
  'G.........',
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
const GREEN_AT_1_1 = [
  '..........',
  '.G........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const GREEN_AT_2_2 = [
  '..........',
  '..........',
  '..G.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const GREEN_AT_3_3 = [
  '..........',
  '..........',
  '..........',
  '...G......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('Color swap tool', () => {

  test('color swap tool: replaces all pixels of one color', { tag: ['@drawing-tools.magic-bucket'] }, async ({ page }) => {
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

  test('ColorSwap should replace all matching pixels on current frame', { tag: ['@drawing-tools.magic-bucket'] }, async ({ page }) => {
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

  test('ColorSwap + Shift should apply to all frames', { tag: ['@drawing-tools.magic-bucket'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T'],
      ['T', 'T'],
    ]);

    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    await selectFrame(page, 0);

    await setPrimaryColor(page, '#0000FF');
    await clickTool(page, 'tool-colorswap');

    await page.keyboard.down('Shift');
    await drawAtPixel(page, 0, 0);
    await page.keyboard.up('Shift');
    await wait(200);

    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 1, 1, 0, 1)).toBe(colorToInt('#0000FF'));
  });

  test('ColorSwap + Ctrl should apply to all layers', { tag: ['@drawing-tools.magic-bucket'] }, async ({ page }) => {
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

  test('magic bucket: replaces transparent pixels too', { tag: ['@drawing-tools.magic-bucket'] }, async ({ page }) => {
    // Start from two red pixels.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      '..........',
      '..........',
      '..R.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '.......R..',
      '..........',
      '..........',
    ]));

    // Click a transparent pixel with green.
    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-colorswap');
    await drawAtPixel(page, 0, 0);

    // Every transparent pixel is now green, even those not connected to the click.
    await assertColorRows(page, [
      'GGGGGGGGGG',
      'GGGGGGGGGG',
      'GGRGGGGGGG',
      'GGGGGGGGGG',
      'GGGGGGGGGG',
      'GGGGGGGGGG',
      'GGGGGGGGGG',
      'GGGGGGGRGG',
      'GGGGGGGGGG',
      'GGGGGGGGGG',
    ]);
  });

  test('magic bucket + Shift + Ctrl: replaces the color in every frame of every layer, in one undo step', {
    tag: ['@drawing-tools.magic-bucket', '@drawing-tools.undo'],
  }, async ({ page }) => {
    // A red pixel in the first frame of the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_AT_0_0));
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');

    // Add a second frame, with a red pixel.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await drawAtPixel(page, 1, 1);
    await assertColorRows(page, RED_AT_1_1, { layerIndex: 0, frameIndex: 1 });

    // Add a top layer, with a red pixel in each frame.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await drawAtPixel(page, 2, 2);
    await assertColorRows(page, RED_AT_2_2, { layerIndex: 1, frameIndex: 1 });
    await selectFrame(page, 0);
    await drawAtPixel(page, 3, 3);
    await assertColorRows(page, RED_AT_3_3, { layerIndex: 1, frameIndex: 0 });

    // Swap red for green. Shift applies it to all frames, Ctrl to all layers.
    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-colorswap');
    await page.keyboard.down('Shift');
    await page.keyboard.down(CMD_OR_CTRL);
    await drawAtPixel(page, 3, 3);
    await page.keyboard.up(CMD_OR_CTRL);
    await page.keyboard.up('Shift');

    // Every red pixel is now green.
    await assertColorRows(page, GREEN_AT_0_0, { layerIndex: 0, frameIndex: 0 });
    await assertColorRows(page, GREEN_AT_1_1, { layerIndex: 0, frameIndex: 1 });
    await assertColorRows(page, GREEN_AT_3_3, { layerIndex: 1, frameIndex: 0 });
    await assertColorRows(page, GREEN_AT_2_2, { layerIndex: 1, frameIndex: 1 });

    // A single undo turns them all back to red.
    await undo(page);
    await assertColorRows(page, RED_AT_0_0, { layerIndex: 0, frameIndex: 0 });
    await assertColorRows(page, RED_AT_1_1, { layerIndex: 0, frameIndex: 1 });
    await assertColorRows(page, RED_AT_3_3, { layerIndex: 1, frameIndex: 0 });
    await assertColorRows(page, RED_AT_2_2, { layerIndex: 1, frameIndex: 1 });
  });
});
