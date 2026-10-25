import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  getPrimaryColor,
  clickTool,
  drawAtPixel,
  getPixelColor,
  colorToInt,
  waitFor,
  wait,
} from "../../testutils";

/** Get screen coordinates for a sprite pixel */
async function getScreenCoords(page: Page, col: number, row: number) {
  return page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col, row });
}

test.describe('Misc UI — Alt+click pick color', () => {

  test('Alt+click on canvas should pick color from pixel', async ({ page }) => {
    await openEditor(page);

    // Draw a red pixel at (2,2)
    await setPiskelFromGrid(page, [
      ['T', 'T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T', 'T'],
      ['T', 'T', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T', 'T'],
    ]);

    // Set primary to black (not red)
    await setPrimaryColor(page, '#000000');
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#000000');

    // Select pen tool (not color picker)
    await clickTool(page, 'tool-pen');

    // Alt+click on the red pixel should pick its color
    const coords = await getScreenCoords(page, 2, 2);
    await page.keyboard.down('Alt');
    await page.mouse.click(coords.x, coords.y);
    await page.keyboard.up('Alt');
    await wait(200);

    // Primary color should now be red
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#ff0000');
  });

  test('Alt+click on transparent pixel should pick transparent', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T'],
      ['T', 'T', 'T'],
      ['T', 'T', 'T'],
    ]);

    await setPrimaryColor(page, '#FF0000');
    await clickTool(page, 'tool-pen');

    // Alt+click on a transparent pixel
    const coords = await getScreenCoords(page, 1, 1);
    await page.keyboard.down('Alt');
    await page.mouse.click(coords.x, coords.y);
    await page.keyboard.up('Alt');
    await wait(200);

    // Primary color should be transparent
    const color = await getPrimaryColor(page);
    expect(color).toBe('rgba(0, 0, 0, 0)');
  });
});

test.describe('Misc UI — right-click draws with secondary color', () => {

  test('right-click should draw with secondary color', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');
    await clickTool(page, 'tool-pen');

    // Left-click at (0,0) should draw primary (red)
    await drawAtPixel(page, 0, 0);
    await wait(100);

    // Right-click at (1,1) should draw secondary (blue)
    const coords = await getScreenCoords(page, 1, 1);
    await page.mouse.click(coords.x, coords.y, { button: 'right' });
    await wait(200);

    // Red pixel at (0,0) from left-click
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000'));

    // Blue pixel at (1,1) from right-click
    expect(await getPixelColor(page, 1, 1)).toBe(colorToInt('#0000FF'));
  });
});

test.describe('Misc UI — middle-click pan', () => {

  test('middle-click drag should pan the canvas', async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);

    // Zoom in so there's room to pan
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('+');
      await wait(100);
    }
    await wait(300);

    // Read the cursor coordinates panel — shows frame size and zoom
    const coordsText = await page.locator('.cursor-coordinates .drawing-zoom').innerText();
    const zoomBefore = parseFloat(coordsText.replace('x', ''));
    expect(zoomBefore).toBeGreaterThan(1);

    // Middle-click drag to pan
    const canvas = page.locator('#drawing-canvas-container');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Screenshot before pan
    const beforeScreenshot = await canvas.screenshot();

    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: 'middle' });
    // Large drag to ensure visible pan effect
    await page.mouse.move(centerX - 200, centerY - 100, { steps: 15 });
    await page.mouse.up({ button: 'middle' });
    await wait(500);

    // Canvas should look different after panning
    const afterScreenshot = await canvas.screenshot();
    expect(beforeScreenshot.equals(afterScreenshot)).toBe(false);

    // Pixel data should remain unchanged (pan is view-only)
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 1, 1)).toBe(0); // transparent
  });
});
