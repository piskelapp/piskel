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
  wait,
  waitForGrid,
} from "../../testutils";

test.describe('Undoing the opening of a sprite', () => {
  test('should undo opening a sprite saved in the browser', { tag: ['@undo-redo.load-step-browser'] }, async ({ page }) => {
    await openEditor(page);

    // Save a sprite, then draw on it.
    await setPiskelFromGrid(page, gridFromRows(['X.', '..']));
    await waitForGrid(page, 2, 2, ['X.', '..']);
    await saveInBrowser(page, 'my sprite');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await waitForGrid(page, 2, 2, ['X.', '.X']);

    // Open the saved sprite: the drawing goes away.
    await openBrowseLocalSaves(page);
    await loadLocalSave(page, 'my sprite');
    await waitForGrid(page, 2, 2, ['X.', '..']);

    // One undo brings the drawing back.
    await wait(100);
    await undo(page);
    await waitForGrid(page, 2, 2, ['X.', '.X']);
  });
});
