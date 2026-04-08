import test, { expect, Page } from '../../fixtures';
import { openEditor, waitFor, wait } from "../../testutils";

/** Open the preferences panel and switch to the Grid tab */
async function openGridPreferences(page: Page) {
  await page.locator('[data-setting="user"]').click();
  await expect(page.locator('.settings-section-preferences')).toBeAttached();
  await page.locator('[data-tab-id="grid"]').click();
  await expect(page.locator('.preferences-panel-grid')).toBeAttached();
}

/** Take a screenshot of the drawing canvas container */
async function getCanvasScreenshot(page: Page): Promise<Buffer> {
  return await page.locator('#drawing-canvas-container').screenshot();
}

/** Read a pixel from the drawing-canvas at a grid line position.
 *  Grid lines are drawn between sprite pixels at position (pixelIndex * zoom).
 *  Returns {r, g, b, a}. */
async function readGridLinePixel(page: Page, pixelBoundary: number, axis: 'vertical' | 'horizontal') {
  return await page.evaluate(({ pixelBoundary, axis }) => {
    const canvas = document.querySelector('.drawing-canvas') as HTMLCanvasElement;
    const renderer = (window as any).pskl.app.drawingController.renderer;
    const zoom = renderer.zoom;
    const margin = renderer.margin;
    const offset = renderer.offset;
    const ctx = canvas.getContext('2d')!;

    // Grid line at pixel boundary i is drawn at (i * zoom) in sprite-local coords
    // In canvas coords: margin + (boundary - offset) * zoom
    let x: number, y: number;
    if (axis === 'vertical') {
      x = Math.floor(margin.x + (pixelBoundary - offset.x) * zoom);
      y = Math.floor(margin.y + (2 - offset.y) * zoom + zoom / 2); // sample mid-sprite
    } else {
      x = Math.floor(margin.x + (2 - offset.x) * zoom + zoom / 2); // sample mid-sprite
      y = Math.floor(margin.y + (pixelBoundary - offset.y) * zoom);
    }

    const data = ctx.getImageData(x, y, 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  }, { pixelBoundary, axis });
}

test.describe('Preferences — Grid tab', () => {

  // ─── Enable grid checkbox ─────────────────────────────────────

  test('grid should be disabled by default and canvas has no grid lines', async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    const checkbox = page.locator('.enable-grid-checkbox');
    await expect(checkbox).not.toBeChecked();
  });

  test('enabling grid with a visible color should draw grid lines on the canvas', async ({ page }) => {
    await openEditor(page);

    // Take baseline screenshot
    const beforeScreenshot = await getCanvasScreenshot(page);

    await openGridPreferences(page);

    // Set a visible grid color first (default is transparent)
    await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
    await wait(200);

    // Enable the grid
    await page.locator('.enable-grid-checkbox').check();
    await wait(500);

    // Canvas should now look different (grid lines drawn)
    await waitFor(async () => {
      const s = await getCanvasScreenshot(page);
      return !beforeScreenshot.equals(s);
    });

    // Verify a vertical grid line pixel at boundary 1 is the red color
    const pixel = await readGridLinePixel(page, 1, 'vertical');
    expect(pixel.r).toBeGreaterThan(200); // red channel from #FF004D
    expect(pixel.a).toBeGreaterThan(0);
  });

  test('disabling grid should remove grid lines from the canvas', async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    // Enable grid with visible color
    await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
    await page.locator('.enable-grid-checkbox').check();
    await wait(500);

    const gridOnScreenshot = await getCanvasScreenshot(page);

    // Disable grid
    await page.locator('.enable-grid-checkbox').uncheck();
    await wait(500);

    await waitFor(async () => {
      const s = await getCanvasScreenshot(page);
      return !gridOnScreenshot.equals(s);
    });

    // Grid line pixel should no longer be red
    const pixel = await readGridLinePixel(page, 1, 'vertical');
    expect(pixel.r).not.toBe(255);
  });

  // ─── Grid size ─────────────────────────────────────────────────

  test('grid size should default to 1 and changing it should affect the canvas', async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    // Verify default selection
    await expect(page.locator('.grid-size-container .size-picker-option.selected')).toHaveAttribute('data-size', '1');

    // Enable grid with visible color
    await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
    await page.locator('.enable-grid-checkbox').check();
    await wait(500);

    const size1Screenshot = await getCanvasScreenshot(page);

    // Change to size 3
    await page.locator('.grid-size-container .size-picker-option[data-size="3"]').click();
    await expect(page.locator('.grid-size-container .size-picker-option[data-size="3"]')).toHaveClass(/selected/);
    await expect(page.locator('.grid-size-container .size-picker-option[data-size="1"]')).not.toHaveClass(/selected/);
    await wait(500);

    // Canvas should look different with thicker grid lines
    await waitFor(async () => {
      const s = await getCanvasScreenshot(page);
      return !size1Screenshot.equals(s);
    });
  });

  // ─── Grid spacing ─────────────────────────────────────────────

  test('grid spacing should default to 1 and changing it should affect the canvas', async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    // Verify default selection
    await expect(page.locator('.grid-spacing-container .size-picker-option.selected')).toHaveAttribute('data-size', '1');

    // Enable grid with visible color
    await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
    await page.locator('.enable-grid-checkbox').check();
    await wait(500);

    const spacing1Screenshot = await getCanvasScreenshot(page);

    // Change spacing to 4 (grid lines every 4 pixels instead of every 1)
    await page.locator('.grid-spacing-container .size-picker-option[data-size="4"]').click();
    await expect(page.locator('.grid-spacing-container .size-picker-option[data-size="4"]')).toHaveClass(/selected/);
    await expect(page.locator('.grid-spacing-container .size-picker-option[data-size="1"]')).not.toHaveClass(/selected/);
    await wait(500);

    // Canvas should look different (fewer grid lines)
    await waitFor(async () => {
      const s = await getCanvasScreenshot(page);
      return !spacing1Screenshot.equals(s);
    });

    // Grid line at boundary 4 should still have color (multiple of spacing)
    const atSpacing = await readGridLinePixel(page, 4, 'vertical');
    expect(atSpacing.r).toBeGreaterThan(200);

    // Grid line at boundary 1 should NOT have grid color (not a multiple of 4)
    const notAtSpacing = await readGridLinePixel(page, 1, 'vertical');
    expect(notAtSpacing.r).not.toBe(255);
  });

  // ─── Grid color ────────────────────────────────────────────────

  test('should display all 14 grid color options', async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    const colorItems = page.locator('.grid-colors-item');
    expect(await colorItems.count()).toBe(14);

    // Default selection should be transparent
    await expect(page.locator('.grid-colors-item.selected')).toHaveAttribute('data-color', 'rgba(0, 0, 0, 0)');
  });

  test('changing grid color should change the actual grid line color on canvas', async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    // Enable grid with red color
    await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
    await page.locator('.enable-grid-checkbox').check();
    await wait(500);

    // Verify red grid lines
    const redPixel = await readGridLinePixel(page, 1, 'vertical');
    expect(redPixel.r).toBeGreaterThan(200);
    expect(redPixel.g).toBe(0);

    const redScreenshot = await getCanvasScreenshot(page);

    // Switch to blue
    await page.locator('.grid-colors-item[data-color="#29ADFF"]').click();
    await expect(page.locator('.grid-colors-item[data-color="#29ADFF"]')).toHaveClass(/selected/);
    await expect(page.locator('.grid-colors-item[data-color="#FF004D"]')).not.toHaveClass(/selected/);
    await wait(500);

    // Canvas should change
    await waitFor(async () => {
      const s = await getCanvasScreenshot(page);
      return !redScreenshot.equals(s);
    });

    // Grid lines should now be blue
    const bluePixel = await readGridLinePixel(page, 1, 'vertical');
    expect(bluePixel.b).toBeGreaterThan(200);
    expect(bluePixel.r).toBeLessThan(100);
  });
});
