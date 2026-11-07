import test, { expect } from "@playwright/test";
import {
  clickTool,
  dragFingerBetweenPixels,
  assertColorRows,
  gridFromRows,
  getGrayAreaPosition,
  getPixelScreenPosition,
  getToolPosition,
  hoverPixel,
  openEditor,
  rightClickAndCheckBrowserMenu,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  tapPixel,
  undo,
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

test.describe('Browser context menu', () => {

  test('should be suppressed on the canvas only', { tag: ['@canvas.no-context-menu'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Right-click on the sprite: no browser menu.
    const pixel = await getPixelScreenPosition(page, 1, 1);
    expect(await rightClickAndCheckBrowserMenu(page, pixel)).toBe(false);

    // Right-click on the gray space around the sprite: no browser menu either.
    expect(await rightClickAndCheckBrowserMenu(page, await getGrayAreaPosition(page))).toBe(false);

    // Right-click outside the canvas, on a tool: the browser menu stays.
    expect(await rightClickAndCheckBrowserMenu(page, await getToolPosition(page, 'tool-pen'))).toBe(true);
  });
});

test.describe('Touch input', () => {
  test.use({ hasTouch: true });

  test('a tap should draw with the primary color', { tag: ['@canvas.touch'] }, async ({ page }) => {
    // Start from an empty sprite, with the pen and two different colors.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');

    // Tap a pixel, with the mouse away from the tool's tooltip.
    await hoverPixel(page, 8, 8);
    await tapPixel(page, 1, 1);

    // Only this pixel is drawn, like with the left button. How many undo steps a tap
    // takes isn't tested: see "Canvas (drawing area)" in docs/known-issues.md.
    await assertColorRows(page, [
      '..........',
      '.R........',
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

  test('dragging a finger should draw a line in one undo step', { tag: ['@canvas.touch'] }, async ({ page }) => {
    // Start from an empty sprite, with the pen.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');

    // Drag a finger along a row.
    await hoverPixel(page, 8, 8);
    await dragFingerBetweenPixels(page, { col: 0, row: 2 }, { col: 3, row: 2 });
    await assertColorRows(page, [
      '..........',
      '..........',
      'RRRR......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // One undo removes the whole line.
    await undo(page);
    await assertColorRows(page, EMPTY);
  });
});
