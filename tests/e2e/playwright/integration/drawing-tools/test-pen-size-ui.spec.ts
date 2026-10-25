import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  clickTool,
  drawAtPixel,
  getPixelColor,
  colorToInt,
  TRANSPARENT,
  getSelectedPenSize,
  getPenSizeButton,
  setPiskelFromGrid,
  readPixelGrid,
} from "../../testutils";

/** Create a 20x20 transparent TestGrid for setPiskelFromGrid */
function emptyTestGrid(size = 20): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

/** Drag from sprite pixel (x1,y1) to (x2,y2) — used for stroke/rect/circle tools */
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

test.describe('Pen size UI', () => {

  test('should default to pen size 1', async ({ page }) => {
    await openEditor(page);
    expect(await getSelectedPenSize(page)).toBe(1);
    await expect(getPenSizeButton(page, 1)).toHaveClass(/selected/);
  });

  test('should change pen size by clicking size option', async ({ page }) => {
    await openEditor(page);

    await getPenSizeButton(page, 2).click();
    expect(await getSelectedPenSize(page)).toBe(2);
    await expect(getPenSizeButton(page, 2)).toHaveClass(/selected/);
    await expect(getPenSizeButton(page, 1)).not.toHaveClass(/selected/);

    await getPenSizeButton(page, 3).click();
    expect(await getSelectedPenSize(page)).toBe(3);
    await expect(getPenSizeButton(page, 3)).toHaveClass(/selected/);

    await getPenSizeButton(page, 4).click();
    expect(await getSelectedPenSize(page)).toBe(4);
    await expect(getPenSizeButton(page, 4)).toHaveClass(/selected/);
  });

  test('should draw a 2x2 block with pen size 2', async ({ page }) => {
    await openEditor(page);

    await clickTool(page, 'tool-pen');
    await getPenSizeButton(page, 2).click();
    expect(await getSelectedPenSize(page)).toBe(2);

    // Draw at pixel (1,1) — pen size 2 should fill a 2x2 area around it
    await drawAtPixel(page, 1, 1);

    // With pen size 2, clicking at (1,1) fills pixels (0,0), (1,0), (0,1), (1,1)
    const black = colorToInt('#000000');
    expect(await getPixelColor(page, 0, 0)).toBe(black);
    expect(await getPixelColor(page, 1, 0)).toBe(black);
    expect(await getPixelColor(page, 0, 1)).toBe(black);
    expect(await getPixelColor(page, 1, 1)).toBe(black);

    // Pixels outside the 2x2 area should remain transparent
    expect(await getPixelColor(page, 2, 0)).toBe(TRANSPARENT);
    expect(await getPixelColor(page, 0, 2)).toBe(TRANSPARENT);
  });

  test('should change pen size with keyboard shortcuts', async ({ page }) => {
    await openEditor(page);

    expect(await getSelectedPenSize(page)).toBe(1);

    // Increase with ]
    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(2);

    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(3);

    // Decrease with [
    await page.keyboard.press('[');
    expect(await getSelectedPenSize(page)).toBe(2);
  });

  test('should not go below size 1 or above size 4', async ({ page }) => {
    await openEditor(page);

    // Try to decrease below 1
    await page.keyboard.press('[');
    expect(await getSelectedPenSize(page)).toBe(1);

    // Go to max
    await getPenSizeButton(page, 4).click();
    expect(await getSelectedPenSize(page)).toBe(4);

    // Try to increase above 4
    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(4);
  });

  test('should affect pen tool: size 1 vs size 2', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-pen');

    // Pen size 1: draw at (5,5) — single pixel
    await getPenSizeButton(page, 1).click();
    await drawAtPixel(page, 5, 5);

    // Pen size 2: draw at (15,15) — 2x2 block
    await getPenSizeButton(page, 2).click();
    await drawAtPixel(page, 15, 15);

    const grid = await readPixelGrid(page, 20, 20);

    // Expected 20x20 grid:
    // Size 1 dot at (5,5), size 2 block at (14-15, 14-15)
    const expected = [
      '....................',  // row 0
      '....................',  // row 1
      '....................',  // row 2
      '....................',  // row 3
      '....................',  // row 4
      '.....X..............',  // row 5:  pen size 1 → single pixel
      '....................',  // row 6
      '....................',  // row 7
      '....................',  // row 8
      '....................',  // row 9
      '....................',  // row 10
      '....................',  // row 11
      '....................',  // row 12
      '....................',  // row 13
      '..............XX....',  // row 14: pen size 2 → 2x2 block
      '..............XX....',  // row 15:
      '....................',  // row 16
      '....................',  // row 17
      '....................',  // row 18
      '....................',  // row 19
    ];

    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('should affect eraser tool: size 1 vs size 2', async ({ page }) => {
    await openEditor(page);

    // Fill a 4x4 block at the center of a 20x20 canvas using setPiskelFromGrid
    const filledGrid = emptyTestGrid();
    for (let y = 8; y < 12; y++) {
      for (let x = 8; x < 12; x++) {
        (filledGrid[y] as string[])[x] = 'R';
      }
    }
    await setPiskelFromGrid(page, filledGrid as any);

    // Verify block is filled
    let grid = await readPixelGrid(page, 20, 20);
    expect(grid[8][8]).toBe('X');
    expect(grid[11][11]).toBe('X');

    // Erase size 1 at (8,8) — only 1 pixel erased
    await clickTool(page, 'tool-eraser');
    await getPenSizeButton(page, 1).click();
    await drawAtPixel(page, 8, 8);

    grid = await readPixelGrid(page, 20, 20);
    expect(grid[8][8]).toBe('.');  // erased
    expect(grid[8][9]).toBe('X');  // neighbour untouched
    expect(grid[9][8]).toBe('X');  // neighbour untouched

    // Erase size 2 at (11,11) — 2x2 block erased
    await getPenSizeButton(page, 2).click();
    await drawAtPixel(page, 11, 11);

    grid = await readPixelGrid(page, 20, 20);

    // Expected 20x20 grid after erasing:
    // Started with 4x4 filled block at (8-11, 8-11)
    // Erased (8,8) with size 1 → 1 pixel gone
    // Erased (11,11) with size 2 → 2x2 block (10-11, 10-11) gone
    const expectedErased = [
      '....................',  // row 0
      '....................',  // row 1
      '....................',  // row 2
      '....................',  // row 3
      '....................',  // row 4
      '....................',  // row 5
      '....................',  // row 6
      '....................',  // row 7
      '.........XXX........',  // row 8:  (8,8) erased, (9-11) remain
      '........XXXX........',  // row 9:  full row intact
      '........XX..........',  // row 10: (10-11) erased by size 2
      '........XX..........',  // row 11: (10-11) erased by size 2
      '....................',  // row 12
      '....................',  // row 13
      '....................',  // row 14
      '....................',  // row 15
      '....................',  // row 16
      '....................',  // row 17
      '....................',  // row 18
      '....................',  // row 19
    ];

    expect(grid.map(r => r.join(''))).toEqual(expectedErased);
  });

  test('should affect stroke tool: size 1 vs size 2', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-stroke');

    // Stroke size 1: horizontal line from (2,5) to (17,5)
    await getPenSizeButton(page, 1).click();
    await dragBetweenPixels(page, 2, 5, 17, 5);

    // Stroke size 2: horizontal line from (2,15) to (17,15)
    await getPenSizeButton(page, 2).click();
    await dragBetweenPixels(page, 2, 15, 17, 15);

    const grid = await readPixelGrid(page, 20, 20);

    // Expected 20x20 grid:
    // Row  5:    1px stroke from col 2-17
    // Row 14-15: 2px stroke from col 1-17
    const expected = [
      '....................',  // row 0
      '....................',  // row 1
      '....................',  // row 2
      '....................',  // row 3
      '....................',  // row 4
      '..XXXXXXXXXXXXXXXX..',  // row 5:  size 1 stroke
      '....................',  // row 6
      '....................',  // row 7
      '....................',  // row 8
      '....................',  // row 9
      '....................',  // row 10
      '....................',  // row 11
      '....................',  // row 12
      '....................',  // row 13
      '.XXXXXXXXXXXXXXXXX..',  // row 14: size 2 stroke (top)
      '.XXXXXXXXXXXXXXXXX..',  // row 15: size 2 stroke (bottom)
      '....................',  // row 16
      '....................',  // row 17
      '....................',  // row 18
      '....................',  // row 19
    ];

    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('should affect rectangle tool: size 1 vs size 2', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-rectangle');

    // Rectangle size 1: from (1,1) to (8,8)
    await getPenSizeButton(page, 1).click();
    await dragBetweenPixels(page, 1, 1, 8, 8);

    // Rectangle size 2: from (11,1) to (18,8)
    await getPenSizeButton(page, 2).click();
    await dragBetweenPixels(page, 11, 1, 18, 8);

    const grid = await readPixelGrid(page, 20, 20);

    // Expected 20x20 grid:
    // Left rectangle (size 1): 1px outline at cols 1-8, rows 1-8
    // Right rectangle (size 2): 2px outline at cols 11-18, rows 1-8
    const expected = [
      '....................',  // row 0
      '.XXXXXXXX..XXXXXXXX.',  // row 1: top edges
      '.X......X..XXXXXXXX.',  // row 2: size2 has 2px top
      '.X......X..XX....XX.',  // row 3
      '.X......X..XX....XX.',  // row 4
      '.X......X..XX....XX.',  // row 5
      '.X......X..XX....XX.',  // row 6
      '.X......X..XXXXXXXX.',  // row 7: size2 has 2px bottom
      '.XXXXXXXX..XXXXXXXX.',  // row 8: bottom edges
      '....................',  // row 9
      '....................',  // row 10
      '....................',  // row 11
      '....................',  // row 12
      '....................',  // row 13
      '....................',  // row 14
      '....................',  // row 15
      '....................',  // row 16
      '....................',  // row 17
      '....................',  // row 18
      '....................',  // row 19
    ];

    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('should affect circle tool: size 1 vs size 2', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());
    await clickTool(page, 'tool-circle');

    // Circle size 1: from (2,2) to (9,9)
    await getPenSizeButton(page, 1).click();
    await dragBetweenPixels(page, 2, 2, 9, 9);

    // Circle size 2: from (12,2) to (19,9)
    await getPenSizeButton(page, 2).click();
    await dragBetweenPixels(page, 12, 2, 19, 9);

    const grid = await readPixelGrid(page, 20, 20);

    // Expected result on 20x20 canvas:
    //
    //  col: 0123456789012345678901
    //       ····················     row 0
    //       ····················     row 1
    //       ····XXXX······XXXX··     row 2
    //       ···X····X····XXXXXX·     row 3
    //       ··X······X··XX····XX     row 4
    //       ··X······X··XX····XX     row 5
    //       ··X······X··XX····XX     row 6
    //       ··X······X··XX····XX     row 7
    //       ···X····X····XXXXXX·     row 8
    //       ····XXXX······XXXX··     row 9
    //
    // Left circle (size 1): 1px outline at cols 2-9, rows 2-9
    // Right circle (size 2): 2px outline at cols 12-19, rows 2-9

    const expected = [
      '....................',  // row 0
      '....................',  // row 1
      '....XXXX......XXXX..',  // row 2
      '...X....X....XXXXXX.',  // row 3
      '..X......X..XX....XX',  // row 4
      '..X......X..XX....XX',  // row 5
      '..X......X..XX....XX',  // row 6
      '..X......X..XX....XX',  // row 7
      '...X....X....XXXXXX.',  // row 8
      '....XXXX......XXXX..',  // row 9
      '....................',  // row 10
      '....................',  // row 11
      '....................',  // row 12
      '....................',  // row 13
      '....................',  // row 14
      '....................',  // row 15
      '....................',  // row 16
      '....................',  // row 17
      '....................',  // row 18
      '....................',  // row 19
    ];

    expect(grid.map(r => r.join(''))).toEqual(expected);
  });
});
