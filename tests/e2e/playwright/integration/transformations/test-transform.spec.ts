import test, { expect } from "@playwright/test";
import {
  openEditor,
  setPiskelFromGrid,
  readPixelRows,
  drawAtPixel,
  clickTool,
  clickTransform,
  dragBetweenPixels,
  dragThroughPixels,
  getAddFrameButton,
  getAddLayerButton,
  getLayerItems,
  waitFor,
  wait,
  gridFromRows,
  gridFromColorRows,
  isCurrentPiskelEmpty,
  undo,
  redo,
  assertSpriteSize,
  assertColorRows,
  selectBottomLayer,
  assertCurrentLayer,
  waitForEditorReady,
  waitForGrid,
  assertFrameCount,
  selectFrame,
} from "../../testutils";

/** 10x10 sprites */
const L_SHAPE = [
  'X.........',
  'X.........',
  'XXX.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const L_SHAPE_AND_PIXEL = [
  'X.........',
  'X.........',
  'XXX.......',
  '..........',
  '..........',
  '.....X....',
  '..........',
  '..........',
  '..........',
  '..........',
];
/** The bounding box of the content is the whole canvas */
const CORNERS = [
  'X.........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '.........X',
];

/** A 10x10 sprite with a single pixel in one corner */
const TOP_LEFT = [
  'X.........',
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
const TOP_RIGHT = [
  '.........X',
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
const BOTTOM_LEFT = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  'X.........',
];
const BOTTOM_RIGHT = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '.........X',
];
const EMPTY_10X10 = [
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

/** A 6x2 sprite, with pixels that don't fit on the canvas once rotated. It's
 * rectangular because the claim is about non-square sprites. */
const WIDE_SPRITE = [
  'X.XX..',
  '..X..X',
];

test.describe('Transform panel', () => {

  // ─── Flip ──────────────────────────────────────────────────────

  test('flip horizontal (default) should mirror pixels left-right', { tag: ['@transformations.flip'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    await clickTransform(page, 'tool-flip');

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '.........X',
      '.........X',
      '.......XXX',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('flip vertical (Alt) should mirror pixels top-bottom', { tag: ['@transformations.flip'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Alt flips vertically
    await clickTransform(page, 'tool-flip', { alt: true });

    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      'XXX.......',
      'X.........',
      'X.........',
    ]);
  });

  test('flip all frames (Shift) should flip every frame', { tag: ['@transformations.flip', '@transformations.all-frames'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add a second frame, with a pixel at (0,0).
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual([
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Go back to the first frame.
    await selectFrame(page, 0);

    // Shift flips all the frames
    await clickTransform(page, 'tool-flip', { shift: true });

    // Both frames are flipped.
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual([
      '.........X',
      '.........X',
      '.......XXX',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual([
      '.........X',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('flip all layers (Ctrl) should flip every layer', { tag: ['@transformations.flip', '@transformations.all-layers'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add a top layer, with a pixel at (1,1).
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual([
      '..........',
      '.X........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Ctrl flips all the layers
    await clickTransform(page, 'tool-flip', { ctrl: true });

    // Both layers are flipped.
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual([
      '.........X',
      '.........X',
      '.......XXX',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual([
      '..........',
      '........X.',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('rotate counter-clockwise (default)', { tag: ['@transformations.rotate'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    await clickTransform(page, 'tool-rotate');

    // The L shape turns a quarter to the left, around the center.
    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..X.......',
      '..X.......',
      'XXX.......',
    ]);
  });

  test('rotate clockwise (Alt)', { tag: ['@transformations.rotate'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Alt rotates clockwise
    await clickTransform(page, 'tool-rotate', { alt: true });

    // The L shape turns a quarter to the right, around the center.
    expect(await readPixelRows(page, 10, 10)).toEqual([
      '.......XXX',
      '.......X..',
      '.......X..',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('rotate all frames (Shift) should rotate every frame', { tag: ['@transformations.rotate', '@transformations.all-frames'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add a second frame, with a pixel at (0,0).
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual([
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Go back to the first frame.
    await selectFrame(page, 0);

    // Shift rotates all the frames
    await clickTransform(page, 'tool-rotate', { shift: true });

    // Both frames are rotated counter-clockwise.
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..X.......',
      '..X.......',
      'XXX.......',
    ]);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      'X.........',
    ]);
  });

  test('clone should copy current frame pixels to all frames', { tag: ['@transformations.clone'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add an empty second frame.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(EMPTY_10X10);

    // Clone the first frame.
    await selectFrame(page, 0);
    await clickTransform(page, 'tool-clone');

    // The second frame now has the L shape too.
    await waitForGrid(page, 10, 10, L_SHAPE, { frameIndex: 1 });
  });

  test('clone should leave the other layers unchanged', { tag: ['@transformations.clone'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(TOP_LEFT));

    // Add a second frame, and a top layer with a pixel in that frame only.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await selectFrame(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 9, 9);
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual(BOTTOM_RIGHT);

    // Clone the first frame of the bottom layer.
    await selectBottomLayer(page);
    await selectFrame(page, 0);
    await clickTransform(page, 'tool-clone');

    // The bottom layer now shows its first frame in both frames.
    await waitForGrid(page, 10, 10, TOP_LEFT, { layerIndex: 0, frameIndex: 1 });

    // The top layer is unchanged.
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual(EMPTY_10X10);
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual(BOTTOM_RIGHT);
  });

  // ─── Center ────────────────────────────────────────────────────

  test('center should move content to the center of the canvas', { tag: ['@transformations.center'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    await clickTransform(page, 'tool-center');

    // The L shape takes 3x3 pixels, so it moves by 3 pixels right and down,
    // leaving 3 pixels on the left and top, and 4 on the right and bottom.
    expect(await readPixelRows(page, 10, 10)).toEqual([
      '..........',
      '..........',
      '..........',
      '...X......',
      '...X......',
      '...XXX....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('center all frames (Shift) should center every frame', { tag: ['@transformations.center', '@transformations.all-frames'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add a second frame, with a pixel at (0,0).
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual([
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Go back to the first frame.
    await selectFrame(page, 0);

    // Shift centers all the frames
    await clickTransform(page, 'tool-center', { shift: true });

    // Each frame is centered on its own content.
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual([
      '..........',
      '..........',
      '..........',
      '...X......',
      '...X......',
      '...XXX....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '....X.....',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('center all layers (Ctrl) should center every layer', { tag: ['@transformations.center', '@transformations.all-layers'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add a top layer, with a pixel at (0,0).
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual([
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Ctrl centers all the layers
    await clickTransform(page, 'tool-center', { ctrl: true });

    // Each layer is centered on its own content.
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual([
      '..........',
      '..........',
      '..........',
      '...X......',
      '...X......',
      '...XXX....',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual([
      '..........',
      '..........',
      '..........',
      '..........',
      '....X.....',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  // ─── Crop ──────────────────────────────────────────────────────

  test('crop should resize canvas to fit content', { tag: ['@transformations.crop'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // The content takes the top left 3x3 pixels: the sprite is cropped to them.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 3, 3);
    await waitForGrid(page, 3, 3, [
      'X..',
      'X..',
      'XXX',
    ]);
  });

  test('crop to selection should resize canvas to selection bounds', { tag: ['@transformations.crop-selection'] }, async ({ page }) => {
    // Start from a sprite filled with color.
    await openEditor(page);
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

    // Select the 5x5 pixels from (2,3) to (6,7).
    await clickTool(page, 'tool-rectangle-select');
    await dragBetweenPixels(page, 2, 3, 6, 7);

    // Crop: the sprite is resized to the selection.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 5, 5);
    await waitForGrid(page, 5, 5, [
      'XXXXX',
      'XXXXX',
      'XXXXX',
      'XXXXX',
      'XXXXX',
    ]);
  });

  test('crop to a lasso selection should keep the pixels of its bounding box, and redo should crop the same way', {
    tag: ['@transformations.crop-selection', '@undo-redo.shortcuts'],
  }, async ({ page }) => {
    await openEditor(page);
    const sprite = [
      'X.........',
      '.X........',
      '..........',
      '...X......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '.........X',
    ];
    await setPiskelFromGrid(page, gridFromRows(sprite));

    // Select a triangle whose bounding box goes from (1,1) to (3,3). The pixel at
    // (3,3) is in that box, but outside the triangle.
    await clickTool(page, 'tool-lasso-select');
    await dragThroughPixels(page, [[1, 1], [3, 1], [1, 3], [1, 1]]);

    // The sprite is cropped to the bounding box, with the pixel outside the triangle.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 3, 3);
    await waitForGrid(page, 3, 3, [
      'X..',
      '...',
      '..X',
    ]);

    // Undo restores the whole sprite.
    await undo(page);
    await assertSpriteSize(page, 10, 10);
    await waitForGrid(page, 10, 10, sprite);

    // Redo crops to the same box, although the selection is gone: cropping to the
    // content would leave the sprite as it is.
    // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
    await wait(100);
    await redo(page);
    await assertSpriteSize(page, 3, 3);
    await waitForGrid(page, 3, 3, [
      'X..',
      '...',
      '..X',
    ]);
  });

  test('crop to a shape selection should keep the other pixels of its bounding box, and dismiss the selection', {
    tag: ['@transformations.crop-selection'],
  }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RRR.......',
      'R.........',
      'R.G.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '.........B',
    ]));

    // Select the red shape, whose bounding box goes from (0,0) to (2,2). The green
    // pixel is in that box, but not in the shape. The blue pixel is outside the box,
    // so cropping to the content would leave the sprite as it is.
    await clickTool(page, 'tool-shape-select');
    await drawAtPixel(page, 0, 0);

    // The sprite is cropped to the bounding box, with the green pixel.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 3, 3);
    await assertColorRows(page, [
      'RRR',
      'R..',
      'R.G',
    ]);

    // The selection is gone: Delete, which deletes the selected pixels, does nothing.
    await page.keyboard.press('Delete');
    await assertColorRows(page, [
      'RRR',
      'R..',
      'R.G',
    ]);
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

    // Draw a pixel, so that the next undo shows if the crop was recorded.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 5, 5);
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '.....X....',
      '..........',
      '..........',
      '..........',
      '.........X',
    ]);

    // Crop: the content already fills the canvas, so nothing changes.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 10, 10);
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '.....X....',
      '..........',
      '..........',
      '..........',
      '.........X',
    ]);

    // The crop is not a step of the history: undo removes the pixel.
    await undo(page);
    await waitForGrid(page, 10, 10, CORNERS);
  });

  test('crop should do nothing when the sprite is empty', { tag: ['@transformations.crop-noop'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY_10X10));

    // Crop: there is no content, so nothing changes.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 10, 10);
    expect(await isCurrentPiskelEmpty(page)).toBe(true);
  });

  // ─── Rotate non-square ────────────────────────────────────────

  test('rotate counter-clockwise on a wide sprite should rotate around the center', { tag: ['@transformations.rotate-non-square'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(WIDE_SPRITE));

    await clickTransform(page, 'tool-rotate');

    // The size doesn't change, so only the 2x2 square at the center stays on the canvas.
    await assertSpriteSize(page, 6, 2);
    expect(await readPixelRows(page, 6, 2)).toEqual([
      '..X...',
      '..XX..',
    ]);
  });

  test('rotate clockwise on a wide sprite should rotate around the center', { tag: ['@transformations.rotate-non-square'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(WIDE_SPRITE));

    // Alt rotates clockwise
    await clickTransform(page, 'tool-rotate', { alt: true });

    // The size doesn't change, so only the 2x2 square at the center stays on the canvas.
    expect(await readPixelRows(page, 6, 2)).toEqual([
      '..XX..',
      '...X..',
    ]);
  });

  test('rotate counter-clockwise on a tall sprite should rotate around the center', { tag: ['@transformations.rotate-non-square'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows([
      'X.',  // row 0, lost
      '..',
      'XX',
      'X.',
      '..',
      '.X',  // row 5, lost
    ]));

    await clickTransform(page, 'tool-rotate');

    // The size doesn't change, so only the 2x2 square at the center stays on the canvas.
    await assertSpriteSize(page, 2, 6);
    expect(await readPixelRows(page, 2, 6)).toEqual([
      '..',
      '..',
      'X.',
      'XX',
      '..',
      '..',
    ]);
  });

  // ─── Undo ─────────────────────────────────────────────────────

  const singleUndoSteps = [
    {
      toolId: 'tool-flip',
      transformed: [
        '.........X',
        '.........X',
        '.......XXX',
        '..........',
        '..........',
        '....X.....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    },
    {
      toolId: 'tool-rotate',
      transformed: [
        '..........',
        '..........',
        '..........',
        '..........',
        '.....X....',
        '..........',
        '..........',
        '..X.......',
        '..X.......',
        'XXX.......',
      ],
    },
    {
      toolId: 'tool-center',
      transformed: [
        '..........',
        '..........',
        '..X.......',
        '..X.......',
        '..XXX.....',
        '..........',
        '..........',
        '.......X..',
        '..........',
        '..........',
      ],
    },
  ];
  for (const { toolId, transformed } of singleUndoSteps) {
    test(`${toolId} should be a single undo step`, { tag: ['@transformations.undo'] }, async ({ page }) => {
      // Draw a pixel on the L shape.
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(L_SHAPE));
      await clickTool(page, 'tool-pen');
      await drawAtPixel(page, 5, 5);
      await waitForGrid(page, 10, 10, L_SHAPE_AND_PIXEL);

      // Apply the transformation.
      await clickTransform(page, toolId);
      await waitForGrid(page, 10, 10, transformed);

      // The first undo only reverts the transformation, the second one the pixel.
      await undo(page);
      await waitForGrid(page, 10, 10, L_SHAPE_AND_PIXEL);
      // Undo is ignored within 50ms of the previous one (undo-redo.throttle)
      await wait(100);
      await undo(page);
      await waitForGrid(page, 10, 10, L_SHAPE);
    });
  }

  test('clone should be a single undo step', { tag: ['@transformations.undo'] }, async ({ page }) => {
    // Add an empty second frame, and clone the L shape of the first frame into it.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 0);
    await clickTransform(page, 'tool-clone');
    await waitForGrid(page, 10, 10, L_SHAPE, { frameIndex: 1 });

    // A single undo empties the second frame again.
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY_10X10, { frameIndex: 1 });
    await waitForGrid(page, 10, 10, L_SHAPE, { frameIndex: 0 });
  });

  test('crop should be a single undo step', { tag: ['@transformations.undo'] }, async ({ page }) => {
    // Crop the L shape.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 3, 3);

    // A single undo restores the size and the position of the pixels.
    await undo(page);
    await assertSpriteSize(page, 10, 10);
    await waitForGrid(page, 10, 10, L_SHAPE);
  });

  test('a transformation of all frames and layers should be a single undo step', { tag: ['@transformations.undo'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Add a second frame, with a pixel at (0,0).
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(TOP_LEFT);

    // Add a top layer, with a pixel at (1,1) in the second frame.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual([
      '..........',
      '.X........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Shift applies the flip to all frames, Ctrl to all layers
    await clickTransform(page, 'tool-flip', { shift: true, ctrl: true });
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual([
      '.........X',
      '.........X',
      '.......XXX',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(TOP_RIGHT);
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual([
      '..........',
      '........X.',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // A single undo reverts all of them.
    await undo(page);
    await waitForGrid(page, 10, 10, L_SHAPE, { layerIndex: 0, frameIndex: 0 });
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(TOP_LEFT);
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual([
      '..........',
      '.X........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });

  // Each case starts from a pixel in the top left corner.
  const twiceTransformed = [
    {
      name: 'flip',
      toolId: 'tool-flip',
      modifiers: {},
      afterFirst: TOP_RIGHT,
      afterSecond: TOP_LEFT,
    },
    {
      name: 'counter-clockwise rotation',
      toolId: 'tool-rotate',
      modifiers: {},
      afterFirst: BOTTOM_LEFT,
      afterSecond: BOTTOM_RIGHT,
    },
    {
      name: 'clockwise rotation',
      toolId: 'tool-rotate',
      // Alt rotates clockwise
      modifiers: { alt: true },
      afterFirst: TOP_RIGHT,
      afterSecond: BOTTOM_RIGHT,
    },
  ];
  for (const { name, toolId, modifiers, afterFirst, afterSecond } of twiceTransformed) {
    test(`undoing the second of two ${name}s should keep the first one`, { tag: ['@transformations.undo'] }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(TOP_LEFT));

      // Apply the transformation twice.
      await clickTransform(page, toolId, modifiers);
      await waitForGrid(page, 10, 10, afterFirst);
      await clickTransform(page, toolId, modifiers);
      await waitForGrid(page, 10, 10, afterSecond);

      // Undo removes only the second one.
      await undo(page);
      await waitForGrid(page, 10, 10, afterFirst);
    });
  }

  test('undoing a clone should keep an earlier clone of another layer', { tag: ['@transformations.undo'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(TOP_LEFT));

    // Add a second frame, and a top layer with a pixel in the first frame.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await selectFrame(page, 0);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 9, 9);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual(BOTTOM_RIGHT);

    // Clone the bottom layer, then the top layer (the list shows the top layer first).
    await selectBottomLayer(page);
    await clickTransform(page, 'tool-clone');
    await waitForGrid(page, 10, 10, TOP_LEFT, { layerIndex: 0, frameIndex: 1 });
    await getLayerItems(page).first().click();
    await assertCurrentLayer(page, 1);
    await clickTransform(page, 'tool-clone');
    await waitForGrid(page, 10, 10, BOTTOM_RIGHT, { layerIndex: 1, frameIndex: 1 });

    // Undo removes the clone of the top layer only.
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY_10X10, { layerIndex: 1, frameIndex: 1 });
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(TOP_LEFT);
  });

  test('undoing a second crop should go back to the size of the first one', { tag: ['@transformations.undo'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows([
      '..........',
      '.X.X......',
      '..........',
      '.XX.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));

    // Crop to the content.
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 3, 3);
    await waitForGrid(page, 3, 3, [
      'X.X',
      '...',
      'XX.',
    ]);

    // Erase the top right pixel, and crop again.
    await clickTool(page, 'tool-eraser');
    await drawAtPixel(page, 2, 0);
    await waitForGrid(page, 3, 3, [
      'X..',
      '...',
      'XX.',
    ]);
    await clickTransform(page, 'tool-crop');
    await assertSpriteSize(page, 2, 3);
    await waitForGrid(page, 2, 3, [
      'X.',
      '..',
      'XX',
    ]);

    // Undo goes back to the first crop, with the pixel still erased.
    await undo(page);
    await assertSpriteSize(page, 3, 3);
    await waitForGrid(page, 3, 3, [
      'X..',
      '...',
      'XX.',
    ]);
  });

  test('undo and redo should go back and forth through transformations', {
    tag: ['@transformations.undo', '@undo-redo.shortcuts'],
  }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY_10X10));

    // Draw a pixel, flip it horizontally, then vertically (Alt).
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitForGrid(page, 10, 10, TOP_LEFT);
    await clickTransform(page, 'tool-flip');
    await waitForGrid(page, 10, 10, TOP_RIGHT);
    await clickTransform(page, 'tool-flip', { alt: true });
    await waitForGrid(page, 10, 10, BOTTOM_RIGHT);

    // Undo everything, one step at a time.
    // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
    await undo(page);
    await waitForGrid(page, 10, 10, TOP_RIGHT);
    await wait(100);
    await undo(page);
    await waitForGrid(page, 10, 10, TOP_LEFT);
    await wait(100);
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY_10X10);

    // Redo everything, one step at a time.
    await wait(100);
    await redo(page);
    await waitForGrid(page, 10, 10, TOP_LEFT);
    await wait(100);
    await redo(page);
    await waitForGrid(page, 10, 10, TOP_RIGHT);
    await wait(100);
    await redo(page);
    await waitForGrid(page, 10, 10, BOTTOM_RIGHT);
  });
});
