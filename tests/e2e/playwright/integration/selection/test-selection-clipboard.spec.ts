import test, { expect, Page } from "@playwright/test";
import {
  assertColorRows,
  assertCurrentFrame,
  assertWizardStep,
  clickTool,
  copySelection,
  createPngFile,
  cutSelection,
  dragBetweenPixels,
  drawAtPixel,
  getAddFrameButton,
  openEditor,
  openEditorInNewPage,
  openEditorWithRectangleSelect,
  pasteClipboardImage,
  pasteClipboardText,
  pasteEmptyClipboard,
  readPixelRows,
  redo,
  selectFrame,
  setPiskelFromGrid,
  setSpriteWithRectangleSelect,
  undo,
  wait,
  waitForGrid,
} from "../../testutils";

const BLOCK = ['XX..', 'XX..', '....', '....'];
const EMPTY = ['....', '....', '....', '....'];

/** Draw a pixel with the pen, then come back to the selection tool */
const drawPixelWithPen = async (page: Page, col: number, row: number, rows: string[]) => {
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, col, row);
  await waitForGrid(page, 4, 4, rows);
  await clickTool(page, 'tool-rectangle-select');
};

const undoAndAssertGrid = async (page: Page, rows: string[]) => {
  await wait(100);
  await undo(page);
  await waitForGrid(page, 4, 4, rows);
};

const redoAndAssertGrid = async (page: Page, rows: string[]) => {
  await wait(100);
  await redo(page);
  await waitForGrid(page, 4, 4, rows);
};

