import test, { Page } from "@playwright/test";
import {
  assertColorRows,
  clickTool,
  dragBetweenPixels,
  dragWithRightButton,
  gridFromRows,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  waitForGrid,
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

/** Open the editor with the dithering tool, red as primary and blue as secondary */
const openEditorWithDithering = async (page: Page) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await waitForGrid(page, 10, 10, EMPTY);
  await clickTool(page, 'tool-dithering');
  await setPrimaryColor(page, '#FF0000');
  await setSecondaryColor(page, '#0000FF');
};

test.describe('Dithering tool', () => {
  test('should draw a checkerboard of the primary and secondary colors', { tag: ['@drawing-tools.dithering'] }, async ({ page }) => {
    await openEditorWithDithering(page);

    // Draw over the first row.
    await dragBetweenPixels(page, 0, 0, 9, 0);
    await assertColorRows(page, [
      'BRBRBRBRBR',
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

    // Draw over the second row: the colors alternate from one row to the next.
    await dragBetweenPixels(page, 0, 1, 9, 1);
    await assertColorRows(page, [
      'BRBRBRBRBR',
      'RBRBRBRBRB',
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

  test('should swap the colors with the right button', { tag: ['@drawing-tools.dithering-right-button'] }, async ({ page }) => {
    await openEditorWithDithering(page);

    // Draw over the same first row as with the left button: the colors are swapped.
    await dragWithRightButton(page, 0, 0, 9, 0);
    await assertColorRows(page, [
      'RBRBRBRBRB',
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

    // Same for the second row.
    await dragWithRightButton(page, 0, 1, 9, 1);
    await assertColorRows(page, [
      'RBRBRBRBRB',
      'BRBRBRBRBR',
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
});
