import test, { expect, Page } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  colorToInt,
  drawAtPixel,
  getPixelColor,
  openEditor,
  readPixelGrid,
  setPiskelFromGrid,
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

/** Create an NxN transparent TestGrid */
function emptyTestGrid(size = 10): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

test.describe('Move tool', () => {

  test('move tool: shifts content with wrapping and clipping', async ({ page }) => {
    await openEditor(page);

    // Arrow shape pointing right, near the right edge
    await setPiskelFromGrid(page, [
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "R", "T", "T"],
      ["T", "T", "R", "R", "R", "R", "R", "R", "R", "T"],
      ["T", "T", "R", "R", "R", "R", "R", "R", "R", "R"],
      ["T", "T", "R", "R", "R", "R", "R", "R", "R", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "R", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
    ]);

    const before = await readPixelGrid(page, 10, 10);
    const expectedBefore = [
      '..........',
      '......X...',
      '......XX..',
      '..XXXXXXX.',
      '..XXXXXXXX',
      '..XXXXXXX.',
      '......XX..',
      '......X...',
      '..........',
      '..........',
    ];
    expect(before.map(r => r.join(''))).toEqual(expectedBefore);

    // Move right by 3 — parts past the right edge wrap to the left
    await clickTool(page, 'tool-move');
    await dragBetweenPixels(page, 5, 4, 8, 4);

    const after = await readPixelGrid(page, 10, 10);

    const expectedAfter = [
      '..........',
      '.........X',
      '.........X',
      '.....XXXXX',
      '.....XXXXX',
      '.....XXXXX',
      '.........X',
      '.........X',
      '..........',
      '..........',
    ];
    expect(after.map(r => r.join(''))).toEqual(expectedAfter);

    // Now move left by 6 — content clips/wraps past the left edge
    await dragBetweenPixels(page, 7, 4, 1, 4);

    const afterLeft = await readPixelGrid(page, 10, 10);

    const expectedLeft = [
      '..........',
      '...X......',
      '...X......',
      'XXXX......',
      'XXXX......',
      'XXXX......',
      '...X......',
      '...X......',
      '..........',
      '..........',
    ];
    expect(afterLeft.map(r => r.join(''))).toEqual(expectedLeft);
  });

  test('move tool + Alt: wraps content around borders', async ({ page }) => {
    await openEditor(page);

    // Same arrow shape as the default move test
    await setPiskelFromGrid(page, [
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "R", "T", "T"],
      ["T", "T", "R", "R", "R", "R", "R", "R", "R", "T"],
      ["T", "T", "R", "R", "R", "R", "R", "R", "R", "R"],
      ["T", "T", "R", "R", "R", "R", "R", "R", "R", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "R", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "R", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
      ["T", "T", "T", "T", "T", "T", "T", "T", "T", "T"],
    ]);

    // Move right by 3 with Alt held — should WRAP instead of clip
    await clickTool(page, 'tool-move');

    const start = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 5, row: 4 });
    const end = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 8, row: 4 });

    await page.keyboard.down('Alt');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Alt');

    const grid = await readPixelGrid(page, 10, 10);

    const expected = [
      '..........',
      '.........X',
      'X........X',
      'XX...XXXXX',
      'XXX..XXXXX',
      'XX...XXXXX',
      'X........X',
      '.........X',
      '..........',
      '..........',
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('move tool + Shift: applies to all frames', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());

    // Draw a dot on frame 0 at (2,2)
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 2, 2);

    // Add frame 1 and draw a dot at (2,2)
    await page.keyboard.press('n');
    await drawAtPixel(page, 2, 2);

    // Add frame 2 and draw a dot at (2,2)
    await page.keyboard.press('n');
    await drawAtPixel(page, 2, 2);

    // Verify all 3 frames have the dot at (2,2)
    expect(await getPixelColor(page, 2, 2, 0, 0)).toBe(colorToInt('#000000'));
    expect(await getPixelColor(page, 2, 2, 0, 1)).toBe(colorToInt('#000000'));
    expect(await getPixelColor(page, 2, 2, 0, 2)).toBe(colorToInt('#000000'));

    // Go back to frame 0
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    // Move with Shift held — should move ALL frames
    await clickTool(page, 'tool-move');

    const start = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 2, row: 2 });
    const end = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 5, row: 2 });

    await page.keyboard.down('Shift');
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up('Shift');

    // All 3 frames should have the dot moved from (2,2) to (5,2)
    const expectedRow = [
      '..........',
      '..........',
      '.....X....',  // dot at col 5
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ];

    // Frame 0 (current)
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0.map(r => r.join(''))).toEqual(expectedRow);

    // Frame 1
    const grid1 = await readPixelGrid(page, 10, 10, 0, 1);
    expect(grid1.map(r => r.join(''))).toEqual(expectedRow);

    // Frame 2
    const grid2 = await readPixelGrid(page, 10, 10, 0, 2);
    expect(grid2.map(r => r.join(''))).toEqual(expectedRow);
  });

  test('move tool + Ctrl: applies to all layers', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());

    // Draw a dot on layer 0 at (2,2)
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 2, 2);

    // Add layer 1 and draw a dot at (2,4)
    await page.locator('[data-test-id="layer-add-button"]').click();
    await drawAtPixel(page, 2, 4);

    // Verify dots on each layer
    expect(await getPixelColor(page, 2, 2, 0, 0)).toBe(colorToInt('#000000')); // layer 0
    expect(await getPixelColor(page, 2, 4, 1, 0)).toBe(colorToInt('#000000')); // layer 1

    // Ctrl+move from (2,3) to (6,3) — should move ALL layers
    await clickTool(page, 'tool-move');

    const start = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 2, row: 3 });
    const end = await page.evaluate(({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: 6, row: 3 });

    await page.keyboard.down(CMD_OR_CTRL);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();
    await page.keyboard.up(CMD_OR_CTRL);

    // Layer 0: dot moved from (2,2) to (6,2)
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0[2].join('')).toBe('......X...');
    expect(grid0[2][6]).toBe('X');
    // Old position should be empty
    expect(grid0[2][2]).toBe('.');

    // Layer 1: dot moved from (2,4) to (6,4)
    const grid1 = await readPixelGrid(page, 10, 10, 1, 0);
    expect(grid1[4].join('')).toBe('......X...');
    expect(grid1[4][6]).toBe('X');
    expect(grid1[4][2]).toBe('.');
  });
});
