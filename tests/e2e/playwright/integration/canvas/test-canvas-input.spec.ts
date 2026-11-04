import test, { expect } from "@playwright/test";
import {
  clickTool,
  colorToInt,
  dragFingerBetweenPixels,
  emptyGrid,
  getGrayAreaPosition,
  getPixelColor,
  getPixelScreenPosition,
  getToolPosition,
  hoverPixel,
  openEditor,
  readPixelRows,
  rightClickAndCheckBrowserMenu,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  tapPixel,
  undo,
} from "../../testutils";

test.describe('Browser context menu', () => {

  test('should be suppressed on the canvas only', { tag: ['@canvas.no-context-menu'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyGrid(4, 4));

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
    await setPiskelFromGrid(page, emptyGrid(4, 4));
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');

    // Tap a pixel, with the mouse away from the tool's tooltip.
    await hoverPixel(page, 3, 3);
    await tapPixel(page, 1, 1);

    // Only this pixel is drawn, like with the left button. How many undo steps a tap
    // takes isn't tested: see "Canvas (drawing area)" in docs/known-issues.md.
    await expect.poll(() => readPixelRows(page, 4, 4)).toEqual([
      '....',
      '.X..',
      '....',
      '....',
    ]);
    expect(await getPixelColor(page, 1, 1)).toBe(colorToInt('#FF0000'));
  });

  test('dragging a finger should draw a line in one undo step', { tag: ['@canvas.touch'] }, async ({ page }) => {
    // Start from an empty sprite, with the pen.
    await openEditor(page);
    await setPiskelFromGrid(page, emptyGrid(4, 4));
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');

    // Drag a finger along a row.
    await hoverPixel(page, 3, 3);
    await dragFingerBetweenPixels(page, { col: 0, row: 2 }, { col: 3, row: 2 });
    await expect.poll(() => readPixelRows(page, 4, 4)).toEqual([
      '....',
      '....',
      'XXXX',
      '....',
    ]);
    expect(await getPixelColor(page, 0, 2)).toBe(colorToInt('#FF0000'));

    // One undo removes the whole line.
    await undo(page);
    await expect.poll(() => readPixelRows(page, 4, 4)).toEqual([
      '....',
      '....',
      '....',
      '....',
    ]);
  });
});
