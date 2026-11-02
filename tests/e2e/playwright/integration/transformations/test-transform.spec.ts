import test, { expect, Page } from "@playwright/test";
import {
  CMD_OR_CTRL,
  openEditor,
  setPiskelFromGrid,
  readPixelGrid,
  readPixelRows,
  drawAtPixel,
  clickTool,
  getAddFrameButton,
  getFrameTiles,
  getAddLayerButton,
  waitFor,
  wait,
  getCurrentPiskelWidth,
  getCurrentPiskelHeight,
  isCurrentPiskelEmpty,
  undo,
  waitForEditorReady,
  waitForGrid,
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

type TestGrid = Array<Array<"R" | "G" | "B" | "T">>;

/** Create a size x size transparent grid */
function emptyTestGrid(size = 10): TestGrid {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

/** Build an L-shape pattern in the top-left corner of a 10x10 grid:
 *  X.........   row 0
 *  X.........   row 1
 *  XXX.......   row 2
 *  ..........   rows 3-9
 */
function lShapeGrid(): TestGrid {
  const grid = emptyTestGrid();
  grid[0][0] = 'R';
  grid[1][0] = 'R';
  grid[2][0] = 'R';
  grid[2][1] = 'R';
  grid[2][2] = 'R';
  return grid;
}

/** Build a test grid from rows where X is a colored pixel and . a transparent one */
function gridFromRows(rows: string[]): TestGrid {
  return rows.map(row => [...row].map(c => (c === 'X' ? 'R' : 'T')));
}

const EMPTY = Array(10).fill('..........');

const L_SHAPE = [
  'X.........',  // row 0
  'X.........',  // row 1
  'XXX.......',  // row 2
  ...Array(7).fill('..........'),
];

const L_SHAPE_AND_PIXEL = [
  ...L_SHAPE.slice(0, 5),
  '.....X....',  // row 5
  ...L_SHAPE.slice(6),
];

/** The bounding box of the content is the whole canvas */
const CORNERS = [
  'X.........',  // row 0
  ...Array(8).fill('..........'),
  '.........X',  // row 9
];

/** A 6x2 sprite, with pixels that don't fit on the canvas once rotated */
const WIDE_SPRITE = [
  'X.XX..',  // row 0
  '..X..X',  // row 1
];

/** Click a transform tool with optional modifier keys held */
async function clickTransform(
  page: Page,
  toolId: string,
  modifiers: { alt?: boolean; shift?: boolean; ctrl?: boolean } = {}
) {
  const tool = page.locator(`[data-tool-id="${toolId}"]`);

  // Expand "show more" if the tool is not visible
  if (!(await tool.isVisible())) {
    await page.locator('.transformations-show-more-link').click();
    await expect(tool).toBeVisible();
  }

  if (modifiers.alt) await page.keyboard.down('Alt');
  if (modifiers.shift) await page.keyboard.down('Shift');
  if (modifiers.ctrl) await page.keyboard.down(CMD_OR_CTRL);

  await tool.click();

  if (modifiers.ctrl) await page.keyboard.up(CMD_OR_CTRL);
  if (modifiers.shift) await page.keyboard.up('Shift');
  if (modifiers.alt) await page.keyboard.up('Alt');

  // Wait for transform to apply
  await wait(200);
}

test.describe('Transform panel', () => {

  // ─── Flip ──────────────────────────────────────────────────────

  test('flip horizontal (default) should mirror pixels left-right', { tag: ['@transformations.flip'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await clickTransform(page, 'tool-flip');

    const grid = await readPixelGrid(page, 10, 10);
    const expected = [
      '.........X',  // row 0
      '.........X',  // row 1
      '.......XXX',  // row 2
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('flip vertical (Alt) should mirror pixels top-bottom', { tag: ['@transformations.flip'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await clickTransform(page, 'tool-flip', { alt: true });

    const grid = await readPixelGrid(page, 10, 10);
    const expected = [
      '..........',  // row 0
      '..........',  // row 1
      '..........',  // row 2
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      'XXX.......',  // row 7
      'X.........',  // row 8
      'X.........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('flip all frames (Shift) should flip every frame', { tag: ['@transformations.flip', '@transformations.all-frames'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Add a second frame and draw a pixel in it
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    // Select frame 1
    await getFrameTiles(page).nth(1).click();
    await wait(200);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);

    // Go back to frame 0 and flip all frames
    await getFrameTiles(page).nth(0).click();
    await wait(200);
    await clickTransform(page, 'tool-flip', { shift: true });

    // Verify frame 0 is flipped horizontally
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0[0][9]).toBe('X');
    expect(grid0[0][0]).toBe('.');

    // Verify frame 1 is also flipped (pixel at (0,0) → (9,0))
    const grid1 = await readPixelGrid(page, 10, 10, 0, 1);
    expect(grid1[0][9]).toBe('X');
    expect(grid1[0][0]).toBe('.');
  });

  test('flip all layers (Ctrl) should flip every layer', { tag: ['@transformations.flip', '@transformations.all-layers'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Add a second layer and draw a pixel in it
    await getAddLayerButton(page).click();
    await wait(200);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    // Flip all layers
    await clickTransform(page, 'tool-flip', { ctrl: true });

    // Verify layer 0 is flipped
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0[0][9]).toBe('X');
    expect(grid0[0][0]).toBe('.');

    // Verify layer 1 is also flipped (pixel at (1,1) → (8,1))
    const grid1 = await readPixelGrid(page, 10, 10, 1, 0);
    expect(grid1[1][8]).toBe('X');
    expect(grid1[1][1]).toBe('.');
  });

  // ─── Rotate ────────────────────────────────────────────────────

  test('rotate counter-clockwise (default)', { tag: ['@transformations.rotate'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await clickTransform(page, 'tool-rotate');

    // CCW rotation: source(sx,sy) → output(sy, 9-sx)
    // (0,0)→(0,9), (0,1)→(1,9), (0,2)→(2,9), (1,2)→(2,8), (2,2)→(2,7)
    const grid = await readPixelGrid(page, 10, 10);
    const expected = [
      '..........',  // row 0
      '..........',  // row 1
      '..........',  // row 2
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '..X.......',  // row 7
      '..X.......',  // row 8
      'XXX.......',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('rotate clockwise (Alt)', { tag: ['@transformations.rotate'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await clickTransform(page, 'tool-rotate', { alt: true });

    // CW rotation: source(sx,sy) → output(9-sy, sx)
    // (0,0)→(9,0), (0,1)→(8,0), (0,2)→(7,0), (1,2)→(7,1), (2,2)→(7,2)
    const grid = await readPixelGrid(page, 10, 10);
    const expected = [
      '.......XXX',  // row 0
      '.......X..',  // row 1
      '.......X..',  // row 2
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('rotate all frames (Shift) should rotate every frame', { tag: ['@transformations.rotate', '@transformations.all-frames'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Add frame 1 with a pixel at (0,0)
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getFrameTiles(page).nth(1).click();
    await wait(200);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);

    // Go back to frame 0, rotate all frames CCW
    await getFrameTiles(page).nth(0).click();
    await wait(200);
    await clickTransform(page, 'tool-rotate', { shift: true });

    // Frame 0: L rotated CCW — pixel at (0,9) should be set
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0[9][0]).toBe('X');
    expect(grid0[0][0]).toBe('.');

    // Frame 1: pixel at (0,0) rotated CCW → (0,9)
    const grid1 = await readPixelGrid(page, 10, 10, 0, 1);
    expect(grid1[9][0]).toBe('X');
    expect(grid1[0][0]).toBe('.');
  });

  // ─── Clone ─────────────────────────────────────────────────────

  test('clone should copy current frame pixels to all frames', { tag: ['@transformations.clone'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Add an empty second frame
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);

    // Frame 1 should be empty
    const gridBefore = await readPixelGrid(page, 10, 10, 0, 1);
    expect(gridBefore[0][0]).toBe('.');

    // Select frame 0 and clone
    await getFrameTiles(page).nth(0).click();
    await wait(200);
    await clickTransform(page, 'tool-clone');

    // Frame 1 should now have the same L-shape as frame 0
    const grid1 = await readPixelGrid(page, 10, 10, 0, 1);
    const expected = [
      'X.........',  // row 0
      'X.........',  // row 1
      'XXX.......',  // row 2
      '..........',  // row 3
      '..........',  // row 4
      '..........',  // row 5
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid1.map(r => r.join(''))).toEqual(expected);
  });

  // ─── Center ────────────────────────────────────────────────────

  test('center should move content to the center of the canvas', { tag: ['@transformations.center'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await clickTransform(page, 'tool-center');

    // L-shape bounds: (0,0)-(2,2), bw=1.5, bh=1.5, fw=5, fh=5
    // dx = floor(5-1.5-0) = 3, dy = floor(5-1.5-0) = 3
    // Pixels shift by (+3, +3)
    const grid = await readPixelGrid(page, 10, 10);
    const expected = [
      '..........',  // row 0
      '..........',  // row 1
      '..........',  // row 2
      '...X......',  // row 3
      '...X......',  // row 4
      '...XXX....',  // row 5
      '..........',  // row 6
      '..........',  // row 7
      '..........',  // row 8
      '..........',  // row 9
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('center all frames (Shift) should center every frame', { tag: ['@transformations.center', '@transformations.all-frames'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Add frame 1 with a pixel at (0,0)
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getFrameTiles(page).nth(1).click();
    await wait(200);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);

    // Go back to frame 0, center all frames
    await getFrameTiles(page).nth(0).click();
    await wait(200);
    await clickTransform(page, 'tool-center', { shift: true });

    // Frame 0: L-shape centered at (3,3)-(5,5)
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0[3][3]).toBe('X');
    expect(grid0[5][5]).toBe('X');
    expect(grid0[0][0]).toBe('.');

    // Frame 1: single pixel at (0,0) centered → (4,4)
    const grid1 = await readPixelGrid(page, 10, 10, 0, 1);
    expect(grid1[4][4]).toBe('X');
    expect(grid1[0][0]).toBe('.');
  });

  test('center all layers (Ctrl) should center every layer', { tag: ['@transformations.center', '@transformations.all-layers'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Add a second layer and draw a pixel at (0,0)
    await getAddLayerButton(page).click();
    await wait(200);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);

    // Center all layers
    await clickTransform(page, 'tool-center', { ctrl: true });

    // Layer 0: L-shape centered
    const grid0 = await readPixelGrid(page, 10, 10, 0, 0);
    expect(grid0[3][3]).toBe('X');
    expect(grid0[5][5]).toBe('X');
    expect(grid0[0][0]).toBe('.');

    // Layer 1: single pixel centered → (4,4)
    const grid1 = await readPixelGrid(page, 10, 10, 1, 0);
    expect(grid1[4][4]).toBe('X');
    expect(grid1[0][0]).toBe('.');
  });

  // ─── Crop ──────────────────────────────────────────────────────

  test('crop should resize canvas to fit content', { tag: ['@transformations.crop'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    // Canvas is 10x10, content is at (0,0)-(2,2) → crop to 3x3
    await clickTransform(page, 'tool-crop');

    // Wait for resize to apply
    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 3);

    expect(await getCurrentPiskelWidth(page)).toBe(3);
    expect(await getCurrentPiskelHeight(page)).toBe(3);

    const grid = await readPixelGrid(page, 3, 3);
    const expected = [
      'X..',  // row 0
      'X..',  // row 1
      'XXX',  // row 2
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  test('crop to selection should resize canvas to selection bounds', { tag: ['@transformations.crop-selection'] }, async ({ page }) => {
    await openEditor(page);

    // Fill entire 10x10 canvas with color
    const fullGrid = emptyTestGrid();
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        fullGrid[y][x] = 'R';
      }
    }
    await setPiskelFromGrid(page, fullGrid);

    // Make a rectangle selection from (2,3) to (6,7) → 5x5 region
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 2, 3, 6, 7);
    await wait(200);

    // Crop to selection
    await clickTransform(page, 'tool-crop');

    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 5);

    expect(await getCurrentPiskelWidth(page)).toBe(5);
    expect(await getCurrentPiskelHeight(page)).toBe(5);

    // All pixels should still be filled (we cropped a filled region)
    const grid = await readPixelGrid(page, 5, 5);
    const expected = [
      'XXXXX',
      'XXXXX',
      'XXXXX',
      'XXXXX',
      'XXXXX',
    ];
    expect(grid.map(r => r.join(''))).toEqual(expected);
  });

  // ─── Show more toggle ─────────────────────────────────────────

  test('show more toggle should expand/collapse transform tools', { tag: ['@transformations.show-more'] }, async ({ page }) => {
    await openEditor(page);

    const container = page.locator('.transformations-container');
    const toolsWrapper = container.locator('.tools-wrapper');
    const showMoreLink = page.locator('.transformations-show-more-link');

    // Initially not expanded — tools wrapper height should be 46px
    await expect(container).not.toHaveClass(/show-more/);
    const collapsedHeight = await toolsWrapper.evaluate(el => getComputedStyle(el).height);
    expect(parseInt(collapsedHeight)).toBe(46);

    // Click show more — height should grow beyond 46px
    await showMoreLink.click();
    await waitFor(async () => {
      const cls = await container.getAttribute('class') ?? '';
      return cls.includes('show-more');
    });
    await expect(container).toHaveClass(/show-more/);
    const expandedHeight = await toolsWrapper.evaluate(el => parseFloat(getComputedStyle(el).height));
    expect(expandedHeight).toBeGreaterThan(46);

    // Click again to collapse — height should return to 46px
    await showMoreLink.click();
    await waitFor(async () => {
      const cls = await container.getAttribute('class') ?? '';
      return !cls.includes('show-more');
    });
    await expect(container).not.toHaveClass(/show-more/);
    const reCollapsedHeight = await toolsWrapper.evaluate(el => getComputedStyle(el).height);
    expect(parseInt(reCollapsedHeight)).toBe(46);
  });

  test('expanding and collapsing the panel is remembered after a reload', { tag: ['@transformations.show-more-saved'] }, async ({ page }) => {
    await openEditor(page);

    const container = page.locator('.transformations-container');
    const toolsWrapper = container.locator('.tools-wrapper');
    const showMoreLink = page.locator('.transformations-show-more-link');

    await showMoreLink.click();
    await expect(container).toHaveClass(/show-more/);

    await page.reload();
    await waitForEditorReady(page);
    await expect(container).toHaveClass(/show-more/);
    const expandedHeight = await toolsWrapper.evaluate(el => parseFloat(getComputedStyle(el).height));
    expect(expandedHeight).toBeGreaterThan(46);

    await showMoreLink.click();
    await expect(container).not.toHaveClass(/show-more/);

    await page.reload();
    await waitForEditorReady(page);
    await expect(container).not.toHaveClass(/show-more/);
    const collapsedHeight = await toolsWrapper.evaluate(el => parseFloat(getComputedStyle(el).height));
    expect(collapsedHeight).toBe(46);
  });

  // ─── Crop no-op ───────────────────────────────────────────────

  test('crop should do nothing when the content already fills the canvas', { tag: ['@transformations.crop-noop'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(CORNERS));

    // Draw a pixel, so that the next undo shows if the crop was recorded
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 5, 5);

    await clickTransform(page, 'tool-crop');

    expect(await getCurrentPiskelWidth(page)).toBe(10);
    expect(await getCurrentPiskelHeight(page)).toBe(10);
    const grid = await readPixelGrid(page, 10, 10);
    expect(grid[5][5]).toBe('X');
    expect(grid[0][0]).toBe('X');
    expect(grid[9][9]).toBe('X');

    // The crop is not a step of the history: undo removes the pixel
    await undo(page);
    await waitForGrid(page, 10, 10, CORNERS);
  });

  test('crop should do nothing when the sprite is empty', { tag: ['@transformations.crop-noop'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());

    await clickTransform(page, 'tool-crop');

    expect(await getCurrentPiskelWidth(page)).toBe(10);
    expect(await getCurrentPiskelHeight(page)).toBe(10);
    expect(await isCurrentPiskelEmpty(page)).toBe(true);
  });

  // ─── Rotate non-square ────────────────────────────────────────

  test('rotate counter-clockwise on a wide sprite should rotate around the center', { tag: ['@transformations.rotate-non-square'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(WIDE_SPRITE));

    await clickTransform(page, 'tool-rotate');

    // Only the 2x2 square at the center stays on the canvas
    expect(await getCurrentPiskelWidth(page)).toBe(6);
    expect(await getCurrentPiskelHeight(page)).toBe(2);
    const grid = await readPixelGrid(page, 6, 2);
    expect(grid.map(r => r.join(''))).toEqual([
      '..X...',  // row 0
      '..XX..',  // row 1
    ]);
  });

  test('rotate clockwise on a wide sprite should rotate around the center', { tag: ['@transformations.rotate-non-square'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(WIDE_SPRITE));

    await clickTransform(page, 'tool-rotate', { alt: true });

    const grid = await readPixelGrid(page, 6, 2);
    expect(grid.map(r => r.join(''))).toEqual([
      '..XX..',  // row 0
      '...X..',  // row 1
    ]);
  });

  test('rotate counter-clockwise on a tall sprite should rotate around the center', { tag: ['@transformations.rotate-non-square'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows([
      'X.',  // row 0, lost
      '..',  // row 1
      'XX',  // row 2
      'X.',  // row 3
      '..',  // row 4
      '.X',  // row 5, lost
    ]));

    await clickTransform(page, 'tool-rotate');

    expect(await getCurrentPiskelWidth(page)).toBe(2);
    expect(await getCurrentPiskelHeight(page)).toBe(6);
    const grid = await readPixelGrid(page, 2, 6);
    expect(grid.map(r => r.join(''))).toEqual([
      '..',  // row 0
      '..',  // row 1
      'X.',  // row 2
      'XX',  // row 3
      '..',  // row 4
      '..',  // row 5
    ]);
  });

  // ─── Undo ─────────────────────────────────────────────────────

  for (const toolId of ['tool-flip', 'tool-rotate', 'tool-center']) {
    test(`${toolId} should be a single undo step`, { tag: ['@transformations.undo'] }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, lShapeGrid());

      await clickTool(page, 'tool-pen');
      await drawAtPixel(page, 5, 5);

      await clickTransform(page, toolId);
      const transformed = await readPixelGrid(page, 10, 10);
      expect(transformed.map(r => r.join(''))).not.toEqual(L_SHAPE_AND_PIXEL);

      // The first undo only reverts the transformation, the second one the pixel
      await undo(page);
      await waitForGrid(page, 10, 10, L_SHAPE_AND_PIXEL);
      // Undo is ignored within 50ms of the previous one (undo-redo.throttle)
      await wait(100);
      await undo(page);
      await waitForGrid(page, 10, 10, L_SHAPE);
    });
  }

  test('clone should be a single undo step', { tag: ['@transformations.undo'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getFrameTiles(page).nth(0).click();
    await wait(200);

    await clickTransform(page, 'tool-clone');
    await waitForGrid(page, 10, 10, L_SHAPE, { frameIndex: 1 });

    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY, { frameIndex: 1 });
    await waitForGrid(page, 10, 10, L_SHAPE, { frameIndex: 0 });
  });

  test('crop should be a single undo step', { tag: ['@transformations.undo'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, lShapeGrid());

    await clickTransform(page, 'tool-crop');
    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 3);

    await undo(page);
    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 10);
    expect(await getCurrentPiskelHeight(page)).toBe(10);
    await waitForGrid(page, 10, 10, L_SHAPE);
  });

  test('a transformation of all frames and layers should be a single undo step', { tag: ['@transformations.undo'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows([
      'X...',
      'X...',
      'XXX.',
      '....',
    ]));

    // Frame 1 of layer 0 gets a pixel at (0,0)
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getFrameTiles(page).nth(1).click();
    await wait(200);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual([
      'X...',
      '....',
      '....',
      '....',
    ]);

    // Frame 1 of layer 1 gets a pixel at (1,1)
    await getAddLayerButton(page).click();
    await wait(200);
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual([
      '....',
      '.X..',
      '....',
      '....',
    ]);

    // Shift applies the flip to all frames, Ctrl to all layers
    await clickTransform(page, 'tool-flip', { shift: true, ctrl: true });

    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual([
      '...X',
      '...X',
      '.XXX',
      '....',
    ]);
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual([
      '...X',
      '....',
      '....',
      '....',
    ]);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual([
      '....',
      '..X.',
      '....',
      '....',
    ]);

    await undo(page);

    await waitForGrid(page, 4, 4, [
      'X...',
      'X...',
      'XXX.',
      '....',
    ], { layerIndex: 0, frameIndex: 0 });
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual([
      'X...',
      '....',
      '....',
      '....',
    ]);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual([
      '....',
      '.X..',
      '....',
      '....',
    ]);
  });
});
