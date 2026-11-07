import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  clickTool,
  drawAtPixel,
  getPrimaryColor,
  gridFromColorRows,
  openEditor,
  readZoom,
  rightClickAtPixel,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  wait,
} from "../../testutils";

/** 10x10 sprites */
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
const RED_PIXEL_AT_2_2 = [
  '..........',
  '..........',
  '..R.......',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('Misc UI — Alt+click pick color', () => {

  test('Alt+click on canvas should pick color from pixel', { tag: ['@canvas.pick-color'] }, async ({ page }) => {
    // A red pixel, with the pen and a black primary color.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL_AT_2_2));
    await setPrimaryColor(page, '#000000');
    await clickTool(page, 'tool-pen');

    // Alt+click the red pixel: red becomes the primary color, and nothing is drawn.
    await page.keyboard.down('Alt');
    await drawAtPixel(page, 2, 2);
    await page.keyboard.up('Alt');
    await expect.poll(() => getPrimaryColor(page)).toBe('#ff0000');
    await assertColorRows(page, RED_PIXEL_AT_2_2);
  });

  test('Alt+click on transparent pixel should pick transparent', { tag: ['@canvas.pick-color'] }, async ({ page }) => {
    // A red pixel, with the pen and a red primary color.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL_AT_2_2));
    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');

    // Alt+click a transparent pixel: the primary color becomes transparent.
    await page.keyboard.down('Alt');
    await drawAtPixel(page, 1, 1);
    await page.keyboard.up('Alt');
    await expect.poll(() => getPrimaryColor(page)).toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('Misc UI — right-click draws with secondary color', () => {

  test('right-click should draw with secondary color', { tag: ['@drawing-tools.mouse-buttons'] }, async ({ page }) => {
    // An empty sprite, with the pen, a red primary and a blue secondary color.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(EMPTY));
    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');
    await clickTool(page, 'tool-pen');

    // A left click draws in red, a right click in blue.
    await drawAtPixel(page, 0, 0);
    await rightClickAtPixel(page, 1, 1);
    await assertColorRows(page, [
      'R.........',
      '.B........',
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

test.describe('Misc UI — middle-click pan', () => {

  test('middle-click drag should pan the canvas', { tag: ['@canvas.middle-drag-pan'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL_AT_2_2));

    // Zoom in, so there's room to pan.
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('+');
    }
    await expect.poll(() => readZoom(page)).toBeGreaterThan(1);
    // Let the drawing area render the new zoom before taking the screenshot.
    await wait(300);

    // Drag with the middle button: the drawing area shows another part of the sprite.
    const canvas = page.locator('#drawing-canvas-container');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const beforeScreenshot = await canvas.screenshot();
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(centerX - 200, centerY - 100, { steps: 15 });
    await page.mouse.up({ button: 'middle' });
    await expect.poll(async () => (await canvas.screenshot()).equals(beforeScreenshot)).toBe(false);

    // Panning only changes the view: the pixels are the same.
    await assertColorRows(page, RED_PIXEL_AT_2_2);
  });
});
