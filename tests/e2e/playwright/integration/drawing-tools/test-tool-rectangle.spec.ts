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

test.describe('Rectangle tool', () => {

  test('rectangle tool: draws hollow outline', { tag: ['@drawing-tools.rectangle'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-rectangle');

    await dragBetweenPixels(page, 1, 1, 8, 8);

    await waitForGrid(page, 10, 10, [
      '..........',
      '.XXXXXXXX.',  // row 1: top edge
      '.X......X.',
      '.X......X.',
      '.X......X.',
      '.X......X.',
      '.X......X.',
      '.X......X.',
      '.XXXXXXXX.',  // row 8: bottom edge
      '..........',
    ]);
  });

  test('rectangle tool + Shift: constrains to square', { tag: ['@drawing-tools.rectangle'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-rectangle');

    // Drag from (1,1) to (8,5) with Shift — should constrain to a square (1,1)→(5,5)
    await page.keyboard.down('Shift');
    await dragBetweenPixels(page, 1, 1, 8, 5);
    await page.keyboard.up('Shift');

    await waitForGrid(page, 10, 10, [
      '..........',
      '.XXXXX....',
      '.X...X....',
      '.X...X....',
      '.X...X....',
      '.XXXXX....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });
});
