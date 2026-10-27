import test, { expect, Page } from "@playwright/test";
import { openEditor, clickTool, setPiskelFromGrid, waitFor, getAddFrameButton, getFrameTiles, wait } from "../../testutils";

/** Get screen coordinates for a sprite pixel (waits for pending relayout first) */
async function getScreenCoords(page: Page, col: number, row: number) {
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 210)));
  return page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col, row });
}

/** Get the text content of the cursor coordinates panel (stripped of inner divs) */
async function getCoordsText(page: Page): Promise<string> {
  return await page.locator('.cursor-coordinates').evaluate(el => {
    // Get the raw text, excluding the zoom div and frame-info div content
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('.drawing-zoom, .frame-info').forEach(d => d.remove());
    return clone.textContent?.trim() ?? '';
  });
}

test.describe('Cursor coordinates', () => {

  test('should display frame size on load', async ({ page }) => {
    await openEditor(page);

    const text = await getCoordsText(page);
    // Default piskel is 32x32
    expect(text).toContain('[32x32]');
  });

  test('should show x:y coordinates when hovering over canvas', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, Array.from({ length: 10 }, () => Array(10).fill('T')));

    // Hover at pixel (3, 5)
    const coords = await getScreenCoords(page, 3, 5);
    await page.mouse.move(coords.x, coords.y);

    await waitFor(async () => {
      const text = await getCoordsText(page);
      return text.includes('3:5');
    });

    const text = await getCoordsText(page);
    expect(text).toContain('[10x10]');
    expect(text).toContain('3:5');
  });

  test('should update coordinates when moving mouse to a different pixel', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, Array.from({ length: 10 }, () => Array(10).fill('T')));

    // Move to (2, 3)
    const coords1 = await getScreenCoords(page, 2, 3);
    await page.mouse.move(coords1.x, coords1.y);
    await waitFor(async () => (await getCoordsText(page)).includes('2:3'));

    // Move to (7, 1)
    const coords2 = await getScreenCoords(page, 7, 1);
    await page.mouse.move(coords2.x, coords2.y);
    await waitFor(async () => (await getCoordsText(page)).includes('7:1'));

    const text = await getCoordsText(page);
    expect(text).toContain('7:1');
    expect(text).not.toContain('2:3');
  });

  test('should show drag origin during rectangle selection', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, Array.from({ length: 10 }, () => Array(10).fill('T')));

    await clickTool(page, 'tool-rectangle-select');

    // Start drag at (1, 2), hold, move to (5, 7)
    const start = await getScreenCoords(page, 1, 2);
    const end = await getScreenCoords(page, 5, 7);

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });

    // During drag, should show "1:2 to 5:7 (5x6)"
    await waitFor(async () => {
      const text = await getCoordsText(page);
      return text.includes('1:2 to') && text.includes('5:7');
    });

    const text = await getCoordsText(page);
    expect(text).toContain('1:2 to');
    expect(text).toContain('5:7');
    expect(text).toContain('(5x6)');

    await page.mouse.up();
  });

  test('should clear drag origin after mouse up', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, Array.from({ length: 10 }, () => Array(10).fill('T')));

    await clickTool(page, 'tool-rectangle-select');

    const start = await getScreenCoords(page, 1, 2);
    const end = await getScreenCoords(page, 5, 7);

    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 5 });
    await page.mouse.up();

    // After drag ends, "to" should no longer appear
    await waitFor(async () => {
      const text = await getCoordsText(page);
      return !text.includes(' to ');
    });

    const text = await getCoordsText(page);
    expect(text).not.toContain(' to ');
  });

  test('should show frame index and update when navigating frames', async ({ page }) => {
    await openEditor(page);
    const frameInfo = page.locator('.cursor-coordinates .frame-info');

    // Default: 1 frame → "1/1"
    expect((await frameInfo.innerText()).trim()).toBe('1/1');

    // Add 2 more frames (total 3) — adding auto-selects the new frame
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 3);

    // After adding, we're on frame 3/3
    await waitFor(async () => (await frameInfo.innerText()).trim() === '3/3');
    expect((await frameInfo.innerText()).trim()).toBe('3/3');

    // Navigate to frame 2 with ArrowUp (previous)
    await page.keyboard.press('ArrowUp');
    await wait(200);
    await waitFor(async () => (await frameInfo.innerText()).trim() === '2/3');
    expect((await frameInfo.innerText()).trim()).toBe('2/3');

    // Navigate to frame 1
    await page.keyboard.press('ArrowUp');
    await wait(200);
    await waitFor(async () => (await frameInfo.innerText()).trim() === '1/3');
    expect((await frameInfo.innerText()).trim()).toBe('1/3');

    // Navigate forward to frame 2 with ArrowDown
    await page.keyboard.press('ArrowDown');
    await wait(200);
    await waitFor(async () => (await frameInfo.innerText()).trim() === '2/3');
    expect((await frameInfo.innerText()).trim()).toBe('2/3');
  });

  test('should show zoom level', async ({ page }) => {
    await openEditor(page);

    const zoomText = await page.locator('.cursor-coordinates .drawing-zoom').innerText();
    // Zoom should be a value like "x1.00" or similar
    expect(zoomText).toMatch(/^x\d+\.\d+$/);
  });
});