test.describe('Pasting', () => {
  test('should paste at the moved position, without erasing under transparent pixels', { tag: ['@selection.paste'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [
      ['R', 'T', 'G', 'G'],
      ['T', 'R', 'G', 'G'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await waitForGrid(page, 4, 4, ['X.XX', '.XXX', '....', '....']);
    await clickTool(page, 'tool-rectangle-select');

    // Copy two diagonal pixels, and move the selection over the green block.
    await dragBetweenPixels(page, 0, 0, 1, 1);
    const copied = await copySelection(page);
    await dragBetweenPixels(page, 0, 0, 2, 0);

    await pasteClipboardText(page, copied);

    // The red pixels land there, and the green ones between them stay. The copied
    // pixels are still at their original position.
    await assertColorRows(page, [
      'R.RG',
      '.RGR',
      '....',
      '....',
    ]);
  });

  test('should keep the selection active after pasting', { tag: ['@selection.paste-keeps-selection'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await dragBetweenPixels(page, 0, 0, 1, 1);
    const copied = await copySelection(page);

    // Paste at a new position.
    await dragBetweenPixels(page, 0, 0, 2, 2);
    await pasteClipboardText(page, copied);
    await waitForGrid(page, 4, 4, ['XX..', 'XX..', '..XX', '..XX']);

    // Deleting clears what was just pasted.
    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, BLOCK);
  });

  test('should paste on another frame after the selection is committed', { tag: ['@selection.paste-after-dismiss'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await getAddFrameButton(page).click();
    await selectFrame(page, 0);

    // Copy, end the selection and go to the second frame.
    await dragBetweenPixels(page, 0, 0, 1, 1);
    const copied = await copySelection(page);
    await page.keyboard.press('Enter');
    await selectFrame(page, 1);

    await pasteClipboardText(page, copied);

    await waitForGrid(page, 4, 4, BLOCK, { frameIndex: 1 });
  });

  test('should paste after switching to another tool', { tag: ['@selection.paste-after-dismiss'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, BLOCK);

    // Copy, delete, and leave the selection tools.
    await dragBetweenPixels(page, 0, 0, 1, 1);
    const copied = await copySelection(page);
    await page.keyboard.press('Delete');
    await clickTool(page, 'tool-pen');
    await waitForGrid(page, 4, 4, EMPTY);

    await pasteClipboardText(page, copied);

    await waitForGrid(page, 4, 4, BLOCK);
  });

  test('should do nothing with nothing copied', { tag: ['@selection.paste-empty'] }, async ({ page }) => {
    const rows = ['X...', '.X..', '....', '....'];
    await openEditorWithRectangleSelect(page, ['X...', '....', '....', '....']);
    await drawPixelWithPen(page, 1, 1, rows);

    // Paste without a selection, then with one that wasn't copied.
    await pasteEmptyClipboard(page);
    await dragBetweenPixels(page, 0, 0, 1, 1);
    await pasteEmptyClipboard(page);
    await wait(100);
    expect(await readPixelRows(page, 4, 4)).toEqual(rows);

    // No undo step was added: undo removes the drawing.
    await undoAndAssertGrid(page, ['X...', '....', '....', '....']);
  });

  for (const text of ['hello', '42', 'null', '{"a":1}']) {
    test(`should ignore the text ${text}, even with copied pixels`, { tag: ['@selection.paste-text'] }, async ({ page }) => {
      await openEditorWithRectangleSelect(page, BLOCK);

      // Copy and delete a selection, which stays active.
      await dragBetweenPixels(page, 0, 0, 1, 1);
      await copySelection(page);
      await page.keyboard.press('Delete');
      await waitForGrid(page, 4, 4, EMPTY);

      await pasteClipboardText(page, text);

      // The sprite doesn't change, and no undo step was added.
      await wait(100);
      expect(await readPixelRows(page, 4, 4)).toEqual(EMPTY);
      await undoAndAssertGrid(page, BLOCK);
    });
  }
});

test.describe('Pasting from another tab', () => {
  const PIXEL_OF_COPYING_TAB = ['X...', '....', '....', '....'];
  const PIXEL_OF_PASTING_TAB = ['....', '....', '....', '...X'];

  /** Open a second tab to paste in, each tab with its own selected pixel */
  const openTabsWithSelections = async (copyingTab: Page) => {
    await openEditorWithRectangleSelect(copyingTab, PIXEL_OF_COPYING_TAB);
    await dragBetweenPixels(copyingTab, 0, 0, 0, 0);

    const pastingTab = await openEditorInNewPage(copyingTab);
    await setSpriteWithRectangleSelect(pastingTab, PIXEL_OF_PASTING_TAB);
    await dragBetweenPixels(pastingTab, 3, 3, 3, 3);
    return pastingTab;
  };

  test('should paste pixels copied in another tab, with their colors', { tag: ['@selection.paste-other-tab'] }, async ({ page: copyingTab }) => {
    // Copy a green block, as red is the color the app would be likely to fall back on.
    await openEditor(copyingTab);
    await setPiskelFromGrid(copyingTab, [
      ['G', 'G', 'T', 'T'],
      ['G', 'G', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await waitForGrid(copyingTab, 4, 4, BLOCK);
    await clickTool(copyingTab, 'tool-rectangle-select');
    await dragBetweenPixels(copyingTab, 0, 0, 1, 1);
    const copied = await copySelection(copyingTab);

    // A new tab, with no selection.
    const pastingTab = await openEditorInNewPage(copyingTab);
    await setSpriteWithRectangleSelect(pastingTab, EMPTY);

    await pasteClipboardText(pastingTab, copied);

    await assertColorRows(pastingTab, [
      'GG..',
      'GG..',
      '....',
      '....',
    ]);
  });

  test('should use pixels copied in another tab after the local copy', { tag: ['@selection.paste-other-tab'] }, async ({ page: copyingTab }) => {
    const pastingTab = await openTabsWithSelections(copyingTab);

    // Copy in the pasting tab and delete the pixel there.
    await copySelection(pastingTab);
    await pastingTab.keyboard.press('Delete');
    await waitForGrid(pastingTab, 4, 4, EMPTY);

    // Copy later in the other tab: the app compares the times of the two copies.
    await wait(10);
    const copiedLater = await copySelection(copyingTab);

    await pasteClipboardText(pastingTab, copiedLater);

    await waitForGrid(pastingTab, 4, 4, PIXEL_OF_COPYING_TAB);
  });

  test('should use the local copy when it is newer than the one from another tab', { tag: ['@selection.paste-other-tab'] }, async ({ page: copyingTab }) => {
    const pastingTab = await openTabsWithSelections(copyingTab);

    // Copy in the other tab.
    const copiedEarlier = await copySelection(copyingTab);

    // Copy later in the pasting tab, and delete the pixel there: the app compares the
    // times of the two copies.
    await wait(10);
    await copySelection(pastingTab);
    await pastingTab.keyboard.press('Delete');
    await waitForGrid(pastingTab, 4, 4, EMPTY);

    await pasteClipboardText(pastingTab, copiedEarlier);

    await waitForGrid(pastingTab, 4, 4, PIXEL_OF_PASTING_TAB);
  });
});

test.describe('Pasting an image', () => {
  // When zoomed in and panned, the image lands elsewhere, so that isn't tested here:
  // see docs/known-issues.md.
  test('should add the image at the top left corner, as one undo step', { tag: ['@selection.paste-image'] }, async ({ page }) => {
    const drawn = ['....', '....', '....', '...X'];
    await openEditorWithRectangleSelect(page, EMPTY);
    await drawPixelWithPen(page, 3, 3, drawn);

    await pasteClipboardImage(page, await createPngFile(page, 'image.png', ['XX', 'XX']));
    await waitForGrid(page, 4, 4, ['XX..', 'XX..', '....', '...X']);

    // Undo removes the image, and keeps the drawing.
    await undoAndAssertGrid(page, drawn);
  });

  test('should not erase under the transparent pixels of the image', { tag: ['@selection.paste-image'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, Array.from({ length: 4 }, () => ['G', 'G', 'G', 'G']));
    await waitForGrid(page, 4, 4, ['XXXX', 'XXXX', 'XXXX', 'XXXX']);

    await pasteClipboardImage(page, await createPngFile(page, 'image.png', ['X.', '.X']));

    await assertColorRows(page, [
      'RGGG',
      'GRGG',
      'GGGG',
      'GGGG',
    ]);
  });

  test('should add the image to the current frame', { tag: ['@selection.paste-image'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, EMPTY);
    await getAddFrameButton(page).click();
    await assertCurrentFrame(page, 1);

    await pasteClipboardImage(page, await createPngFile(page, 'image.png', ['XX', 'XX']));

    await waitForGrid(page, 4, 4, BLOCK, { frameIndex: 1 });
    expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(EMPTY);
  });

  test('should open the import wizard for an image larger than the sprite', { tag: ['@selection.paste-image'] }, async ({ page }) => {
    await openEditorWithRectangleSelect(page, EMPTY);

    await pasteClipboardImage(page, await createPngFile(page, 'image.png', ['XXXXX', 'XXXXX']));

    await assertWizardStep(page, 'image import');
    expect(await readPixelRows(page, 4, 4)).toEqual(EMPTY);
  });
});

test.describe('Undoing selection actions', () => {
  const DRAWN = ['XX..', 'XX..', '....', '...X'];
  const WITHOUT_BLOCK = ['....', '....', '....', '...X'];

  /** A block with a drawing elsewhere, as the last undo step, and the block selected */
  const openEditorWithSelectedBlock = async (page: Page) => {
    await openEditorWithRectangleSelect(page, BLOCK);
    await drawPixelWithPen(page, 3, 3, DRAWN);
    await dragBetweenPixels(page, 0, 0, 1, 1);
  };

  test('should not add an undo step when copying', { tag: ['@selection.undo'] }, async ({ page }) => {
    await openEditorWithSelectedBlock(page);

    await copySelection(page);
    expect(await readPixelRows(page, 4, 4)).toEqual(DRAWN);

    // Undo removes the drawing.
    await undoAndAssertGrid(page, BLOCK);
  });

  test('should make cutting a single undo step', { tag: ['@selection.undo'] }, async ({ page }) => {
    await openEditorWithSelectedBlock(page);

    await cutSelection(page);
    await waitForGrid(page, 4, 4, WITHOUT_BLOCK);

    await undoAndAssertGrid(page, DRAWN);
    await redoAndAssertGrid(page, WITHOUT_BLOCK);
  });

  test('should make pasting a single undo step', { tag: ['@selection.undo'] }, async ({ page }) => {
    await openEditorWithSelectedBlock(page);
    const cut = await cutSelection(page);
    await waitForGrid(page, 4, 4, WITHOUT_BLOCK);

    await pasteClipboardText(page, cut);
    await waitForGrid(page, 4, 4, DRAWN);

    await undoAndAssertGrid(page, WITHOUT_BLOCK);
    await redoAndAssertGrid(page, DRAWN);
  });

  test('should make deleting a single undo step', { tag: ['@selection.undo'] }, async ({ page }) => {
    await openEditorWithSelectedBlock(page);

    await page.keyboard.press('Delete');
    await waitForGrid(page, 4, 4, WITHOUT_BLOCK);

    await undoAndAssertGrid(page, DRAWN);
    await redoAndAssertGrid(page, WITHOUT_BLOCK);
  });
});
