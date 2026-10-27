import test, { expect } from "@playwright/test";
import {
  clickTool,
  drawAtPixel,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
} from "../../testutils";

test.describe('Eraser tool', () => {

  test('eraser tool: erases single pixels', async ({ page }) => {
    await openEditor(page);

    // Start with a filled 10x10 grid
    const filled = Array.from({ length: 10 }, () => Array(10).fill('R'));
    await setPiskelFromGrid(page, filled as any);

    await clickTool(page, 'tool-eraser');
    await drawAtPixel(page, 2, 2);
    await drawAtPixel(page, 5, 5);
    await drawAtPixel(page, 7, 3);

    const grid = await readPixelGrid(page, 10, 10);

    const expected = [
      'XXXXXXXXXX',  // row 0
      'XXXXXXXXXX',  // row 1
      'XX.XXXXXXX',  // row 2: erased (2,2)
      'XXXXXXX.XX',  // row 3: erased (7,3)
      'XXXXXXXXXX',  // row 4
      'XXXXX.XXXX',  // row 5: erased (5,5)
      'XXXXXXXXXX',  // row 6
      'XXXXXXXXXX',  // row 7
      'XXXXXXXXXX',  // row 8
      'XXXXXXXXXX',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });
});
