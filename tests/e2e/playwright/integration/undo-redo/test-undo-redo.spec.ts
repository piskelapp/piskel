import test, { expect } from "@playwright/test";
import {
  openEditor,
  undo,
  redo,
  getPixelColor,
  getCurrentPiskelFrameCount,
  getCurrentPiskelLayerCount,
  drawAtPixel,
  setPrimaryColor,
  clickTool,
  getAddLayerButton,
  colorToInt,
  TRANSPARENT,
  waitFor,
  wait,
} from "../../testutils";

test.describe('Undo and Redo', () => {

  test('should undo a pixel change', async ({ page }) => {
    await openEditor(page);

    // Verify pixel is initially transparent
    expect(await getPixelColor(page, 2, 2)).toBe(TRANSPARENT);

    // Draw a red pixel via real mouse click
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 2, 2);

    // Verify pixel is now red
    expect(await getPixelColor(page, 2, 2)).toBe(colorToInt('#FF0000'));

    // Undo and wait for pixel to become transparent
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 2, 2)) === TRANSPARENT);
  });

  test('should redo after undo', async ({ page }) => {
    await openEditor(page);

    // Draw a pixel
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 3, 3);
    expect(await getPixelColor(page, 3, 3)).toBe(colorToInt('#00FF00'));

    // Undo
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 3, 3)) === TRANSPARENT);

    // Redo — small gap needed for HistoryService LOAD_STATE_INTERVAL throttle (50ms)
    await wait(100);
    await redo(page);
    await waitFor(async () => (await getPixelColor(page, 3, 3)) === colorToInt('#00FF00'));
  });

  test('should undo multiple steps', async ({ page }) => {
    await openEditor(page);
    await clickTool(page, 'tool-pen');

    // Step 1: draw red pixel at (0,0)
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await getPixelColor(page, 0, 0)) === colorToInt('#FF0000'));

    // Step 2: draw green pixel at (1,1)
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);
    await waitFor(async () => (await getPixelColor(page, 1, 1)) === colorToInt('#00FF00'));

    // Undo step 2
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 1, 1)) === TRANSPARENT);
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000')); // red still there

    // Undo step 1 — gap for HistoryService LOAD_STATE_INTERVAL throttle
    await wait(100);
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 0, 0)) === TRANSPARENT);
  });

  test('should undo add frame', async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);

    // Add a frame via keyboard
    await page.keyboard.press('n');
    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 2);

    // Undo should remove the added frame
    await undo(page);
    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 1);
  });

  test('should undo add layer', async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);

    // Add a layer
    await getAddLayerButton(page).click();
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Undo should remove the added layer
    await undo(page);
    await waitFor(async () => (await getCurrentPiskelLayerCount(page)) === 1);
  });
});
