import test, { expect, Page } from "@playwright/test";
import {
  CMD_OR_CTRL,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  getPrimaryColor,
  clickTool,
  drawAtPixel,
  openSaveSettingsPanel,
  isSettingsDrawerExpanded,
  waitFor,
} from "../../testutils";

test.describe('Keyboard shortcuts — zoom', () => {

  async function getZoom(page: Page): Promise<number> {
    return await page.evaluate(() =>
      window.pskl.app.drawingController.compositeRenderer.getZoom()
    );
  }

  /** Press a zoom key and wait for the zoom to change from `before`. Retries the keypress if needed. */
  async function pressZoomKey(page: Page, key: string, before: number, direction: 'up' | 'down') {
    const check = direction === 'up'
      ? async () => (await getZoom(page)) > before
      : async () => (await getZoom(page)) < before;
    // Retry the keypress up to 3 times in case it doesn't register
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.keyboard.press(key);
      try {
        await waitFor(check, { timeout: 1000, message: '' });
        return;
      } catch {
        // Key didn't register — retry
      }
    }
    throw new Error(`Zoom did not ${direction === 'up' ? 'increase' : 'decrease'} after pressing "${key}" (3 attempts)`);
  }

  test('"+" should increase zoom', async ({ page }) => {
    await openEditor(page);
    const before = await getZoom(page);
    await pressZoomKey(page, '+', before, 'up');
  });

  test('"-" should decrease zoom', async ({ page }) => {
    await openEditor(page);

    // Zoom in first — press one at a time and wait for each to take effect
    let zoom = await getZoom(page);
    for (let i = 0; i < 3; i++) {
      await pressZoomKey(page, '+', zoom, 'up');
      zoom = await getZoom(page);
    }

    await pressZoomKey(page, '-', zoom, 'down');
  });

  test('"0" should reset zoom', async ({ page }) => {
    await openEditor(page);
    const initial = await getZoom(page);

    // Zoom in — press one at a time and wait for each to take effect
    let zoom = initial;
    for (let i = 0; i < 3; i++) {
      await pressZoomKey(page, '+', zoom, 'up');
      zoom = await getZoom(page);
    }

    // Reset
    await page.keyboard.press('0');
    await waitFor(async () => Math.abs(await getZoom(page) - initial) < 1);
  });
});

test.describe('Keyboard shortcuts — palette color select', () => {

  test('"1"-"3" should select different palette colors', async ({ page }) => {
    await openEditor(page);

    // Set a grid with 3 distinct colors so the palette has entries
    await setPiskelFromGrid(page, [['R', 'G', 'B', 'T']]);
    // Draw a pixel to trigger history state save → palette refresh
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 3, 0);

    // Wait until the palette has at least 3 color swatches (async: throttled 1s + web worker)
    await waitFor(async () => {
      const count = await page.locator('.palettes-list-color').count();
      return count >= 3;
    }, { timeout: 5000, message: 'Palette did not populate with at least 3 colors' });

    // Set primary to a color NOT in the palette so pressing "1" will cause a visible change
    await setPrimaryColor(page, '#AABBCC');

    // Key "1" selects first palette color
    await page.keyboard.press('1');
    await waitFor(async () =>
      (await getPrimaryColor(page)).toLowerCase() !== '#aabbcc'
    , { timeout: 2000, message: 'Primary color did not change after pressing "1"' });
    const color1 = (await getPrimaryColor(page)).toLowerCase();

    // Key "2" selects second palette color
    await page.keyboard.press('2');
    await waitFor(async () =>
      (await getPrimaryColor(page)).toLowerCase() !== color1
    , { timeout: 2000, message: 'Primary color did not change after pressing "2"' });
    const color2 = (await getPrimaryColor(page)).toLowerCase();

    // They should be different
    expect(color1).not.toBe(color2);

    // Key "1" again should go back to first
    await page.keyboard.press('1');
    await waitFor(async () =>
      (await getPrimaryColor(page)).toLowerCase() === color1
    , { timeout: 2000, message: 'Primary color did not revert after pressing "1" again' });
  });
});

test.describe('Keyboard shortcuts — save', () => {

  test('Ctrl+S should save and clear dirty indicator', async ({ page }) => {
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

  test('ESC should close an open dialog', async ({ page }) => {
    await openEditor(page);

    // Open cheatsheet dialog
    await page.keyboard.press('?');
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();

    // ESC should close it
    await page.keyboard.press('Escape');
    await waitFor(async () => (await page.locator('#dialog-container-wrapper.show').count()) === 0);
  });

  test('ESC should close settings drawer', async ({ page }) => {
    await openEditor(page);

    await openSaveSettingsPanel(page);
    expect(await isSettingsDrawerExpanded(page)).toBe(true);

    await page.keyboard.press('Escape');
    await waitFor(async () => !(await isSettingsDrawerExpanded(page)));

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
  });
});
