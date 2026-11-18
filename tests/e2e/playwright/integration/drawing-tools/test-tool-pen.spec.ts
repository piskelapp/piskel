import test from "@playwright/test";
import {
  clickTool,
  dragBetweenPixels,
  drawAtPixel,
  openEditor,
  setPiskelFromGrid,
  waitForGrid,
  gridFromRows,
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

test.describe('Pen tool', () => {

  test('pen tool: draws single pixels', { tag: ['@drawing-tools.pen'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');

    await drawAtPixel(page, 2, 2);
    await drawAtPixel(page, 5, 5);
    await drawAtPixel(page, 7, 3);

    await waitForGrid(page, 10, 10, [
      '..........',
      '..........',
      '..X.......',
      '.......X..',
      '..........',
      '.....X....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('pen tool: draws without gaps when the mouse moves fast', { tag: ['@drawing-tools.pen'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');

    // Drag across the sprite in a single mouse move: the pen only gets the two ends.
    await dragBetweenPixels(page, 0, 4, 9, 4, { steps: 1 });
    await waitForGrid(page, 10, 10, [
      '..........',
      '..........',
      '..........',
      '..........',
      'XXXXXXXXXX',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // The same, diagonally.
    await dragBetweenPixels(page, 0, 0, 9, 9, { steps: 1 });
    await waitForGrid(page, 10, 10, [
      'X.........',
      '.X........',
      '..X.......',
      '...X......',
      'XXXXXXXXXX',
      '.....X....',
      '......X...',
      '.......X..',
      '........X.',
      '.........X',
    ]);
  });
});
