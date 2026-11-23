import test from "@playwright/test";
import {
  clickTool,
  dragBetweenPixels,
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

test.describe('Stroke tool', () => {

  test('stroke tool: draws a line between two points', { tag: ['@drawing-tools.stroke'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-stroke');

    // Horizontal line from (1,2) to (8,2)
    await dragBetweenPixels(page, 1, 2, 8, 2);

    await waitForGrid(page, 10, 10, [
      '..........',
      '..........',
      '.XXXXXXXX.',  // row 2: horizontal stroke
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('stroke tool + Shift: snaps to straight lines', { tag: ['@drawing-tools.stroke'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-stroke');

    // Diagonal drag from (1,1) to (7,5) with Shift held → snaps to 45° diagonal
    await page.keyboard.down('Shift');
    await dragBetweenPixels(page, 1, 1, 7, 5);
    await page.keyboard.up('Shift');

    // Now add a second Shift stroke: horizontal snap: drag from (1,7) to (6,8) → snaps to horizontal
    await page.keyboard.down('Shift');
    await dragBetweenPixels(page, 1, 7, 6, 8);
    await page.keyboard.up('Shift');

    await waitForGrid(page, 10, 10, [
      '..........',
      '.X........',
      '..X.......',
      '...X......',
      '....X.....',
      '.....X....',
      '......X...',
      '.XXXXXXX..',
      '..........',
      '..........',
    ]);
  });
});
