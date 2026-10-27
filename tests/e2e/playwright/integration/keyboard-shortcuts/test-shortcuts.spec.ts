import test, { expect } from "@playwright/test";
import {
  openEditor,
  getSelectedToolId,
  clickTool,
  getSelectedPenSize,
} from "../../testutils";

test.describe('Keyboard shortcuts - tool selection', () => {

  const toolShortcuts: Array<{ key: string; toolId: string; name: string }> = [
    { key: 'p', toolId: 'tool-pen', name: 'Pen' },
    { key: 'v', toolId: 'tool-vertical-mirror-pen', name: 'Vertical Mirror Pen' },
    { key: 'b', toolId: 'tool-paint-bucket', name: 'Paint Bucket' },
    { key: 'a', toolId: 'tool-colorswap', name: 'Color Swap' },
    { key: 'e', toolId: 'tool-eraser', name: 'Eraser' },
    { key: 'l', toolId: 'tool-stroke', name: 'Stroke' },
    { key: 'r', toolId: 'tool-rectangle', name: 'Rectangle' },
    { key: 'c', toolId: 'tool-circle', name: 'Circle' },
    { key: 'm', toolId: 'tool-move', name: 'Move' },
    { key: 'z', toolId: 'tool-shape-select', name: 'Shape Select' },
    { key: 's', toolId: 'tool-rectangle-select', name: 'Rectangle Select' },
    { key: 'h', toolId: 'tool-lasso-select', name: 'Lasso Select' },
    { key: 'u', toolId: 'tool-lighten', name: 'Lighten' },
    { key: 't', toolId: 'tool-dithering', name: 'Dithering' },
    { key: 'o', toolId: 'tool-colorpicker', name: 'Color Picker' },
  ];

  for (const { key, toolId, name } of toolShortcuts) {
    test(`should select ${name} tool with "${key}" key`, async ({ page }) => {
      await openEditor(page);

      // First select a different tool to ensure the shortcut changes it
      if (toolId !== 'tool-pen') {
        await clickTool(page, 'tool-pen');
      } else {
        await clickTool(page, 'tool-eraser');
      }

      await page.keyboard.press(key);

      const selected = await getSelectedToolId(page);
      expect(selected).toBe(toolId);
    });
  }
});

test.describe('Keyboard shortcuts - mixed selection', () => {

  test('should switch tools via click and keyboard interchangeably', async ({ page }) => {
    await openEditor(page);

    // Click eraser
    await clickTool(page, 'tool-eraser');
    expect(await getSelectedToolId(page)).toBe('tool-eraser');

    // Switch to bucket via keyboard
    await page.keyboard.press('b');
    expect(await getSelectedToolId(page)).toBe('tool-paint-bucket');

    // Click pen
    await clickTool(page, 'tool-pen');
    expect(await getSelectedToolId(page)).toBe('tool-pen');

    // Switch to circle via keyboard
    await page.keyboard.press('c');
    expect(await getSelectedToolId(page)).toBe('tool-circle');

    // Click back to pen
    await clickTool(page, 'tool-pen');
    expect(await getSelectedToolId(page)).toBe('tool-pen');
  });
});

test.describe('Keyboard shortcuts - pen size', () => {

  test('should increase and decrease pen size with ] and [ keys', async ({ page }) => {
    await openEditor(page);

    expect(await getSelectedPenSize(page)).toBe(1);

    // Increase 1 → 2 → 3
    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(2);

    await page.keyboard.press(']');
    expect(await getSelectedPenSize(page)).toBe(3);

    // Decrease 3 → 2 → 1
    await page.keyboard.press('[');
    expect(await getSelectedPenSize(page)).toBe(2);

    await page.keyboard.press('[');
    expect(await getSelectedPenSize(page)).toBe(1);
  });
});
