import test, { expect, Page } from "@playwright/test";
import {
  assertSpriteSize,
  assertVisibleRows,
  assertZoom,
  cropSprite,
  downloadPiskelFile,
  emptyGrid,
  getDrawingAreaSize,
  importPiskelFile,
  openEditorWithSettledCanvas,
  pressRepeatedly,
  readPixelAtDrawingAreaPosition,
  readZoom,
  redo,
  resizeSprite,
  setPiskelFromGrid,
  undo,
} from "../../testutils";

/** Zoom in and pan down, then check that the sprite no longer fits the area */
const zoomInAndPan = async (page: Page, spriteHeight: number) => {
  await pressRepeatedly(page, '+', 8);
  await pressRepeatedly(page, 'Shift+ArrowDown', 3);
  const fitZoom = (await getDrawingAreaSize(page)).height / spriteHeight;
  await expect.poll(() => readZoom(page)).toBeGreaterThan(fitZoom);
  await expect.poll(async () => {
    const pixel = await readPixelAtDrawingAreaPosition(page, 0.5, 0);
    return Number(pixel.split(':')[1]);
  }).toBeGreaterThan(0);
};

/** Check that the sprite exactly fills the height of the area, from its first row */
const assertSpriteFits = async (page: Page, spriteHeight: number) => {
  const area = await getDrawingAreaSize(page);
  await assertZoom(page, area.height / spriteHeight);
  await assertVisibleRows(page, 0, spriteHeight - 1);
};

test.describe('Zoom and pan after a size change', () => {

  test('resizing the sprite should fit it, also when undone and redone', { tag: ['@canvas.fit-on-resize'] }, async ({ page }) => {
    // Start from a sprite zoomed in and panned.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(32, 32));
    await assertSpriteFits(page, 32);
    await zoomInAndPan(page, 32);

    // Resize it.
    await resizeSprite(page, 40, 40);
    await assertSpriteFits(page, 40);

    // Undo the resize, from a new zoom and pan.
    await zoomInAndPan(page, 40);
    await undo(page);
    await assertSpriteFits(page, 32);

    // Redo the resize, from a new zoom and pan.
    await zoomInAndPan(page, 32);
    await redo(page);
    await assertSpriteFits(page, 40);
  });

  test('resizing the sprite should reset the pan, even when the zoom stays the same', { tag: ['@canvas.fit-on-resize'] }, async ({ page }) => {
    // Start from a sprite at the maximum zoom, panned down to its last rows.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(20, 20));
    await pressRepeatedly(page, '+', 15);
    await pressRepeatedly(page, 'Shift+ArrowDown', 15);
    await assertVisibleRows(page, 10, 19);

    // Resize it to the size that fits at this same zoom: the first row shows again.
    await resizeSprite(page, 10, 10);
    await assertSpriteFits(page, 10);
  });

  test('cropping the sprite should fit it', { tag: ['@canvas.fit-on-resize'] }, async ({ page }) => {
    // Start from a sprite with pixels from (2,2) to (21,31), zoomed in and panned.
    const grid = emptyGrid(40, 40);
    grid[2][2] = 'R';
    grid[31][21] = 'R';
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, grid);
    await zoomInAndPan(page, 40);

    // Crop it to its 20x30 content.
    await cropSprite(page);
    await assertSpriteSize(page, 20, 30);
    await assertSpriteFits(page, 30);
  });

  test('loading a sprite should fit it, even of the same size', { tag: ['@canvas.fit-on-resize'] }, async ({ page }) => {
    // Save a 25x25 sprite in a file.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(25, 25));
    const piskelPath = await downloadPiskelFile(page);

    // Load it over a larger sprite, zoomed in and panned.
    await setPiskelFromGrid(page, emptyGrid(40, 40));
    await zoomInAndPan(page, 40);
    await importPiskelFile(page, piskelPath);
    await assertSpriteFits(page, 25);

    // Load it again, over itself, zoomed in and panned.
    await zoomInAndPan(page, 25);
    await importPiskelFile(page, piskelPath);
    await assertSpriteFits(page, 25);
  });
});

test.describe('Zoom after a window resize', () => {

  test('should scale with the width of the area', { tag: ['@canvas.fit-on-resize'] }, async ({ page }) => {
    // Start from a sprite that fits the area.
    await openEditorWithSettledCanvas(page);
    await setPiskelFromGrid(page, emptyGrid(32, 32));
    await assertSpriteFits(page, 32);
    const zoom = await readZoom(page);
    const { width } = await getDrawingAreaSize(page);

    // Make the window narrower: the zoom follows the width of the area.
    await page.setViewportSize({ width: 1100, height: 720 });
    await expect.poll(async () => (await getDrawingAreaSize(page)).width).toBeLessThan(width);
    const narrower = await getDrawingAreaSize(page);
    await expect.poll(() => readZoom(page)).toBeCloseTo((zoom * narrower.width) / width, 1);

    // Make it wide again: the zoom comes back.
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect.poll(() => readZoom(page)).toBeCloseTo(zoom, 1);

    // A window that only changes height isn't tested: its zoom doesn't follow, see
    // "Canvas (drawing area)" in docs/known-issues.md.
  });
});
