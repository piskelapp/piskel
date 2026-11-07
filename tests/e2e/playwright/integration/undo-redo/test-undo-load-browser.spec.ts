import test from "@playwright/test";
import {
  clickTool,
  drawAtPixel,
  gridFromRows,
  loadLocalSave,
  openBrowseLocalSaves,
  openEditor,
  saveInBrowser,
  setPiskelFromGrid,
  undo,
  waitForGrid,
} from "../../testutils";

/** 10x10 frames */
const SAVED_SPRITE = [
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
const SAVED_SPRITE_WITH_DRAWING = [
  'X.........',
  '.X........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('Undoing the opening of a sprite', () => {
  test('should undo opening a sprite saved in the browser', { tag: ['@undo-redo.load-step-browser'] }, async ({ page }) => {
    await openEditor(page);

    // Save a sprite, then draw on it.
    await setPiskelFromGrid(page, gridFromRows(SAVED_SPRITE));
    await waitForGrid(page, 10, 10, SAVED_SPRITE);
    await saveInBrowser(page, 'my sprite');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await waitForGrid(page, 10, 10, SAVED_SPRITE_WITH_DRAWING);

    // Open the saved sprite: the drawing goes away.
    await openBrowseLocalSaves(page);
    await loadLocalSave(page, 'my sprite');
    await waitForGrid(page, 10, 10, SAVED_SPRITE);

    // One undo brings the drawing back.
    await undo(page);
    await waitForGrid(page, 10, 10, SAVED_SPRITE_WITH_DRAWING);
  });
});
