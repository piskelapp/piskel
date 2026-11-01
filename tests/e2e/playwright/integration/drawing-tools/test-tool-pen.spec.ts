import test from "@playwright/test";
import {
  clickTool,
  drawAtPixel,
  openEditor,
  setPiskelFromGrid,
  waitForGrid,
} from "../../testutils";

/** Create an NxN transparent TestGrid */
function emptyTestGrid(size = 10): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

test.describe('Pen tool', () => {

  test('pen tool: draws single pixels', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-pen');

    await drawAtPixel(page, 2, 2);
    await drawAtPixel(page, 5, 5);
    await drawAtPixel(page, 7, 3);

    await waitForGrid(page, 10, 10, [
      '..........',  // row 0
      '..........',  // row 1
      '..X.......',  // row 2
      '.......X..',  // row 3
      '..........',  // row 4
      '.....X....',  // row 5
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ]);
  });
});
