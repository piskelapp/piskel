import test, { Page, expect } from '../../fixtures';
import {
  expectHasClass,
  expectHasNotClass,
  openEditor,
  testId,
  setPiskelFromGrid,
  setPrimaryColor,
  drawAtPixel,
  clickTool,
  getAddFrameButton,
  getFrameTiles,
  waitFor,
  wait,
} from "../../testutils";

const ONION_SKIN_SELECTOR = '.preview-toggle-onion-skin';
const ENABLED_CLASS = 'preview-toggle-onion-skin-enabled';

const isOnionSkinEnabled = async (page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
    return window.pskl.UserSettings.get(window.pskl.UserSettings.ONION_SKIN) as boolean;
  });
};

/** Read a pixel from the onion-skin-canvas at sprite coordinates (col, row).
 *  Accounts for the renderer margin that centers the sprite in the display area.
 *  Returns {r, g, b, a} (0-255 each). */
async function getOnionSkinPixel(page: Page, col: number, row: number) {
  return await page.evaluate(({ col, row }) => {
    const canvas = document.querySelector('.onion-skin-canvas') as HTMLCanvasElement;
    if (!canvas) return { r: 0, g: 0, b: 0, a: 0 };
    const renderer = (window as any).pskl.app.drawingController.onionSkinRenderer.renderer;
    const zoom = renderer.zoom;
    const margin = renderer.margin;
    const offset = renderer.offset;
    const x = Math.floor(margin.x + (col - offset.x) * zoom + zoom / 2);
    const y = Math.floor(margin.y + (row - offset.y) * zoom + zoom / 2);
    const ctx = canvas.getContext('2d')!;
    const data = ctx.getImageData(x, y, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  }, { col, row });
}

test.describe('Onion skin', () => {

  test('should be disabled by default', async ({ page }) => {
    await openEditor(page);

    expect(await isOnionSkinEnabled(page)).toBe(false);
    await expectHasNotClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);
  });

  test('should toggle on when clicking the onion skin button', async ({ page }) => {
    await openEditor(page);

    await testId(page, 'onion-skin-toggle-button').click();

    await expect.poll(() => isOnionSkinEnabled(page), {
      timeout: 5000,
      message: 'Onion skin should be enabled',
    }).toBe(true);

    await expectHasClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);
  });

  test('should toggle off when clicking again', async ({ page }) => {
    await openEditor(page);

    // Enable
    await testId(page, 'onion-skin-toggle-button').click();
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(true);

    // Disable
    await testId(page, 'onion-skin-toggle-button').click();
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(false);

    await expectHasNotClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);
  });

  test('should toggle onion skin with Alt+O shortcut', async ({ page }) => {
    await openEditor(page);

    expect(await isOnionSkinEnabled(page)).toBe(false);

    await page.keyboard.press('Alt+o');
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(true);
    await expectHasClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);

    await page.keyboard.press('Alt+o');
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(false);
    await expectHasNotClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);
  });

  test('onion skin canvas should render previous and next frame content', async ({ page }) => {
    await openEditor(page);

    // Create a 10x10 piskel with a red pixel at (1,1) on frame 0
    await setPiskelFromGrid(page, Array.from({ length: 10 }, () => Array(10).fill('T')));
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    // Add frame 1 (empty — this will be our observation frame)
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);

    // Add frame 2 and draw a green pixel at (5,5)
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 3);
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 5, 5);

    // Navigate to frame 1 (the middle frame)
    await getFrameTiles(page).nth(1).click();
    await wait(300);

    // Onion skin canvas should be empty before enabling
    const beforePixel = await getOnionSkinPixel(page, 1, 1);
    expect(beforePixel.a).toBe(0);

    // Enable onion skin
    await testId(page, 'onion-skin-toggle-button').click();
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(true);

    // Wait for onion skin to render frame 0's red pixel at (1,1)
    await waitFor(async () => {
      const px = await getOnionSkinPixel(page, 1, 1);
      return px.a > 0;
    });

    // Verify previous frame's red pixel
    const prevPixel = await getOnionSkinPixel(page, 1, 1);
    expect(prevPixel.r).toBe(255);
    expect(prevPixel.g).toBe(0);
    expect(prevPixel.b).toBe(0);

    // Verify next frame's green pixel at (5,5)
    const nextPixel = await getOnionSkinPixel(page, 5, 5);
    expect(nextPixel.a).toBeGreaterThan(0);
    expect(nextPixel.g).toBe(255);

    // Empty pixel on adjacent frames should remain transparent
    const emptyPixel = await getOnionSkinPixel(page, 8, 8);
    expect(emptyPixel.a).toBe(0);
  });

  test('onion skin canvas should clear when disabled', async ({ page }) => {
    await openEditor(page);

    // Frame 0: red pixel at (1,1)
    await setPiskelFromGrid(page, Array.from({ length: 10 }, () => Array(10).fill('T')));
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    // Add frame 1 (empty) — auto-selected
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);

    // Enable onion skin — should render frame 0's red pixel
    await testId(page, 'onion-skin-toggle-button').click();
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(true);

    await waitFor(async () => {
      const px = await getOnionSkinPixel(page, 1, 1);
      return px.a > 0;
    });
    expect((await getOnionSkinPixel(page, 1, 1)).r).toBe(255);

    // Disable onion skin — canvas should clear
    await testId(page, 'onion-skin-toggle-button').click();
    await expect.poll(() => isOnionSkinEnabled(page), { timeout: 5000 }).toBe(false);
    await wait(500);

    const pixel = await getOnionSkinPixel(page, 1, 1);
    expect(pixel.a).toBe(0);
  });
});
