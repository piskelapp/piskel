import test, { expect, Page } from "@playwright/test";
import {
  assertFrameCount,
  clickTool,
  getAddFrameButton,
  getPixelScreenPosition,
  gridFromRows,
  hoverPixel,
  openEditor,
  setPiskelFromGrid,
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

/** Get the text of the cursor coordinates panel, without the zoom and frame number */
async function getCoordsText(page: Page): Promise<string> {
  return await page.locator('.cursor-coordinates').evaluate(el => {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.drawing-zoom, .frame-info').forEach(d => d.remove());
    return clone.textContent?.trim() ?? '';
  });
}

test.describe('Cursor coordinates', () => {

  test('should display frame size on load', { tag: ['@canvas.coords-size'] }, async ({ page }) => {
    // The default sprite is 32x32.
    await openEditor(page);
    expect(await getCoordsText(page)).toContain('[32x32]');
  });

  test('should show x:y coordinates when hovering over canvas', { tag: ['@canvas.coords-hover'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Hover a pixel: its position shows, after the size of the sprite.
    await hoverPixel(page, 3, 5);
    await expect.poll(() => getCoordsText(page)).toContain('3:5');
    expect(await getCoordsText(page)).toContain('[10x10]');
  });

  test('should update coordinates when moving mouse to a different pixel', { tag: ['@canvas.coords-hover'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Hover a first pixel, then another one: only the second position shows.
    await hoverPixel(page, 2, 3);
    await expect.poll(() => getCoordsText(page)).toContain('2:3');
    await hoverPixel(page, 7, 1);
    await expect.poll(() => getCoordsText(page)).toContain('7:1');
    expect(await getCoordsText(page)).not.toContain('2:3');
  });

  test('should show drag origin during rectangle selection', { tag: ['@canvas.coords-drag'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-rectangle-select');

    // Start dragging at (1,2), and hold the button down at (5,7).
    const start = await getPixelScreenPosition(page, 1, 2);
    const end = await getPixelScreenPosition(page, 5, 7);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });

    // The panel shows the start, the end and the size of the selection.
    await expect.poll(() => getCoordsText(page)).toContain('1:2 to 5:7 (5x6)');
    await page.mouse.up();
  });

  test('should clear drag origin after mouse up', { tag: ['@canvas.coords-drag'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-rectangle-select');

    // Drag from (1,2) to (5,7), and release the button.
    const start = await getPixelScreenPosition(page, 1, 2);
    const end = await getPixelScreenPosition(page, 5, 7);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await expect.poll(() => getCoordsText(page)).toContain(' to ');
    await page.mouse.up();

    // Only the hovered position is left.
    await expect.poll(() => getCoordsText(page)).not.toContain(' to ');
  });

  test('should show frame index and update when navigating frames', { tag: ['@canvas.coords-frame'] }, async ({ page }) => {
    await openEditor(page);
    const frameInfo = page.locator('.cursor-coordinates .frame-info');
    await expect(frameInfo).toHaveText('1/1');

    // Add two frames: the new frame is selected.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);
    await expect(frameInfo).toHaveText('3/3');

    // Go back with ArrowUp, and forward with ArrowDown.
    await page.keyboard.press('ArrowUp');
    await expect(frameInfo).toHaveText('2/3');
    await page.keyboard.press('ArrowUp');
    await expect(frameInfo).toHaveText('1/3');
    await page.keyboard.press('ArrowDown');
    await expect(frameInfo).toHaveText('2/3');
  });

  test('should show zoom level', { tag: ['@canvas.coords-zoom'] }, async ({ page }) => {
    // The zoom shows as a value like "x1.00".
    await openEditor(page);
    await expect(page.locator('.cursor-coordinates .drawing-zoom')).toHaveText(/^x\d+\.\d+$/);
  });
});
