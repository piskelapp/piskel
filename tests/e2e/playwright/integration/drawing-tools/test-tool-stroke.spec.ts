import test, { Page } from "@playwright/test";
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

test.describe('Stroke tool', () => {

  test('stroke tool: draws a line between two points', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-stroke');

    // Horizontal line from (1,2) to (8,2)
    await dragBetweenPixels(page, 1, 2, 8, 2);

    await waitForGrid(page, 10, 10, [
      '..........',  // row 0
      '..........',  // row 1
      '.XXXXXXXX.',  // row 2: horizontal stroke
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ]);
  });

  test('stroke tool + Shift: snaps to straight lines', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-stroke');

    // Diagonal drag from (1,1) to (7,5) with Shift held → snaps to 45° diagonal
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));
    const start = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 1, row: 1 });
    const end = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 7, row: 5 });

    await page.keyboard.down('Shift');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // Now add a second Shift stroke: horizontal snap: drag from (1,7) to (6,8) → snaps to horizontal
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));
    const start2 = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 1, row: 7 });
    const end2 = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 6, row: 8 });

    await page.keyboard.down('Shift');
    await page.mouse.move(start2.x, start2.y);
    await page.mouse.down();
    await page.mouse.move(end2.x, end2.y, { steps: 5 });
    await page.mouse.up();
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
