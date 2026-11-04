import test, { expect } from "@playwright/test";
import {
  assertZoom,
  emptyGrid,
  enableVisibleGrid,
  openEditor,
  openEditorWithSettledCanvas,
  pressRepeatedly,
  readDrawingAreaColor,
  readGridLines,
  setGridLineWidth,
  setGridSpacing,
  setPiskelFromGrid,
} from "../../testutils";

const NEUTRAL_GRAY = [160, 160, 160, 255];
const TRANSPARENT = [0, 0, 0, 0];

test.describe('Background around the sprite', () => {

  test('should be neutral gray around a sprite smaller than the area', { tag: ['@canvas.zoomed-out-background'] }, async ({ page }) => {
    // At the maximum zoom, a 4x4 sprite still leaves space on every side.
    await openEditor(page);
    await setPiskelFromGrid(page, emptyGrid(4, 4));

    // The space around the sprite is gray on every side.
    await expect.poll(() => readDrawingAreaColor(page, 0.05, 0.5)).toEqual(NEUTRAL_GRAY);
    await expect.poll(() => readDrawingAreaColor(page, 0.95, 0.5)).toEqual(NEUTRAL_GRAY);
    await expect.poll(() => readDrawingAreaColor(page, 0.5, 0.05)).toEqual(NEUTRAL_GRAY);
    await expect.poll(() => readDrawingAreaColor(page, 0.5, 0.95)).toEqual(NEUTRAL_GRAY);

    // The sprite itself stays transparent, to show the checkerboard.
    await expect.poll(() => readDrawingAreaColor(page, 0.5, 0.5)).toEqual(TRANSPARENT);
  });

  test('should be neutral gray above and below a wide sprite', { tag: ['@canvas.zoomed-out-background'] }, async ({ page }) => {
    // A wide sprite fills the width of the area, and only leaves space above and below.
    await openEditor(page);
    await setPiskelFromGrid(page, emptyGrid(400, 40));

    // That space is gray, and the sprite stays transparent.
    await expect.poll(() => readDrawingAreaColor(page, 0.5, 0.05)).toEqual(NEUTRAL_GRAY);
    await expect.poll(() => readDrawingAreaColor(page, 0.5, 0.95)).toEqual(NEUTRAL_GRAY);
    await expect.poll(() => readDrawingAreaColor(page, 0.5, 0.5)).toEqual(TRANSPARENT);
  });

  test('should not show once the sprite fills the area', { tag: ['@canvas.zoomed-out-background'] }, async ({ page }) => {
    // Start from a sprite that leaves space on its sides.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(64, 64));
    await expect.poll(() => readDrawingAreaColor(page, 0.05, 0.5)).toEqual(NEUTRAL_GRAY);

    // Zoom in until the sprite fills the whole area.
    await pressRepeatedly(page, '+', 15);

    // Its sides only show the transparent sprite.
    await expect.poll(() => readDrawingAreaColor(page, 0.05, 0.5)).toEqual(TRANSPARENT);
    await expect.poll(() => readDrawingAreaColor(page, 0.95, 0.5)).toEqual(TRANSPARENT);
  });
});

test.describe('Grid and zoom', () => {

  test('should hide the grid when its lines would be under 6 screen pixels apart', { tag: ['@canvas.grid-zoom'] }, async ({ page }) => {
    await openEditor(page);
    await enableVisibleGrid(page);

    // At just over 6 screen pixels per sprite pixel, each line is displayed.
    await setPiskelFromGrid(page, emptyGrid(111, 111));
    await assertZoom(page, 6.04);
    await expect.poll(() => readGridLines(page, 111)).toEqual({ count: 110, widths: [1] });

    // At just under 6, none are.
    await setPiskelFromGrid(page, emptyGrid(112, 112));
    await assertZoom(page, 5.98);
    await expect.poll(() => readGridLines(page, 112)).toEqual({ count: 0, widths: [] });
  });

  test('should count the spacing of the lines, not the zoom alone', { tag: ['@canvas.grid-zoom'] }, async ({ page }) => {
    // Start from a zoom where a line on every pixel would be too close.
    await openEditor(page);
    await enableVisibleGrid(page);
    await setPiskelFromGrid(page, emptyGrid(250, 250));
    await assertZoom(page, 2.68);
    await expect.poll(() => readGridLines(page, 250)).toEqual({ count: 0, widths: [] });

    // Every 2 pixels is 5.36 screen pixels apart, still too close.
    await setGridSpacing(page, 2);
    await expect.poll(() => readGridLines(page, 250)).toEqual({ count: 0, widths: [] });

    // Every 4 pixels is 10.72 screen pixels apart: the lines show, at 4, 8... 248.
    await setGridSpacing(page, 4);
    await expect.poll(() => readGridLines(page, 250)).toEqual({ count: 62, widths: [1] });
  });

  for (const { size, zoom, width } of [
    { size: 27, zoom: 24.81, width: 4 },
    { size: 28, zoom: 23.93, width: 3 },
    { size: 37, zoom: 18.11, width: 3 },
    { size: 38, zoom: 17.63, width: 2 },
    { size: 55, zoom: 12.18, width: 2 },
    { size: 56, zoom: 11.96, width: 1 },
  ]) {
    test(`lines set to width 4 should be ${width} wide at zoom ${zoom}`, { tag: ['@canvas.grid-zoom'] }, async ({ page }) => {
      // Ask for the thickest lines.
      await openEditor(page);
      await enableVisibleGrid(page);
      await setGridLineWidth(page, 4);

      // A line is at most 1/6 of a sprite pixel wide.
      await setPiskelFromGrid(page, emptyGrid(size, size));
      await assertZoom(page, zoom);
      await expect.poll(() => readGridLines(page, size)).toEqual({ count: size - 1, widths: [width] });
    });
  }
});
