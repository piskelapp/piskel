import test, { expect, Page } from '../../fixtures';
import {
  CMD_OR_CTRL,
  clickTool,
  drawAtPixel,
  getPixelColor,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
  TRANSPARENT,
} from "../../testutils";

/** Drag from sprite pixel (x1,y1) to (x2,y2) */
async function dragBetweenPixels(page: Page, x1: number, y1: number, x2: number, y2: number) {
  const start = await page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: x1, row: y1 });
  const end = await page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: x2, row: y2 });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up();
}

test.describe('Selection tools', () => {

  test('lasso select: selects freeform area and deletes it', async ({ page }) => {
    await openEditor(page);

    // Fill entire 10x10 canvas with red
    const filled = Array.from({ length: 10 }, () => Array(10).fill('R'));
    await setPiskelFromGrid(page, filled as any);

    // Verify fully filled
    let grid = await readPixelGrid(page, 10, 10);
    expect(grid.every(row => row.every(c => c === 'X'))).toBe(true);

    // Select a triangular region with lasso by dragging around it:
    // Trace: (3,2) → (7,2) → (5,7) → back to (3,2)
    await clickTool(page, 'tool-lasso-select');

    const p1 = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 3, row: 2 });
    const p2 = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 7, row: 2 });
    const p3 = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 5, row: 7 });

    await page.mouse.move(p1.x, p1.y);
    await page.mouse.down();
    await page.mouse.move(p2.x, p2.y, { steps: 10 });
    await page.mouse.move(p3.x, p3.y, { steps: 10 });
    await page.mouse.move(p1.x, p1.y, { steps: 10 });
    await page.mouse.up();

    // Delete the selected area
    await page.keyboard.press('Delete');

    grid = await readPixelGrid(page, 10, 10);

    const expected = [
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXX.....XX',
      'XXX.....XX',
      'XXXX...XXX',
      'XXXX...XXX',
      'XXXX...XXX',
      'XXXXX.XXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('rectangle select: selects area and deletes it', async ({ page }) => {
    await openEditor(page);

    // Fill entire 10x10 canvas
    const filled = Array.from({ length: 10 }, () => Array(10).fill('R'));
    await setPiskelFromGrid(page, filled as any);

    // Select a rectangle from (2,2) to (7,7)
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 2, 2, 7, 7);

    // Delete the selection
    await page.keyboard.press('Delete');

    const grid = await readPixelGrid(page, 10, 10);

    // Rectangle (2,2)-(7,7) should be erased, rest filled
    const expected = [
      'XXXXXXXXXX',  // row 0
      'XXXXXXXXXX',  // row 1
      'XX......XX',  // row 2: cols 2-7 erased
      'XX......XX',  // row 3
      'XX......XX',  // row 4
      'XX......XX',  // row 5
      'XX......XX',  // row 6
      'XX......XX',  // row 7
      'XXXXXXXXXX',  // row 8
      'XXXXXXXXXX',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('shape select: selects connected same-color region and deletes it', async ({ page }) => {
    await openEditor(page);

    // Create a canvas with two separate red regions separated by transparent gap
    await setPiskelFromGrid(page, [
      ["R", "R", "R", "R", "R", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "R", "R", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "R", "R", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "R", "R", "R", "R", "R"],
      ["T", "T", "T", "T", "T", "R", "R", "R", "R", "R"],
      ["T", "T", "T", "T", "T", "R", "R", "R", "R", "R"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
    ]);

    // Shape-select the left block by clicking on (1,1)
    await clickTool(page, 'tool-shape-select');
    await drawAtPixel(page, 1, 1);

    // Delete the selection — only the left block should be erased
    await page.keyboard.press('Delete');

    const grid = await readPixelGrid(page, 10, 10);

    // Left block deleted, right block untouched
    const expected = [
      '..........',  // row 0: left block erased
      '..........',  // row 1
      '..........',  // row 2
      '..........',  // row 3
      '..........',  // row 4
      '.....XXXXX',  // row 5: right block remains
      '.....XXXXX',  // row 6
      '.....XXXXX',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('rectangle select: copy preserves original, paste places content', async ({ page }) => {
    await openEditor(page);

    // 3x3 block at top-left
    await setPiskelFromGrid(page, [
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
    ]);

    // Select the 3x3 block
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 0, 0, 2, 2);

    // Copy — original should be preserved (unlike cut)
    await page.keyboard.press(`${CMD_OR_CTRL}+c`);

    // Erase the original to prove paste restores from clipboard
    await page.keyboard.press('Delete');

    let grid = await readPixelGrid(page, 10, 10);
    // After copy + delete: canvas should be empty
    expect(grid.flat().filter(c => c === 'X').length).toBe(0);

    // Paste — should place the 3x3 block back at the selection origin
    await page.keyboard.press(`${CMD_OR_CTRL}+v`);
    await page.keyboard.press('Enter');

    grid = await readPixelGrid(page, 10, 10);

    // The pasted block should restore 9 pixels at the original position
    const expected = [
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
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('rectangle select: cut removes original and paste places it', async ({ page }) => {
    await openEditor(page);

    // 3x3 block at top-left
    await setPiskelFromGrid(page, [
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
    ]);

    // Select the 3x3 block
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 0, 0, 2, 2);

    // Cut (Ctrl+X) — should erase the original
    await page.keyboard.press(`${CMD_OR_CTRL}+x`);

    // Original position should now be empty
    expect(await getPixelColor(page, 0, 0)).toBe(TRANSPARENT);
    expect(await getPixelColor(page, 1, 1)).toBe(TRANSPARENT);
    expect(await getPixelColor(page, 2, 2)).toBe(TRANSPARENT);

    // Paste (Ctrl+V) — should place the cut content
    await page.keyboard.press(`${CMD_OR_CTRL}+v`);
    await page.keyboard.press('Enter');

    // Should have 9 filled pixels somewhere (the pasted block)
    const grid = await readPixelGrid(page, 10, 10);
    const totalFilled = grid.flat().filter(c => c === 'X').length;
    expect(totalFilled).toBe(9);
  });

  test('rectangle select: drag to move selection content', async ({ page }) => {
    await openEditor(page);

    // 3x3 red block at (0,0), rest transparent
    await setPiskelFromGrid(page, [
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["R", "R", "R", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
    ]);

    const beforeGrid = await readPixelGrid(page, 10, 10);
    const expectedBefore = [
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
    expect(beforeGrid.map(r => r.join(''))).toEqual(expectedBefore);

    // Select the 3x3 block
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 0, 0, 2, 2);

    // Drag the selection from (1,1) to (5,5) while holding Shift
    // (Shift on first drag = cut + move content)
    const moveStart = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 1, row: 1 });
    const moveEnd = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 5, row: 5 });

    await page.keyboard.down('Shift');
    await page.mouse.move(moveStart.x, moveStart.y);
    await page.mouse.down();
    await page.mouse.move(moveEnd.x, moveEnd.y, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // Commit
    await page.keyboard.press('Enter');

    const afterGrid = await readPixelGrid(page, 10, 10);

    const expectedAfter = [
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
    ];
    expect(afterGrid.map(r => r.join(''))).toEqual(expectedAfter);
  });
});
