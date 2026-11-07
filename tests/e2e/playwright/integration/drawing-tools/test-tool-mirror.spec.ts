import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  drawAtPixel,
  openEditor,
  setPiskelFromGrid,
  gridFromRows,
  readPixelRows,
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

test.describe('Vertical mirror pen tool', () => {

  test('vertical mirror pen: draws symmetrically', { tag: ['@drawing-tools.mirror-pen'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-vertical-mirror-pen');

    // Draw on the left side — should mirror to the right
    await drawAtPixel(page, 1, 2);
    await drawAtPixel(page, 2, 5);

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '.X......X.',  // row 2: (1,2) mirrored to (8,2)
      '..........',
      '..........',
      '..X....X..',  // row 5: (2,5) mirrored to (7,5)
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('vertical mirror pen + Ctrl: mirrors on horizontal axis', { tag: ['@drawing-tools.mirror-pen'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-vertical-mirror-pen');

    // Draw with Ctrl held — mirrors on horizontal axis (top↔bottom)
    await page.keyboard.down(CMD_OR_CTRL);
    await drawAtPixel(page, 2, 2);
    await page.keyboard.up(CMD_OR_CTRL);

    // Ctrl: draws at (2,2) + horizontal mirror at (2,7)
    // No vertical mirror
    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '..X.......',  // row 2: original
      '..........',
      '..........',
      '..........',
      '..........',
      '..X.......',  // row 7: horizontal mirror
      '..........',
      '..........',
    ]);
  });

  test('vertical mirror pen + Shift: mirrors on both axes (4-way)', { tag: ['@drawing-tools.mirror-pen'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-vertical-mirror-pen');

    // Draw with Shift held — mirrors on both axes (4 quadrants)
    await page.keyboard.down('Shift');
    await drawAtPixel(page, 1, 2);
    await page.keyboard.up('Shift');

    // Shift: draws at all 4 corners:
    // (1,2) + vertical mirror (8,2) + horizontal mirror (1,7) + both (8,7)
    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '.X......X.',  // row 2: (1,2) and (8,2)
      '..........',
      '..........',
      '..........',
      '..........',
      '.X......X.',  // row 7: (1,7) and (8,7)
      '..........',
      '..........',
    ]);
  });
});
