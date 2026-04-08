import test, { expect, Page, Locator } from '../../fixtures';
import { openEditor, openSaveSettingsPanel, setPiskelFromGrid, testId, wait, waitFor, decodePngDataUrl } from "../../testutils";

// ─── Shared helpers ──────────────────────────────────────────────

/** Hover on the preview area to reveal the contextual action buttons */
async function showPreviewActions(page: Page) {
  await page.locator('.minimap-container').hover();
  await expect(page.locator('.preview-contextual-actions')).toBeVisible();
}

/** Get the currently selected preview size from the DOM (.size-button-selected) */
async function getSelectedPreviewSize(page: Page): Promise<string> {
  return await page.evaluate(() => {
    return window.pskl.UserSettings.get(window.pskl.UserSettings.PREVIEW_SIZE) as string;
  });
}

/** Zoom in by scrolling on the canvas until the minimap appears */
async function zoomInUntilMinimapVisible(page: Page, minimap: Locator) {
  const canvas = page.locator('#drawing-canvas-container');
  await canvas.hover();

  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(30);
  }

  await waitFor(async () => (await minimap.isVisible()));
}

// ─── Preview actions ─────────────────────────────────────────────

test.describe('Preview actions', () => {

  // ─── Size buttons ──────────────────────────────────────────────

  test('should default to "original" preview size', async ({ page }) => {
    await openEditor(page);

    const size = await getSelectedPreviewSize(page);
    expect(size).toBe('original');

    await showPreviewActions(page);
    await expect(testId(page, 'preview-size-1x')).toHaveClass(/size-button-selected/);
  });

  test('clicking 1x button should select original size', async ({ page }) => {
    await openEditor(page);
    await showPreviewActions(page);

    // Hover the dropdown to reveal size buttons
    await page.locator('.preview-drop-down').hover();
    await wait(300);

    const btn1x = testId(page, 'preview-size-1x');
    if (await btn1x.isVisible()) {
      await btn1x.click();
      await waitFor(async () => (await getSelectedPreviewSize(page)) === 'original');
      expect(await getSelectedPreviewSize(page)).toBe('original');
      await showPreviewActions(page);
      await expect(btn1x).toHaveClass(/size-button-selected/);
    }
  });

  test('clicking Full button should select full size', async ({ page }) => {
    await openEditor(page);
    await showPreviewActions(page);

    // Hover the dropdown to reveal size buttons
    await page.locator('.preview-drop-down').hover();
    await wait(300);

    const btnFull = testId(page, 'preview-size-full');
    if (await btnFull.isVisible()) {
      await btnFull.click();
      await waitFor(async () => (await getSelectedPreviewSize(page)) === 'full');
      expect(await getSelectedPreviewSize(page)).toBe('full');
      await showPreviewActions(page);
      await expect(btnFull).toHaveClass(/size-button-selected/);
    }
  });

  test('Alt+1 shortcut should select original size', async ({ page }) => {
    await openEditor(page);

    await page.keyboard.press('Alt+1');
    await waitFor(async () => (await getSelectedPreviewSize(page)) === 'original');
    expect(await getSelectedPreviewSize(page)).toBe('original');
  });

  test('Alt+2 shortcut should select best size', async ({ page }) => {
    await openEditor(page);

    // Default is original, switch to best
    expect(await getSelectedPreviewSize(page)).toBe('original');
    await page.keyboard.press('Alt+2');
    await waitFor(async () => (await getSelectedPreviewSize(page)) === 'best');
    expect(await getSelectedPreviewSize(page)).toBe('best');
  });

  test('Alt+3 shortcut should select full size', async ({ page }) => {
    await openEditor(page);

    await page.keyboard.press('Alt+3');
    await waitFor(async () => (await getSelectedPreviewSize(page)) === 'full');
    expect(await getSelectedPreviewSize(page)).toBe('full');
  });

  // ─── Grid toggle shortcut ─────────────────────────────────────

  test('Alt+G shortcut should toggle grid', async ({ page }) => {
    await openEditor(page);

    const gridButton = testId(page, 'grid-toggle-button');

    // Grid is off by default
    await expect(gridButton).toHaveClass(/icon-minimap-grid-white/);
    await expect(gridButton).not.toHaveClass(/icon-minimap-grid-gold/);

    // Toggle on with Alt+G
    await page.keyboard.press('Alt+g');
    await waitFor(async () => {
      const cls = await gridButton.getAttribute('class') ?? '';
      return cls.includes('icon-minimap-grid-gold');
    });
    await expect(gridButton).toHaveClass(/icon-minimap-grid-gold/);
    await expect(gridButton).not.toHaveClass(/icon-minimap-grid-white/);

    // Toggle off with Alt+G
    await page.keyboard.press('Alt+g');
    await waitFor(async () => {
      const cls = await gridButton.getAttribute('class') ?? '';
      return cls.includes('icon-minimap-grid-white');
    });
    await expect(gridButton).toHaveClass(/icon-minimap-grid-white/);
    await expect(gridButton).not.toHaveClass(/icon-minimap-grid-gold/);
  });

  // ─── Popup preview ────────────────────────────────────────────

  test('open preview in popup should open a new window with rendered preview', async ({ page, context }) => {
    await openEditor(page);
    await showPreviewActions(page);

    const popupBtn = testId(page, 'open-popup-preview-button');
    await expect(popupBtn).toBeVisible();

    // Listen for new page (popup window)
    const popupPromise = context.waitForEvent('page');
    await popupBtn.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();

    // Popup should contain a preview canvas container
    await expect(popup.locator('.preview-container')).toBeAttached();

    // The rendered preview should have a background-image with a base64 PNG data URI
    const bgContainer = popup.locator('.background-image-frame-container');
    await expect(bgContainer).toBeAttached();
    await waitFor(async () => {
      const bg = await bgContainer.evaluate(el => getComputedStyle(el).backgroundImage);
      return bg.includes('data:image/png;base64,');
    });
    const bgImage = await bgContainer.evaluate(el => getComputedStyle(el).backgroundImage);
    expect(bgImage).toContain('data:image/png;base64,');

    await popup.close();
  });

  test('popup preview should render known pattern as base64 PNG', async ({ page, context }) => {
    await openEditor(page);

    // Set a known 4x4 L-shape pattern
    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['R', 'T', 'T', 'T'],
      ['R', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await wait(500);

    await showPreviewActions(page);
    const popupPromise = context.waitForEvent('page');
    await testId(page, 'open-popup-preview-button').click();
    const popup = await popupPromise;
    await popup.waitForLoadState();

    const bgContainer = popup.locator('.background-image-frame-container');
    await waitFor(async () => {
      const bg = await bgContainer.evaluate(el => getComputedStyle(el).backgroundImage);
      return bg.includes('data:image/png;base64,');
    });

    // Extract base64 and decode PNG IHDR to verify pixel dimensions
    const bgImage = await bgContainer.evaluate(el => getComputedStyle(el).backgroundImage);
    const match = bgImage.match(/url\("data:image\/png;base64,([^"]+)"\)/);
    expect(match).not.toBeNull();

    const pngDims = await popup.evaluate((b64: string) => {
      const binary = atob(b64);
      // PNG IHDR chunk: bytes 16-19 = width, 20-23 = height (big-endian)
      const width = (binary.charCodeAt(16) << 24) | (binary.charCodeAt(17) << 16) |
                    (binary.charCodeAt(18) << 8) | binary.charCodeAt(19);
      const height = (binary.charCodeAt(20) << 24) | (binary.charCodeAt(21) << 16) |
                     (binary.charCodeAt(22) << 8) | binary.charCodeAt(23);
      return { width, height };
    }, match![1]);

    // Popup renders at zoom to fill ~320px window — 4x4 sprite scaled up, dimensions should be square
    expect(pngDims.width).toBeGreaterThan(4);
    expect(pngDims.height).toBeGreaterThan(4);
    expect(pngDims.width).toBe(pngDims.height);

    await popup.close();
  });

  // ─── Base64 rendering ─────────────────────────────────────────

  test('main preview at 1x should render frame as base64 PNG background-image', async ({ page }) => {
    await openEditor(page);

    // Set a known 4x4 L-shape pattern and wait for preview to update
    await setPiskelFromGrid(page, [
      ['R', 'T', 'T', 'T'],
      ['R', 'T', 'T', 'T'],
      ['R', 'R', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await wait(500);

    // Switch to 1x (original) to get native-resolution PNG
    await page.keyboard.press('Alt+1');
    await waitFor(async () => (await getSelectedPreviewSize(page)) === 'original');
    await wait(500);

    // Wait for the preview to render
    const bgContainer = page.locator('#animated-preview-container .background-image-frame-container');
    await waitFor(async () => {
      const bg = await bgContainer.evaluate(el => getComputedStyle(el).backgroundImage);
      return bg.includes('data:image/png;base64,');
    });

    const bgImage = await bgContainer.evaluate(el => getComputedStyle(el).backgroundImage);
    const dataUrl = bgImage.slice(5, -2); // strip url(" and ")
    const pixels = await decodePngDataUrl(page, dataUrl);

    expect(pixels.width).toBe(4);
    expect(pixels.height).toBe(4);

    // L-shape: col 0 rows 0-2 are red, (1,2) is red, rest transparent
    const R = [255, 0, 0, 255];
    const T = [0, 0, 0, 0];
    const expectedPixels = [
      R, T, T, T,
      R, T, T, T,
      R, R, T, T,
      T, T, T, T,
    ];
    expectedPixels.forEach((expected, i) => {
      expect(pixels.pixels[i]).toEqual(expected);
    });
  });
});

// ─── Animation preview (FPS) ─────────────────────────────────────

const getFPS = async (page: Page): Promise<number> => {
  const text = await testId(page, 'fps-display').innerText();
  return parseInt(text, 10);
};

test.describe('Animation preview', () => {

  test('should display default FPS on load', async ({ page }) => {
    await openEditor(page);

    const fps = await getFPS(page);
    expect(fps).toBe(12); // default FPS
  });

  test('should change FPS via slider', async ({ page }) => {
    await openEditor(page);

    const slider = testId(page, 'fps-slider');
    // Set FPS to 5 by filling the range input
    await slider.fill('5');
    await slider.dispatchEvent('change');

    await expect.poll(() => getFPS(page), { timeout: 5000 }).toBe(5);
  });

  test('should pause animation when FPS is set to 0', async ({ page }) => {
    await openEditor(page);

    const slider = testId(page, 'fps-slider');
    await slider.fill('0');
    await slider.dispatchEvent('change');

    await expect.poll(() => getFPS(page), { timeout: 5000 }).toBe(0);
    // FPS display should show "0 FPS"
    await expect(testId(page, 'fps-display')).toContainText('0');
  });

  test('should set FPS to max value', async ({ page }) => {
    await openEditor(page);

    const slider = testId(page, 'fps-slider');
    await slider.fill('24');
    await slider.dispatchEvent('change');

    await expect.poll(() => getFPS(page), { timeout: 5000 }).toBe(24);
  });

  test('FPS value should be saved in exported .piskel file', async ({ page }) => {
    await openEditor(page);

    // Set a non-default FPS
    const slider = testId(page, 'fps-slider');
    await slider.fill('7');
    await slider.dispatchEvent('change');
    await expect.poll(() => getFPS(page), { timeout: 5000 }).toBe(7);

    // Save as .piskel file
    await openSaveSettingsPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'save-file-download-button').click();
    const download = await downloadPromise;

    const downloadPath = await download.path();
    if (!downloadPath) throw new Error('Download path is null');

    // Read and parse the .piskel file (it's JSON)
    const fs = await import('fs/promises');
    const content = await fs.readFile(downloadPath, 'utf-8');
    const piskelData = JSON.parse(content);

    expect(piskelData.piskel.fps).toBe(7);
  });
});

// ─── Minimap ─────────────────────────────────────────────────────

test.describe('Minimap', () => {

  test('should not show minimap at default zoom', async ({ page }) => {
    await openEditor(page);

    const minimap = page.locator('.minimap-crop-frame');
    await expect(minimap).toBeHidden();
  });

  test('should show minimap when zoomed in via scroll wheel', async ({ page }) => {
    await openEditor(page);

    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);
  });

  test('panning right should increase minimap x position', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    const before = await minimap.boundingBox();
    expect(before).not.toBeNull();

    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');

    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.x > before!.x;
    });

    const after = await minimap.boundingBox();
    expect(after!.x).toBeGreaterThan(before!.x);
  });

  test('panning left should decrease minimap x position', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    // First pan right to have room to pan left
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.x > 0;
    });

    const before = await minimap.boundingBox();
    expect(before).not.toBeNull();

    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');
    await page.keyboard.press('Shift+ArrowLeft');

    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.x < before!.x;
    });

    const after = await minimap.boundingBox();
    expect(after!.x).toBeLessThan(before!.x);
  });

  test('panning down should increase minimap y position', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    const before = await minimap.boundingBox();
    expect(before).not.toBeNull();

    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');

    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.y > before!.y;
    });

    const after = await minimap.boundingBox();
    expect(after!.y).toBeGreaterThan(before!.y);
  });

  test('panning up should decrease minimap y position', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    // First pan down to have room to pan up
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.y > 0;
    });

    const before = await minimap.boundingBox();
    expect(before).not.toBeNull();

    await page.keyboard.press('Shift+ArrowUp');
    await page.keyboard.press('Shift+ArrowUp');
    await page.keyboard.press('Shift+ArrowUp');

    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.y < before!.y;
    });

    const after = await minimap.boundingBox();
    expect(after!.y).toBeLessThan(before!.y);
  });

  test('zooming in more should keep minimap visible and still responsive to pan', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    // Zoom in even more
    const canvas = page.locator('#drawing-canvas-container');
    await canvas.hover();
    for (let i = 0; i < 15; i++) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(30);
    }

    // Minimap should still be visible at higher zoom
    await waitFor(async () => (await minimap.isVisible()));

    // And still responds to panning
    const before = await minimap.boundingBox();
    expect(before).not.toBeNull();

    await page.keyboard.press('Shift+ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');

    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && pos.x > before!.x;
    });

    const after = await minimap.boundingBox();
    expect(after!.x).toBeGreaterThan(before!.x);
  });

  test('zooming out partially should grow minimap width or height', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    // Zoom in even more so we have room to zoom out
    const canvas = page.locator('#drawing-canvas-container');
    await canvas.hover();
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -120);
      await page.waitForTimeout(30);
    }
    await waitFor(async () => (await minimap.isVisible()));

    const before = await minimap.boundingBox();
    expect(before).not.toBeNull();

    // Zoom out a bit
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(30);
    }

    await waitFor(async () => {
      const pos = await minimap.boundingBox();
      return pos !== null && (pos.width >= before!.width || pos.height >= before!.height);
    });

    const after = await minimap.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.width).toBeGreaterThanOrEqual(before!.width);
    expect(after!.height).toBeGreaterThanOrEqual(before!.height);
  });

  test('zooming out fully should hide the minimap', async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);

    // Reset zoom with 0 key
    await page.keyboard.press('0');

    await waitFor(async () => !(await minimap.isVisible()));
    await expect(minimap).toBeHidden();
  });
});
