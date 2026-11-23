import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  dragBetweenPixels,
  dragThroughPixels,
  drawAtPixel,
  gridFromColorRows,
  gridFromRows,
  openEditor,
  readPixelRows,
  setPiskelFromGrid,
  waitForGrid,
} from "../../testutils";

/** 10x10 sprites */
const FULL = [
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
  'XXXXXXXXXX',
];
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
const BLOCK = [
  'XXX.......',
  'XXX.......',
  'XXX.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const RED_BLOCK = [
  'RRR.......',
  'RRR.......',
  'RRR.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('Selection tools', () => {

  test('lasso select: selects freeform area and deletes it', { tag: ['@selection.lasso', '@selection.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Start from a sprite filled with color.
    await setPiskelFromGrid(page, gridFromRows(FULL));
    await waitForGrid(page, 10, 10, FULL);

    // Draw a triangle with the lasso: (3,2) → (7,2) → (5,7) → back to (3,2).
    await clickTool(page, 'tool-lasso-select');
    await dragThroughPixels(page, [[3, 2], [7, 2], [5, 7], [3, 2]], { steps: 10 });

    // Delete the selected area.
    await page.keyboard.press('Delete');

    // We can't assert the exact erased shape: the lasso path is drawn via mouse
    // move events whose interpolation varies by OS and hardware, producing
    // slightly different rasterizations across machines. Instead we assert the
    // structural invariants that hold regardless of rasterization.
    await expect.poll(async () => (await readPixelRows(page, 10, 10)).join('').includes('.')).toBe(true);
    const rows = await readPixelRows(page, 10, 10);

    // The rows above and below the triangle are intact.
    expect(rows.slice(0, 2)).toEqual(FULL.slice(0, 2));
    expect(rows.slice(8)).toEqual(FULL.slice(8));

    // So are the columns on its left and right (0-2 and 8-9).
    for (const row of rows) {
      expect(row.slice(0, 3)).toBe('XXX');
      expect(row.slice(8)).toBe('XX');
    }
  });

  test('rectangle select: selects area and deletes it', { tag: ['@selection.rectangle', '@selection.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Start from a sprite filled with color.
    await setPiskelFromGrid(page, gridFromRows(FULL));

    // Select a rectangle from (2,2) to (7,7)
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 2, 2, 7, 7);

    // Delete the selection
    await page.keyboard.press('Delete');

    // Rectangle (2,2)-(7,7) should be erased, rest filled
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XX......XX',
      'XX......XX',
      'XX......XX',
      'XX......XX',
      'XX......XX',
      'XX......XX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
    ]);
  });

  test('shape select: selects connected same-color region and deletes it', { tag: ['@selection.shape', '@selection.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Create a canvas with two separate red regions separated by transparent gap
    await setPiskelFromGrid(page, gridFromColorRows([
      'RRRRR.....',
      'RRRRR.....',
      'RRRRR.....',
      '..........',
      '..........',
      '.....RRRRR',
      '.....RRRRR',
      '.....RRRRR',
      '..........',
      '..........',
    ]));

    // Shape-select the left block by clicking on (1,1)
    await clickTool(page, 'tool-shape-select');
    await drawAtPixel(page, 1, 1);

    // Delete the selection — only the left block should be erased
    await page.keyboard.press('Delete');

    // Left block deleted, right block untouched
    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '.....XXXXX',
      '.....XXXXX',
      '.....XXXXX',
      '..........',
      '..........',
    ]);
  });

  test('rectangle select: copy preserves original, paste places content', { tag: ['@selection.copy', '@selection.paste'] }, async ({ page }) => {
    // A 3x3 block at the top left.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_BLOCK));

    // Select and copy it: the block stays.
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 0, 0, 2, 2);
    await page.keyboard.press(`${CMD_OR_CTRL}+c`);
    expect(await readPixelRows(page, 10, 10)).toEqual(BLOCK);

    // Delete it, to show that the paste comes from the clipboard.
    await page.keyboard.press('Delete');
    await waitForGrid(page, 10, 10, EMPTY);

    // Paste: the block comes back at the position of the selection.
    await page.keyboard.press(`${CMD_OR_CTRL}+v`);
    await page.keyboard.press('Enter');
    await waitForGrid(page, 10, 10, BLOCK);
  });

  test('rectangle select: cut removes original and paste places it', { tag: ['@selection.cut', '@selection.paste'] }, async ({ page }) => {
    // A 3x3 block at the top left.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_BLOCK));

    // Select and cut it: the block goes away.
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 0, 0, 2, 2);
    await page.keyboard.press(`${CMD_OR_CTRL}+x`);
    await waitForGrid(page, 10, 10, EMPTY);

    // Paste: the block comes back at the position of the selection.
    await page.keyboard.press(`${CMD_OR_CTRL}+v`);
    await page.keyboard.press('Enter');
    await waitForGrid(page, 10, 10, BLOCK);
  });

  test('rectangle select: drag to move selection content', { tag: ['@selection.move-content', '@selection.commit'] }, async ({ page }) => {
    await openEditor(page);

    // A 3x3 block at the top left.
    await setPiskelFromGrid(page, gridFromColorRows(RED_BLOCK));
    await waitForGrid(page, 10, 10, BLOCK);

    // Select the 3x3 block
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 0, 0, 2, 2);

    // Drag the selection from (1,1) to (5,5) while holding Shift
    // (Shift on first drag = cut + move content)
    await page.keyboard.down('Shift');
    await dragBetweenPixels(page, 1, 1, 5, 5);
    await page.keyboard.up('Shift');

    // Commit: the block moved by 4 pixels right and down.
    await page.keyboard.press('Enter');
    await waitForGrid(page, 10, 10, [
      '..........',
      '..........',
      '..........',
      '..........',
      '....XXX...',
      '....XXX...',
      '....XXX...',
      '..........',
      '..........',
      '..........',
    ]);
  });
});
