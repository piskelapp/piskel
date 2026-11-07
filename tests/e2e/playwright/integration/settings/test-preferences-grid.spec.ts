import test, { expect, Page } from "@playwright/test";
import {
  enableVisibleGrid,
  gridFromRows,
  openEditor,
  readGridLines,
  setGridLineWidth,
  setGridSpacing,
  setPiskelFromGrid,
} from "../../testutils";

/** An empty 10x10 sprite: a grid line every pixel makes 9 lines across it */
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

/** Open the preferences panel and switch to the Grid tab */
async function openGridPreferences(page: Page) {
  await page.locator('[data-setting="user"]').click();
  await expect(page.locator('.settings-section-preferences')).toBeAttached();
  await page.locator('[data-tab-id="grid"]').click();
  await expect(page.locator('.preferences-panel-grid')).toBeAttached();
}

/** Open the editor on an empty 10x10 sprite */
async function openEditorWithEmptySprite(page: Page) {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
}

/** Read the color of the first vertical grid line, in the middle of the sprite */
async function readFirstGridLineColor(page: Page) {
  return await page.evaluate(() => {
    const canvas = document.querySelector('.drawing-canvas') as HTMLCanvasElement;
    const renderer = (window as any).pskl.app.drawingController.renderer;
    const { zoom, margin, offset } = renderer;
    const x = Math.floor(margin.x + (1 - offset.x) * zoom);
    const y = Math.floor(margin.y + (5 - offset.y) * zoom + zoom / 2);
    const [r, g, b] = canvas.getContext('2d')!.getImageData(x, y, 1, 1).data;
    return { r, g, b };
  });
}

test.describe('Preferences — Grid tab', () => {

  // ─── Enable grid checkbox ─────────────────────────────────────

  test('grid should be disabled by default and canvas has no grid lines', { tag: ['@settings.grid-enabled'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);
    await openGridPreferences(page);

    await expect(page.locator('.enable-grid-checkbox')).not.toBeChecked();
    expect(await readGridLines(page, 10)).toEqual({ count: 0, widths: [] });
  });

  test('enabling grid with a visible color should draw grid lines on the canvas', { tag: ['@settings.grid-enabled', '@canvas.grid'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Pick a red grid color, as the default one is transparent, and enable the grid.
    await enableVisibleGrid(page);

    // A line of one pixel shows between each sprite pixel.
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [1] });
  });

  test('disabling grid should remove grid lines from the canvas', { tag: ['@settings.grid-enabled', '@canvas.grid'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);
    await enableVisibleGrid(page);
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [1] });

    // Disable it: the lines go away.
    await page.locator('.enable-grid-checkbox').uncheck();
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 0, widths: [] });
  });

  // ─── Grid size ─────────────────────────────────────────────────

  test('grid size should default to 1 and changing it should affect the canvas', { tag: ['@settings.grid-width'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);
    await openGridPreferences(page);
    await expect(page.locator('.grid-size-container .size-picker-option.selected')).toHaveAttribute('data-size', '1');

    // Enable the grid: its lines are 1 pixel wide.
    await page.locator('[data-setting="user"]').click();
    await enableVisibleGrid(page);
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [1] });

    // Pick a size of 3: only that option is selected, and the lines are 3 pixels wide.
    await setGridLineWidth(page, 3);
    await expect(page.locator('.grid-size-container .size-picker-option[data-size="3"]')).toHaveClass(/selected/);
    await expect(page.locator('.grid-size-container .size-picker-option[data-size="1"]')).not.toHaveClass(/selected/);
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [3] });
  });

  // ─── Grid spacing ─────────────────────────────────────────────

  test('grid spacing should default to 1 and changing it should affect the canvas', { tag: ['@settings.grid-spacing'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);
    await openGridPreferences(page);
    await expect(page.locator('.grid-spacing-container .size-picker-option.selected')).toHaveAttribute('data-size', '1');

    // Enable the grid: a line between each pixel.
    await page.locator('[data-setting="user"]').click();
    await enableVisibleGrid(page);
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 9, widths: [1] });

    // Pick a spacing of 4: only that option is selected, and the lines are at 4 and 8.
    await setGridSpacing(page, 4);
    await expect(page.locator('.grid-spacing-container .size-picker-option[data-size="4"]')).toHaveClass(/selected/);
    await expect(page.locator('.grid-spacing-container .size-picker-option[data-size="1"]')).not.toHaveClass(/selected/);
    await expect.poll(() => readGridLines(page, 10)).toEqual({ count: 2, widths: [1] });
  });

  // ─── Grid color ────────────────────────────────────────────────

  test('should display all 14 grid color options', { tag: ['@settings.grid-color'] }, async ({ page }) => {
    await openEditor(page);
    await openGridPreferences(page);

    // 14 colors are offered, and transparent is selected.
    await expect(page.locator('.grid-colors-item')).toHaveCount(14);
    await expect(page.locator('.grid-colors-item.selected')).toHaveAttribute('data-color', 'rgba(0, 0, 0, 0)');
  });

  test('changing grid color should change the actual grid line color on canvas', { tag: ['@settings.grid-color'] }, async ({ page }) => {
    // Enable the grid in red (#FF004D).
    await openEditorWithEmptySprite(page);
    await enableVisibleGrid(page);
    await expect.poll(() => readFirstGridLineColor(page)).toEqual({ r: 255, g: 0, b: 77 });

    // Switch to blue (#29ADFF): only that color is selected, and the lines are blue.
    await page.locator('.grid-colors-item[data-color="#29ADFF"]').click();
    await expect(page.locator('.grid-colors-item[data-color="#29ADFF"]')).toHaveClass(/selected/);
    await expect(page.locator('.grid-colors-item[data-color="#FF004D"]')).not.toHaveClass(/selected/);
    await expect.poll(() => readFirstGridLineColor(page)).toEqual({ r: 41, g: 173, b: 255 });
  });
});
