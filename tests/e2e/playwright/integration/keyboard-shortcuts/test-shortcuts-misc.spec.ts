import test, { expect, Page } from "@playwright/test";
import {
  CMD_OR_CTRL,
  openEditor,
  setPiskelFromGrid,
  clickTool,
  drawAtPixel,
  openSaveSettingsPanel,
  isSettingsDrawerExpanded,
  waitFor,
  gridFromColorRows,
  readZoom,
  assertPaletteSwatches,
  assertPrimaryColor,
} from "../../testutils";

test.describe('Keyboard shortcuts — zoom', () => {

  /** Press a zoom key, and wait for the zoom shown in the bottom bar to change */
  const pressZoomKey = async (page: Page, key: string, direction: 'in' | 'out') => {
    const before = await readZoom(page);
    await page.keyboard.press(key);
    if (direction === 'in') {
      await expect.poll(() => readZoom(page)).toBeGreaterThan(before);
    } else {
      await expect.poll(() => readZoom(page)).toBeLessThan(before);
    }
  };

  test('"+" should increase zoom', { tag: ['@canvas.zoom-shortcuts'] }, async ({ page }) => {
    await openEditor(page);
    await pressZoomKey(page, '+', 'in');
  });

  test('"-" should decrease zoom', { tag: ['@canvas.zoom-shortcuts'] }, async ({ page }) => {
    // Zoom in three times first.
    await openEditor(page);
    for (let i = 0; i < 3; i++) {
      await pressZoomKey(page, '+', 'in');
    }

    await pressZoomKey(page, '-', 'out');
  });

  test('"0" should reset zoom', { tag: ['@canvas.zoom-shortcuts'] }, async ({ page }) => {
    // Zoom in three times.
    await openEditor(page);
    const initial = await readZoom(page);
    for (let i = 0; i < 3; i++) {
      await pressZoomKey(page, '+', 'in');
    }

    // 0 goes back to the zoom of the start.
    await page.keyboard.press('0');
    await expect.poll(() => readZoom(page)).toBe(initial);
  });
});

test.describe('Keyboard shortcuts — palette color select', () => {

  test('"1"-"3" should select different palette colors', { tag: ['@colors-and-palettes.number-keys'] }, async ({ page }) => {
    // A sprite with a red, a green and a blue pixel: the current colors palette lists them.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RGB.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));
    await assertPaletteSwatches(page, ['#ff0000', '#00ff00', '#0000ff']);

    // Each number key selects the color at that position.
    await page.keyboard.press('1');
    await assertPrimaryColor(page, '#ff0000');
    await page.keyboard.press('2');
    await assertPrimaryColor(page, '#00ff00');
    await page.keyboard.press('3');
    await assertPrimaryColor(page, '#0000ff');
    await page.keyboard.press('1');
    await assertPrimaryColor(page, '#ff0000');
  });
});

test.describe('Keyboard shortcuts — save', () => {

  test('Ctrl+S should save and clear dirty indicator', { tag: ['@save-and-storage.browser-save', '@save-and-storage.dirty-indicator'] }, async ({ page }) => {
    await openEditor(page);

    // Make canvas dirty
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await page.locator('.piskel-name').innerText()).includes('*'));

    // Ctrl+S should save
    await page.keyboard.press(`${CMD_OR_CTRL}+s`);
    await waitFor(async () => !(await page.locator('.piskel-name').innerText()).includes('*'));

    expect(await page.locator('.piskel-name').innerText()).not.toContain('*');
  });
});

test.describe('Keyboard shortcuts — ESC', () => {

  test('ESC should close an open dialog', { tag: ['@keyboard-shortcuts.escape'] }, async ({ page }) => {
    await openEditor(page);

    // Open cheatsheet dialog
    await page.keyboard.press('?');
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();

    // ESC should close it
    await page.keyboard.press('Escape');
    await waitFor(async () => (await page.locator('#dialog-container-wrapper.show').count()) === 0);
  });

  test('ESC should close settings drawer', { tag: ['@keyboard-shortcuts.escape', '@settings.drawers'] }, async ({ page }) => {
    await openEditor(page);

    await openSaveSettingsPanel(page);
    expect(await isSettingsDrawerExpanded(page)).toBe(true);

    await page.keyboard.press('Escape');
    await waitFor(async () => !(await isSettingsDrawerExpanded(page)));

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
  });
});
