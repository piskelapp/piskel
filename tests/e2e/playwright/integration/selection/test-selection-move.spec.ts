import test, { expect, Page } from "@playwright/test";
import {
  assertCanvasCursor,
  assertCurrentLayer,
  assertLayerFrames,
  clickTool,
  copySelection,
  dragBetweenPixels,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  gridFromRows,
  hoverPixel,
  moveSelectionContent,
  openEditor,
  openEditorWithRectangleSelect,
  pasteClipboardText,
  readPixelRows,
  selectFrame,
  setPiskelFromGrid,
  undo,
  wait,
  waitForGrid,
} from "../../testutils";

const FULL = ['XXXX', 'XXXX', 'XXXX', 'XXXX'];
const BLOCK = ['XX..', 'XX..', '....', '....'];
const EMPTY = ['....', '....', '....', '....'];

/** Press delete, and check that it left the sprite as it is: nothing is selected */
const assertNothingSelected = async (page: Page, rows: string[]) => {
  await page.keyboard.press('Delete');
  await wait(100);
  expect(await readPixelRows(page, 4, 4)).toEqual(rows);
};

test.describe('Moving a selection', () => {
  test('should move only the outline when dragging inside the selection', { tag: ['@selection.move-outline'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, FULL);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Drag the selection: the sprite doesn't change.
    await dragBetweenPixels(page, 0, 0, 2, 2);
    expect(await readPixelRows(page, 4, 4)).toEqual(FULL);

    // Deleting clears the new position.
    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, ['XXXX', 'XXXX', 'XX..', 'XX..']);
  });

  test('should keep moving the content on later drags, without shift', { tag: ['@selection.move-content-continue'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Move the content with shift, then drag again without it.
    await moveSelectionContent(page, 0, 0, 1, 0);
    await waitForGrid(page, 4, 4, EMPTY);
    await dragBetweenPixels(page, 1, 0, 1, 1);

    // The original position is clear, and the content follows both drags.
    await page.keyboard.press('Enter');
    await waitForGrid(page, 4, 4, ['....', '.XX.', '.XX.', '....']);
  });

  test('should show the move cursor when hovering the selection', { tag: ['@selection.move-cursor'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, FULL);

    // Without a selection, the cursor is the selection tool's.
    await hoverPixel(page, 0, 0);
    await assertCanvasCursor(page, 'crosshair');

    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Only hovering the selection shows the move cursor.
    await hoverPixel(page, 0, 0);
    await assertCanvasCursor(page, /hand\.png/);
    await hoverPixel(page, 3, 3);
    await assertCanvasCursor(page, 'crosshair');
  });

  test('should clip the content moved outside the canvas on commit', { tag: ['@selection.clip'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Move the block so that only its top left corner stays in the sprite.
    await moveSelectionContent(page, 0, 0, 3, 3);
    await waitForGrid(page, 4, 4, EMPTY);
    await page.keyboard.press('Enter');

    // The sprite keeps its size.
    await assertLayerFrames(page, 0, [['....', '....', '....', '...X']]);
  });

  test('should not wrap the content moved past the right edge onto the next row', { tag: ['@selection.clip'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Move the block so that only its left column stays in the sprite.
    await moveSelectionContent(page, 0, 0, 3, 0);
    await waitForGrid(page, 4, 4, EMPTY);
    await page.keyboard.press('Enter');

    await assertLayerFrames(page, 0, [['...X', '...X', '....', '....']]);
  });

  test('should keep the whole content when moved back before the commit', { tag: ['@selection.clip'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Move the block partly outside, then back inside.
    await moveSelectionContent(page, 0, 0, 3, 3);
    await waitForGrid(page, 4, 4, EMPTY);
    await dragBetweenPixels(page, 3, 3, 1, 1);
    await page.keyboard.press('Enter');

    await waitForGrid(page, 4, 4, ['....', '.XX.', '.XX.', '....']);
  });

  // Undoing before the commit turns the move into a copy, so that isn't tested here:
  // see docs/known-issues.md.
  test('should take two undo steps to revert moved content', { tag: ['@selection.move-content-undo'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    // Move the content and commit.
    await moveSelectionContent(page, 0, 0, 2, 2);
    await waitForGrid(page, 4, 4, EMPTY);
    await page.keyboard.press('Enter');
    await waitForGrid(page, 4, 4, ['....', '....', '..XX', '..XX']);

    // The first undo reverts the commit, which leaves the content lifted.
    await wait(100);
    await undo(page);
    await waitForGrid(page, 4, 4, EMPTY);

    // The second undo reverts lifting it.
    await wait(100);
    await undo(page);
    await waitForGrid(page, 4, 4, BLOCK);
  });
});

test.describe('Selection across frames and layers', () => {
  test('should delete on the frame selected after creating the selection', { tag: ['@selection.across-frames'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, FULL);

    // Draw a pixel on a second frame.
    await getAddFrameButton(page).click();
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitForGrid(page, 4, 4, ['X...', '....', '....', '....'], { frameIndex: 1 });

    // Select on the first frame, then go back to the second.
    await clickTool(page, 'tool-rectangle-select');
    await selectFrame(page, 0);
    await dragBetweenPixels(page, 0, 0, 1, 1);
    await selectFrame(page, 1);

    // Only the second frame changes.
    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, EMPTY, { frameIndex: 1 });
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(FULL);
  });

  test('should move content onto another frame', { tag: ['@selection.across-frames'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await getAddFrameButton(page).click();
    await selectFrame(page, 0);

    // Move the content on the first frame.
    await dragBetweenPixels(page, 0, 0, 1, 1);
    await moveSelectionContent(page, 0, 0, 2, 2);
    await waitForGrid(page, 4, 4, EMPTY);

    // Commit it on the second frame.
    await selectFrame(page, 1);
    await page.keyboard.press('Enter');

    await assertLayerFrames(page, 0, [EMPTY, ['....', '....', '..XX', '..XX']]);
  });

  test('should move content onto another layer', { tag: ['@selection.across-frames'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);

    // Move the content on the first layer.
    await dragBetweenPixels(page, 0, 0, 1, 1);
    await moveSelectionContent(page, 0, 0, 2, 2);
    await waitForGrid(page, 4, 4, EMPTY);

    // Commit it on a new layer.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await page.keyboard.press('Enter');

    const moved = ['....', '....', '..XX', '..XX'];
    await waitForGrid(page, 4, 4, moved, { layerIndex: 1 });
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(EMPTY);
  });

  test('should paste onto another layer', { tag: ['@selection.across-frames'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);

    // Select and copy on the first layer.
    await dragBetweenPixels(page, 0, 0, 1, 1);
    const copied = await copySelection(page);

    // Move the selection, and paste on a new layer.
    await dragBetweenPixels(page, 0, 0, 2, 2);
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await pasteClipboardText(page, copied);

    // The pixels land at the moved position, and only on the new layer.
    await waitForGrid(page, 4, 4, ['....', '....', '..XX', '..XX'], { layerIndex: 1 });
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(BLOCK);
  });
});

test.describe('Ending a selection', () => {
  // Switching tools while content is moving loses the content, so that isn't tested
  // here or in the next test: see docs/known-issues.md.
  test('should dismiss the selection when switching to a non-selection tool', { tag: ['@selection.dismiss-on-tool-change'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, FULL);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    await clickTool(page, 'tool-pen');
    await assertNothingSelected(page, FULL);

    // It's still gone when coming back to the selection tool.
    await clickTool(page, 'tool-rectangle-select');
    await assertNothingSelected(page, FULL);
  });

  for (const name of ['lasso', 'shape']) {
    test(`should keep the selection when switching to the ${name} selection tool`, { tag: ['@selection.switch-selection-tool'] }, async ({ page }) => {
      await openEditorWithRectangleSelect(page, FULL);
      await dragBetweenPixels(page, 0, 0, 1, 1);

      await clickTool(page, `tool-${name}-select`);

      await page.keyboard.press('Delete');
      await waitForGrid(page, 4, 4, ['..XX', '..XX', 'XXXX', 'XXXX']);
    });
  }

  test('should dismiss the selection when clicking outside it', { tag: ['@selection.click-outside'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, FULL);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    await drawAtPixel(page, 3, 3);

    // Neither the old selection nor a new one at the clicked pixel exists.
    await assertNothingSelected(page, FULL);
  });

  test('should apply moved content when clicking outside the selection', { tag: ['@selection.click-outside'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);
    await moveSelectionContent(page, 0, 0, 1, 1);
    await waitForGrid(page, 4, 4, EMPTY);

    await drawAtPixel(page, 3, 0);

    const moved = ['....', '.XX.', '.XX.', '....'];
    await waitForGrid(page, 4, 4, moved);
    await assertNothingSelected(page, moved);
  });

  test('should need a second click for a new shape selection', { tag: ['@selection.click-outside'] }, async ({ page }) => {
    const rows = ['XX..', 'XX..', '....', '..XX'];
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(rows));
    await waitForGrid(page, 4, 4, rows);
    await clickTool(page, 'tool-shape-select');
    await drawAtPixel(page, 0, 0);

    // The first click outside only ends the selection.
    await drawAtPixel(page, 3, 3);
    await assertNothingSelected(page, rows);

    // The next one selects the shape.
    await drawAtPixel(page, 3, 3);
    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, BLOCK);
  });

  test('should start a new selection when dragging outside the selection', { tag: ['@selection.drag-outside'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, FULL);
    await dragBetweenPixels(page, 0, 0, 1, 1);

    await dragBetweenPixels(page, 2, 2, 3, 3);

    // Only the new selection is deleted.
    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, ['XXXX', 'XXXX', 'XX..', 'XX..']);
  });

  test('should apply moved content when dragging outside the selection', { tag: ['@selection.drag-outside'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);
    await moveSelectionContent(page, 0, 0, 1, 1);
    await waitForGrid(page, 4, 4, EMPTY);

    // Drag over part of the moved content, from outside it.
    await dragBetweenPixels(page, 0, 2, 1, 3);
    await waitForGrid(page, 4, 4, ['....', '.XX.', '.XX.', '....']);

    // The new selection holds that part only.
    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, ['....', '.XX.', '..X.', '....']);
  });
});
