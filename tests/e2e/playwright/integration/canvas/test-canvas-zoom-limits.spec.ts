import test, { expect, Page } from "@playwright/test";
import {
  assertVisibleRows,
  assertZoom,
  countSpritePixelsAcross,
  emptyGrid,
  getDrawingAreaSize,
  openEditorWithSettledCanvas,
  pressRepeatedly,
  readPixelAtDrawingAreaPosition,
  setPiskelFromGrid,
} from "../../testutils";

const TOP_LEFT = [0, 0] as const;
const BOTTOM_RIGHT = [1, 1] as const;
const CENTER = [0.5, 0.5] as const;

/** Check which pixel of the sprite is at a position of the drawing area */
const assertPixelAt = async (
  page: Page,
  [x, y]: readonly [number, number],
  pixel: string
) => {
  await expect.poll(() => readPixelAtDrawingAreaPosition(page, x, y)).toBe(pixel);
};

test.describe('Zoom limits', () => {

  test('zooming in should stop when 10 sprite pixels no longer fit', { tag: ['@canvas.zoom-limits'] }, async ({ page }) => {
    // Start from a sprite far larger than what fits at the maximum zoom.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(64, 64));

    // Zoom in, more than the limit allows.
    await pressRepeatedly(page, '+', 40);

    // The zoom stops where the shortest side of the area shows 10 pixels.
    const area = await getDrawingAreaSize(page);
    await assertZoom(page, area.height / 10);
    await assertVisibleRows(page, 27, 36);

    // Zooming in further changes nothing.
    await pressRepeatedly(page, '+', 3);
    await assertZoom(page, area.height / 10);
  });

  test('zooming out should stop at one screen pixel per sprite pixel', { tag: ['@canvas.zoom-limits'] }, async ({ page }) => {
    // Start from a sprite displayed larger than one screen pixel per sprite pixel.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(64, 64));

    // Zoom out, more than the limit allows.
    await pressRepeatedly(page, '-', 60);
    await assertZoom(page, 1);

    // Zooming out further changes nothing.
    await pressRepeatedly(page, '-', 3);
    await assertZoom(page, 1);

    // 10 screen pixels cover 10 sprite pixels.
    await expect.poll(() => countSpritePixelsAcross(page, 10)).toBe(10);
  });
});

test.describe('Pan limits', () => {

  test('panning should stop at the edges of the sprite', { tag: ['@canvas.zoom-limits'] }, async ({ page }) => {
    // Start from a sprite zoomed in, showing only its middle.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(20, 20));
    await pressRepeatedly(page, '+', 15);
    await assertPixelAt(page, TOP_LEFT, '4:5');

    // Pan up and left, further than the sprite goes.
    await pressRepeatedly(page, 'Shift+ArrowUp', 30);
    await pressRepeatedly(page, 'Shift+ArrowLeft', 30);
    await assertPixelAt(page, TOP_LEFT, '0:0');

    // Pan down and right, further than the sprite goes.
    await pressRepeatedly(page, 'Shift+ArrowDown', 30);
    await pressRepeatedly(page, 'Shift+ArrowRight', 30);
    await assertPixelAt(page, BOTTOM_RIGHT, '19:19');
  });

  test('a sprite smaller than the area should not pan', { tag: ['@canvas.zoom-limits'] }, async ({ page }) => {
    // Start from a small sprite, with space around it.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(4, 4));
    await assertPixelAt(page, CENTER, '1:2');

    // Try to pan down and right.
    await pressRepeatedly(page, 'Shift+ArrowDown', 2);
    await pressRepeatedly(page, 'Shift+ArrowRight', 2);

    // The same pixel stays in the middle of the area.
    await assertPixelAt(page, CENTER, '1:2');
  });
});
