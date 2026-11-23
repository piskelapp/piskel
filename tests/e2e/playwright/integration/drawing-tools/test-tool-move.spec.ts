import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  assertCurrentLayer,
  clickTool,
  dragBetweenPixels,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  assertFrameCount,
  selectFrame,
  gridFromRows,
  openEditor,
  readPixelRows,
  setPiskelFromGrid,
  waitForGrid,
  gridFromColorRows,
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

/** 10x10 frames with a single pixel */
const PIXEL_AT_1_1 = [
  '..........',
  '.X........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_1_3 = [
  '..........',
  '..........',
  '..........',
  '.X........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_3_1 = [
  '..........',
  '...X......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_3_3 = [
  '..........',
  '..........',
  '..........',
  '...X......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_2_2 = [
  '..........',
  '..........',
  '..X.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_2_4 = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..X.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_4_2 = [
  '..........',
  '..........',
  '....X.....',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXEL_AT_4_4 = [
  '..........',
  '..........',
  '..........',
  '..........',
  '....X.....',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('Move tool', () => {

  test('move tool: shifts content with wrapping and clipping', { tag: ['@drawing-tools.move'] }, async ({ page }) => {
    await openEditor(page);

    // Arrow shape pointing right, near the right edge
    await setPiskelFromGrid(page, gridFromColorRows([
      '..........',
      '......R...',
      '......RR..',
      '..RRRRRRR.',
      '..RRRRRRRR',
      '..RRRRRRR.',
      '......RR..',
      '......R...',
      '..........',
      '..........',
    ]));

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '......X...',
      '......XX..',
      '..XXXXXXX.',
      '..XXXXXXXX',
      '..XXXXXXX.',
      '......XX..',
      '......X...',
      '..........',
      '..........',
    ]);

    // Move right by 3 — parts past the right edge wrap to the left
    await clickTool(page, 'tool-move');
    await dragBetweenPixels(page, 5, 4, 8, 4);

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '.........X',
      '.........X',
      '.....XXXXX',
      '.....XXXXX',
      '.....XXXXX',
      '.........X',
      '.........X',
      '..........',
      '..........',
    ]);

    // Now move left by 6 — content clips/wraps past the left edge
    await dragBetweenPixels(page, 7, 4, 1, 4);

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '...X......',
      '...X......',
      'XXXX......',
      'XXXX......',
      'XXXX......',
      '...X......',
      '...X......',
      '..........',
      '..........',
    ]);
  });

  test('move tool + Alt: wraps content around borders', { tag: ['@drawing-tools.move'] }, async ({ page }) => {
    await openEditor(page);

    // Same arrow shape as the default move test
    await setPiskelFromGrid(page, gridFromColorRows([
      '..........',
      '......R...',
      '......RR..',
      '..RRRRRRR.',
      '..RRRRRRRR',
      '..RRRRRRR.',
      '......RR..',
      '......R...',
      '..........',
      '..........',
    ]));

    // Move right by 3 with Alt held — should WRAP instead of clip
    await clickTool(page, 'tool-move');

    await page.keyboard.down('Alt');
    await dragBetweenPixels(page, 5, 4, 8, 4);
    await page.keyboard.up('Alt');

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '.........X',
      'X........X',
      'XX...XXXXX',
      'XXX..XXXXX',
      'XX...XXXXX',
      'X........X',
      '.........X',
      '..........',
      '..........',
    ]);
  });

  test('move tool + Shift: applies to all frames', { tag: ['@drawing-tools.move'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Draw a pixel at (2,2) in three frames.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 2, 2);
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual(PIXEL_AT_2_2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await drawAtPixel(page, 2, 2);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(PIXEL_AT_2_2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);
    await drawAtPixel(page, 2, 2);
    expect(await readPixelRows(page, 10, 10, 0, 2)).toEqual(PIXEL_AT_2_2);

    // From the first frame, move the pixel 3 to the right. Shift applies it to all frames.
    await selectFrame(page, 0);
    await clickTool(page, 'tool-move');
    await page.keyboard.down('Shift');
    await dragBetweenPixels(page, 2, 2, 5, 2);
    await page.keyboard.up('Shift');

    // The pixel moved in every frame.
    const movedPixel = [
      '..........',
      '..........',
      '.....X....',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ];
    await waitForGrid(page, 10, 10, movedPixel, { frameIndex: 0 });
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(movedPixel);
    expect(await readPixelRows(page, 10, 10, 0, 2)).toEqual(movedPixel);
  });

  test('move tool + Ctrl: applies to all layers', { tag: ['@drawing-tools.move'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Draw a pixel at (2,2) in the bottom layer.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 2, 2);
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual(PIXEL_AT_2_2);

    // Add a top layer, with a pixel at (2,4).
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await drawAtPixel(page, 2, 4);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual(PIXEL_AT_2_4);

    // Move 4 to the right. Ctrl applies it to all layers.
    await clickTool(page, 'tool-move');
    await page.keyboard.down(CMD_OR_CTRL);
    await dragBetweenPixels(page, 2, 3, 6, 3);
    await page.keyboard.up(CMD_OR_CTRL);

    // The pixel moved in both layers.
    await waitForGrid(page, 10, 10, [
      '..........',
      '..........',
      '......X...',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ], { layerIndex: 0 });
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '......X...',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('move tool: moves the current layer only', { tag: ['@drawing-tools.move'] }, async ({ page }) => {
    // Start from a pixel on each of two layers. The top layer is current.
    await openEditor(page);
    const bottomLayer = [
      'X.........',
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
    await setPiskelFromGrid(page, gridFromRows(bottomLayer));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 2);
    expect(await readPixelRows(page, 10, 10, 1)).toEqual([
      '..........',
      '..........',
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Drag the content one pixel to the right.
    await clickTool(page, 'tool-move');
    await dragBetweenPixels(page, 0, 2, 1, 2);

    // Only the top layer moved.
    await waitForGrid(page, 10, 10, [
      '..........',
      '..........',
      '.X........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ], { layerIndex: 1 });
    expect(await readPixelRows(page, 10, 10, 0)).toEqual(bottomLayer);
  });

  test('move tool + Shift + Ctrl: moves every frame of every layer', { tag: ['@drawing-tools.move'] }, async ({ page }) => {
    // A pixel in the first frame of the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(PIXEL_AT_1_1));
    await clickTool(page, 'tool-pen');

    // Add a second frame, with a pixel.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await drawAtPixel(page, 1, 3);
    await waitForGrid(page, 10, 10, PIXEL_AT_1_3, { layerIndex: 0, frameIndex: 1 });

    // Add a top layer, with a pixel in each frame.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await drawAtPixel(page, 3, 3);
    await waitForGrid(page, 10, 10, PIXEL_AT_3_3, { layerIndex: 1, frameIndex: 1 });
    await selectFrame(page, 0);
    await drawAtPixel(page, 3, 1);
    await waitForGrid(page, 10, 10, PIXEL_AT_3_1, { layerIndex: 1, frameIndex: 0 });

    // Drag one pixel down and to the right. Shift applies it to all frames, Ctrl to
    // all layers.
    await clickTool(page, 'tool-move');
    await page.keyboard.down('Shift');
    await page.keyboard.down(CMD_OR_CTRL);
    await dragBetweenPixels(page, 5, 5, 6, 6);
    await page.keyboard.up(CMD_OR_CTRL);
    await page.keyboard.up('Shift');

    // Every pixel moved.
    await waitForGrid(page, 10, 10, PIXEL_AT_2_2, { layerIndex: 0, frameIndex: 0 });
    await waitForGrid(page, 10, 10, PIXEL_AT_2_4, { layerIndex: 0, frameIndex: 1 });
    await waitForGrid(page, 10, 10, PIXEL_AT_4_2, { layerIndex: 1, frameIndex: 0 });
    await waitForGrid(page, 10, 10, PIXEL_AT_4_4, { layerIndex: 1, frameIndex: 1 });
  });
});
