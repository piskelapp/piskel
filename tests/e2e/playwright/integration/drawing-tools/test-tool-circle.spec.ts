import test from "@playwright/test";
import {
  clickTool,
  dragBetweenPixels,
  openEditor,
  setPiskelFromGrid,
  waitForGrid,
} from "../../testutils";

/** Create an NxN transparent TestGrid */
function emptyTestGrid(size = 10): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

test.describe('Circle tool', () => {

  test('circle tool: draws hollow circle', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-circle');

    await dragBetweenPixels(page, 1, 1, 8, 8);

    await waitForGrid(page, 10, 10, [
      '..........',  // row 0
      '...XXXX...',  // row 1
      '..X....X..',  // row 2
      '.X......X.',  // row 3
      '.X......X.',  // row 4
      '.X......X.',  // row 5
      '.X......X.',  // row 6
      '..X....X..',  // row 7
      '...XXXX...',  // row 8
      '..........',  // row 9
    ]);
  });

  test('circle tool + Shift: constrains to perfect circle', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-circle');

    // Drag from (1,1) to (8,5) with Shift — should constrain to a circle with equal width/height
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));
    const start = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 1, row: 1 });
    const end = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 8, row: 5 });

    await page.keyboard.down('Shift');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
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
