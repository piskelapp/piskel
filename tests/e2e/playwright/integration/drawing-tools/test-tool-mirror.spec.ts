import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  drawAtPixel,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
} from "../../testutils";

/** Create an NxN transparent TestGrid */
function emptyTestGrid(size = 10): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

test.describe('Vertical mirror pen tool', () => {

  test('vertical mirror pen: draws symmetrically', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-vertical-mirror-pen');

    // Draw on the left side — should mirror to the right
    await drawAtPixel(page, 1, 2);
    await drawAtPixel(page, 2, 5);

    const grid = await readPixelGrid(page, 10, 10);

    const expected = [
      '..........',  // row 0
      '..........',  // row 1
      '.X......X.',  // row 2: (1,2) mirrored to (8,2)
      '..........',  // row 3
      '..........',  // row 4
      '..X....X..',  // row 5: (2,5) mirrored to (7,5)
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('vertical mirror pen + Ctrl: mirrors on horizontal axis', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-vertical-mirror-pen');

    // Draw with Ctrl held — mirrors on horizontal axis (top↔bottom)
    const coords = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 2, row: 2 });

    await page.keyboard.down(CMD_OR_CTRL);
    await page.mouse.click(coords.x, coords.y);
    await page.keyboard.up(CMD_OR_CTRL);

    const grid = await readPixelGrid(page, 10, 10);

    // Ctrl: draws at (2,2) + horizontal mirror at (2,7)
    // No vertical mirror
    const expected = [
      '..........',  // row 0
      '..........',  // row 1
      '..X.......',  // row 2: original
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '..X.......',  // row 7: horizontal mirror
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('vertical mirror pen + Shift: mirrors on both axes (4-way)', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-vertical-mirror-pen');

    // Draw with Shift held — mirrors on both axes (4 quadrants)
    const coords = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 1, row: 2 });

    await page.keyboard.down('Shift');
    await page.mouse.click(coords.x, coords.y);
    await page.keyboard.up('Shift');

    const grid = await readPixelGrid(page, 10, 10);

    // Shift: draws at all 4 corners:
    // (1,2) + vertical mirror (8,2) + horizontal mirror (1,7) + both (8,7)
    const expected = [
      '..........',  // row 0
      '..........',  // row 1
      '.X......X.',  // row 2: (1,2) and (8,2)
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '.X......X.',  // row 7: (1,7) and (8,7)
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });
});
