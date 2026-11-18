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

test.describe('Circle tool', () => {

  test('circle tool: draws hollow circle', { tag: ['@drawing-tools.circle'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-circle');

    await dragBetweenPixels(page, 1, 1, 8, 8);

    await waitForGrid(page, 10, 10, [
      '..........',
      '...XXXX...',
      '..X....X..',
      '.X......X.',
      '.X......X.',
      '.X......X.',
      '.X......X.',
      '..X....X..',
      '...XXXX...',
      '..........',
    ]);
  });

  test('circle tool + Shift: constrains to perfect circle', { tag: ['@drawing-tools.circle'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-circle');

    // Drag from (1,1) to (8,5) with Shift — should constrain to a circle with equal width/height
    await page.keyboard.down('Shift');
    await dragBetweenPixels(page, 1, 1, 8, 5);
    await page.keyboard.up('Shift');

    await waitForGrid(page, 10, 10, [
      '..........',
      '..XXX.....',
      '.X...X....',
      '.X...X....',
      '.X...X....',
      '..XXX.....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });
});
