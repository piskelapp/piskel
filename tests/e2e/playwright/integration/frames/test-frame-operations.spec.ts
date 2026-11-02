import test, { expect } from "@playwright/test";
import {
  openEditor,
  getCurrentPiskelFrameCount,
  getCurrentFrameIndex,
  testId,
  setPrimaryColor,
  getPixelColor,
  drawAtPixel,
  clickTool,
  colorToInt,
  getFrameTiles,
  getAddFrameButton,
  waitFor,
  assertCurrentFrame,
  assertCurrentLayer,
  assertFrameCount,
  assertFrameNumbers,
  assertFrameThumbnail,
  createThreeFrames,
  deleteFrame,
  getAddLayerButton,
  gridFromRows,
  PIXEL_IN_FIRST_COLUMN,
  PIXEL_IN_SECOND_COLUMN,
  PIXEL_IN_THIRD_COLUMN,
  readPixelRows,
  selectBottomLayer,
  selectFrame,
  setPiskelFromGrid,
} from "../../testutils";

const EMPTY = [
  '....',
  '....',
  '....',
  '....',
];

test.describe('Frame operations', () => {

  test('should start with one frame', { tag: ['@frames.at-least-one'] }, async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    await assertFrameCount(page, 1);
  });

  test('should add a new frame', { tag: ['@frames.add'] }, async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);
    await assertFrameCount(page, 2);
  });

  test('should select a frame by clicking', { tag: ['@frames.select'] }, async ({ page }) => {
    await openEditor(page);

    // Add a second frame
    await getAddFrameButton(page).click();
    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // Click on the first frame tile (index 0)
    await selectFrame(page, 0);
    expect(await getCurrentFrameIndex(page)).toBe(0);

    // Click on the second frame tile (index 1)
    await selectFrame(page, 1);
    expect(await getCurrentFrameIndex(page)).toBe(1);
  });

  test('should duplicate a frame', { tag: ['@frames.duplicate'] }, async ({ page }) => {
    await openEditor(page);

    // Draw something on frame 0 so the duplicate has content
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Hover on the frame tile to reveal the duplicate button, then click
    await getFrameTiles(page).nth(0).hover();
    await testId(page, 'duplicate-frame-button').nth(0).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // The duplicated frame (index 1) should have the same red pixel
    const pixel = await getPixelColor(page, 0, 0, 0, 1);
    expect(pixel).toBe(colorToInt('#FF0000'));
  });

  test('should delete the last frame', { tag: ['@frames.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Add a second frame
    await getAddFrameButton(page).click();
    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // Hover on frame tile 1 and delete it
    await deleteFrame(page, 1);

    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    await assertFrameCount(page, 1);
  });

  test('should delete the first frame and keep the second', { tag: ['@frames.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Draw red on frame 0
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Add frame 1 and draw green
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // Delete frame 0 (the red one)
    await deleteFrame(page, 0);

    // Only 1 frame remains — it should be the green one
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#00FF00'));
  });

  test('should delete a middle frame', { tag: ['@frames.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Frame 0: red
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Frame 1: green
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);

    // Frame 2: blue
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 0);

    expect(await getCurrentPiskelFrameCount(page)).toBe(3);

    // Delete middle frame (green, index 1)
    await deleteFrame(page, 1);

    // 2 frames remain: red (index 0) and blue (index 1)
    expect(await getCurrentPiskelFrameCount(page)).toBe(2);
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 0, 0, 0, 1)).toBe(colorToInt('#0000FF'));
  });

  test('should add multiple frames', { tag: ['@frames.add'] }, async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await getAddFrameButton(page).click();
    await getAddFrameButton(page).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(4);
    await assertFrameCount(page, 4);
  });

  test('should navigate frames with keyboard shortcuts', { tag: ['@frames.navigate'] }, async ({ page }) => {
    await openEditor(page);

    // Add frames
    await getAddFrameButton(page).click();
    await getAddFrameButton(page).click();
    expect(await getCurrentPiskelFrameCount(page)).toBe(3);

    // Select first frame
    await selectFrame(page, 0);
    expect(await getCurrentFrameIndex(page)).toBe(0);

    // Navigate down (next frame)
    await page.keyboard.press('ArrowDown');
    expect(await getCurrentFrameIndex(page)).toBe(1);

    await page.keyboard.press('ArrowDown');
    expect(await getCurrentFrameIndex(page)).toBe(2);

    // Navigate up (previous frame)
    await page.keyboard.press('ArrowUp');
    expect(await getCurrentFrameIndex(page)).toBe(1);
  });

  test('should add a new frame with N shortcut', { tag: ['@frames.add-shortcut'] }, async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);

    await page.keyboard.press('n');

    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 2);
  });

  test('should duplicate frame with content via UI button', { tag: ['@frames.duplicate'] }, async ({ page }) => {
    await openEditor(page);

    // Draw something on frame 0 via the pen tool
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    // Duplicate via the frame tile button
    await getFrameTiles(page).nth(0).hover();
    await testId(page, 'duplicate-frame-button').nth(0).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);
    // Duplicated frame should have the same black pixel (default primary color)
    const pixel = await getPixelColor(page, 1, 1, 0, 1);
    expect(pixel).toBe(colorToInt('#000000'));
  });

  test('should duplicate a middle frame and insert after it', { tag: ['@frames.duplicate'] }, async ({ page }) => {
    await openEditor(page);
    await clickTool(page, 'tool-pen');

    // Frame 0: red
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Frame 1: green
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);

    // Frame 2: blue
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 0);

    expect(await getCurrentPiskelFrameCount(page)).toBe(3);

    // Duplicate frame 1 (green)
    await getFrameTiles(page).nth(1).hover();
    await testId(page, 'duplicate-frame-button').nth(1).click();

    // Should now have 4 frames: red, green, green-copy, blue
    expect(await getCurrentPiskelFrameCount(page)).toBe(4);
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 0, 0, 0, 1)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 0, 0, 2)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 0, 0, 3)).toBe(colorToInt('#0000FF'));
  });

  // ─── Selection after a delete ─────────────────────────────────

  test('deleting the last frame should select the previous one', { tag: ['@frames.delete-selection'] }, async ({ page }) => {
    await openEditor(page);
    await createThreeFrames(page);

    // Delete the last frame, which is the current one.
    await assertCurrentFrame(page, 2);
    await deleteFrame(page, 2);
    await assertFrameCount(page, 2);

    // The previous frame is selected.
    await assertCurrentFrame(page, 1);
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual(PIXEL_IN_SECOND_COLUMN);
  });

  test('deleting a middle frame should select the previous one', { tag: ['@frames.delete-selection'] }, async ({ page }) => {
    await openEditor(page);
    await createThreeFrames(page);

    // Delete the middle frame, after selecting it.
    await selectFrame(page, 1);
    await deleteFrame(page, 1);
    await assertFrameCount(page, 2);

    // The previous frame is selected.
    await assertCurrentFrame(page, 0);
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(PIXEL_IN_FIRST_COLUMN);
  });

  test('deleting the first frame should select the new first frame', { tag: ['@frames.delete-selection'] }, async ({ page }) => {
    await openEditor(page);
    await createThreeFrames(page);

    // Delete the first frame, after selecting it.
    await selectFrame(page, 0);
    await deleteFrame(page, 0);
    await assertFrameCount(page, 2);

    // The frame that was second is now first, and selected.
    await assertCurrentFrame(page, 0);
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(PIXEL_IN_SECOND_COLUMN);
  });

  // ─── Layers ───────────────────────────────────────────────────

  test('adding and deleting a frame should affect all layers', { tag: ['@frames.all-layers'] }, async ({ page }) => {
    // Start from an empty sprite with two layers.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    // Add a frame: both layers get it, empty.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual(EMPTY);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual(EMPTY);

    // Draw in the new frame of the top layer.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual(PIXEL_IN_FIRST_COLUMN);

    // Draw in the new frame of the bottom layer.
    await selectBottomLayer(page);
    await drawAtPixel(page, 1, 0);
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual(PIXEL_IN_SECOND_COLUMN);

    // Delete the first frame: both layers lose it, and keep their second frame.
    await deleteFrame(page, 0);
    await assertFrameCount(page, 1);
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(PIXEL_IN_SECOND_COLUMN);
    expect(await readPixelRows(page, 4, 4, 1, 0)).toEqual(PIXEL_IN_FIRST_COLUMN);
  });

  test('a new layer should have as many frames as the sprite', { tag: ['@frames.all-layers'] }, async ({ page }) => {
    // Start from an empty sprite with two frames.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);

    // Add a layer: it has the two frames too.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    expect(await readPixelRows(page, 4, 4, 1, 0)).toEqual(EMPTY);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual(EMPTY);
  });

  // ─── Tiles ────────────────────────────────────────────────────

  test('tiles should show the number and the thumbnail of each frame', { tag: ['@frames.tiles'] }, async ({ page }) => {
    await openEditor(page);
    await createThreeFrames(page);

    await assertFrameNumbers(page, ['1', '2', '3']);
    await assertFrameThumbnail(page, 0, PIXEL_IN_FIRST_COLUMN);
    await assertFrameThumbnail(page, 1, PIXEL_IN_SECOND_COLUMN);
    await assertFrameThumbnail(page, 2, PIXEL_IN_THIRD_COLUMN);

    // Delete the first frame: the other tiles move up and get a new number.
    await deleteFrame(page, 0);
    await assertFrameCount(page, 2);
    await assertFrameNumbers(page, ['1', '2']);
    await assertFrameThumbnail(page, 0, PIXEL_IN_SECOND_COLUMN);
    await assertFrameThumbnail(page, 1, PIXEL_IN_THIRD_COLUMN);
  });

  test('thumbnails should show the current layer', { tag: ['@frames.tiles'] }, async ({ page }) => {
    // Start from a sprite with a pixel in the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(PIXEL_IN_FIRST_COLUMN);
    await assertFrameThumbnail(page, 0, PIXEL_IN_FIRST_COLUMN);

    // Add a layer: it is empty, and so is the thumbnail.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await assertFrameThumbnail(page, 0, EMPTY);

    // Draw in the new layer.
    await drawAtPixel(page, 1, 0);
    expect(await readPixelRows(page, 4, 4, 1, 0)).toEqual(PIXEL_IN_SECOND_COLUMN);
    await assertFrameThumbnail(page, 0, PIXEL_IN_SECOND_COLUMN);

    // Go back to the bottom layer: the thumbnail follows.
    await selectBottomLayer(page);
    await assertFrameThumbnail(page, 0, PIXEL_IN_FIRST_COLUMN);
  });

  // ─── Overflow ─────────────────────────────────────────────────

  test('a long frames list should scroll, with hints at the top and bottom', { tag: ['@frames.overflow'] }, async ({ page }) => {
    await openEditor(page);
    const topHint = testId(page, 'frame-list-top-hint');
    const bottomHint = testId(page, 'frame-list-bottom-hint');

    // With a single frame there is nothing to scroll, so no hint is visible.
    await expect(topHint).not.toBeInViewport();
    await expect(bottomHint).not.toBeInViewport();

    // Add frames until they don't fit: only the bottom hint is visible.
    for (let count = 2; count <= 15; count++) {
      await page.keyboard.press('n');
      await assertFrameCount(page, count);
    }
    await expect(getFrameTiles(page).first()).toBeInViewport();
    await expect(getFrameTiles(page).last()).not.toBeInViewport();
    await expect(topHint).not.toBeInViewport();
    await expect(bottomHint).toBeInViewport();

    // Scroll a little: there is more content both ways, so both hints are visible.
    await getFrameTiles(page).first().hover();
    await page.mouse.wheel(0, 200);
    await expect(topHint).toBeInViewport();
    await expect(bottomHint).toBeInViewport();

    // Scroll to the end: only the top hint is visible.
    await page.mouse.wheel(0, 100000);
    await expect(getFrameTiles(page).last()).toBeInViewport();
    await expect(getFrameTiles(page).first()).not.toBeInViewport();
    await expect(topHint).toBeInViewport();
    await expect(bottomHint).not.toBeInViewport();
  });
});
