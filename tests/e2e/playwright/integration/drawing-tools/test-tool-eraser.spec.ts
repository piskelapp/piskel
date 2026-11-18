import test, { expect } from "@playwright/test";
import {
  clickTool,
  drawAtPixel,
  gridFromRows,
  openEditor,
  setPiskelFromGrid,
  readPixelRows,
} from "../../testutils";

test.describe('Eraser tool', () => {

  test('eraser tool: erases single pixels', { tag: ['@drawing-tools.eraser'] }, async ({ page }) => {
    await openEditor(page);

    // Start from a sprite filled with color.
    await setPiskelFromGrid(page, gridFromRows([
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
    ]));

    // Erase three pixels.
    await clickTool(page, 'tool-eraser');
    await drawAtPixel(page, 2, 2);
    await drawAtPixel(page, 5, 5);
    await drawAtPixel(page, 7, 3);

    // Only these pixels are transparent.
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XX.XXXXXXX',
      'XXXXXXX.XX',
      'XXXXXXXXXX',
      'XXXXX.XXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'XXXXXXXXXX',
    ]);
  });
});
