import test, { expect, Page } from "@playwright/test";
import {
  assertFps,
  assertPreviewAreaSize,
  assertPreviewImageWidth,
  assertPreviewSizesDisabled,
  assertPreviewSizesOffered,
  assertSelectedPreviewSize,
  countRedPixelsInPreview,
  createThreeFrames,
  downloadPiskelFile,
  dragOnPreview,
  getOnionSkinPixel,
  getPixelScreenPosition,
  gridFromRows,
  openEditor,
  openEditorInNewPage,
  readFpsFromPiskelFile,
  selectFrame,
  setMaxFpsPreference,
  setPiskelFromGrid,
  setTileMode,
  testId,
  wait,
  waitFor,
  zoomInUntilMinimapVisible,
} from "../../testutils";

/** Replace the sprite with an empty one of this size */
const createEmptySprite = async (page: Page, width: number, height: number) => {
  const rows = Array.from({ length: height }, () => '.'.repeat(width));
  await setPiskelFromGrid(page, gridFromRows(rows));
};

test.describe('Preview size options', () => {
  // The preview area is a square of 200 pixels.

  test('should only offer Full for a sprite larger than the preview area', { tag: ['@preview.size-options'] }, async ({ page }) => {
    await openEditor(page);
    await createEmptySprite(page, 300, 300);

    await assertPreviewSizesOffered(page, ['Full']);
    await assertSelectedPreviewSize(page, 'Full');
    await assertPreviewSizesDisabled(page, true);

    // The sprite is scaled down to fit in the preview area.
    await assertPreviewImageWidth(page, 200);
  });

  test('should only offer 1x for a sprite of the size of the preview area', { tag: ['@preview.size-options'] }, async ({ page }) => {
    await openEditor(page);
    await createEmptySprite(page, 200, 200);

    await assertPreviewSizesOffered(page, ['1x']);
    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewSizesDisabled(page, true);
  });

  test('should offer 1x and the exact zoom when the sprite fits exactly', { tag: ['@preview.size-options'] }, async ({ page }) => {
    await openEditor(page);
    await createEmptySprite(page, 100, 100);

    await assertPreviewSizesOffered(page, ['1x', '2x']);
    await assertPreviewSizesDisabled(page, false);
  });

  test('should offer 1x and Full when the best zoom would be 1x', { tag: ['@preview.size-options'] }, async ({ page }) => {
    await openEditor(page);
    await createEmptySprite(page, 150, 150);

    await assertPreviewSizesOffered(page, ['1x', 'Full']);
    await assertPreviewSizesDisabled(page, false);
  });

  test('should offer all sizes otherwise', { tag: ['@preview.size-options'] }, async ({ page }) => {
    await openEditor(page);
    await createEmptySprite(page, 64, 64);

    await assertPreviewSizesOffered(page, ['1x', '3x', 'Full']);
    await assertPreviewSizesDisabled(page, false);
  });

  test('should leave a size that is no longer offered', { tag: ['@preview.size-options'] }, async ({ page }) => {
    // Select Full on a sprite that offers it.
    await openEditor(page);
    await createEmptySprite(page, 64, 64);
    await page.keyboard.press('Alt+3');
    await assertSelectedPreviewSize(page, 'Full');

    // Change to a sprite that doesn't offer it.
    await createEmptySprite(page, 100, 100);
    await assertPreviewSizesOffered(page, ['1x', '2x']);
    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewImageWidth(page, 100);

    // Its shortcut does nothing now.
    await page.keyboard.press('Alt+3');
    await wait(100);
    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewImageWidth(page, 100);
  });
});

test.describe('Preview settings across sessions', () => {
  test('should remember the preview size', { tag: ['@preview.saved'] }, async ({ page }) => {
    // Select Full on the default sprite of 32 pixels.
    await openEditor(page);
    await page.keyboard.press('Alt+3');
    await assertSelectedPreviewSize(page, 'Full');
    await assertPreviewImageWidth(page, 200);

    // A new session uses it too.
    const secondSession = await openEditorInNewPage(page);
    await assertSelectedPreviewSize(secondSession, 'Full');
    await assertPreviewImageWidth(secondSession, 200);
  });

  test('should remember the onion skin', { tag: ['@preview.saved'] }, async ({ page }) => {
    // Turn the onion skin on.
    await openEditor(page);
    await testId(page, 'onion-skin-toggle-button').click();
    await expect(testId(page, 'onion-skin-toggle-button')).toHaveClass(/preview-toggle-onion-skin-enabled/);

    // A new session has it on too.
    const secondSession = await openEditorInNewPage(page);
    await expect(testId(secondSession, 'onion-skin-toggle-button')).toHaveClass(/preview-toggle-onion-skin-enabled/);

    // From the middle frame, the canvas shows the previous and next frames.
    await createThreeFrames(secondSession);
    await selectFrame(secondSession, 1);
    await waitFor(async () => (await getOnionSkinPixel(secondSession, 0, 0)).a > 0);
    await waitFor(async () => (await getOnionSkinPixel(secondSession, 2, 0)).a > 0);
    expect((await getOnionSkinPixel(secondSession, 1, 0)).a).toBe(0);
  });
});

test.describe('Preview in tile mode', () => {
  test('should repeat the sprite in a fixed square and disable the sizes', { tag: ['@preview.tile-mode'] }, async ({ page }) => {
    // Start from a sprite of 4x2 with one red pixel, at its best zoom.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(['X...', '....']));
    await assertPreviewSizesOffered(page, ['1x', '50x']);
    await page.keyboard.press('Alt+2');
    await assertSelectedPreviewSize(page, '50x');
    await assertPreviewAreaSize(page, 200, 100);

    // Enable tile mode: only 1x remains, and the sizes are disabled.
    await setTileMode(page, true);
    await assertPreviewSizesOffered(page, ['1x']);
    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewSizesDisabled(page, true);

    // The area of 200x200 holds 50x100 copies of the sprite, so 5000 red pixels.
    await assertPreviewAreaSize(page, 200, 200);
    await expect.poll(() => countRedPixelsInPreview(page)).toBe(5000);

    // Disable tile mode: the sprite shows once, and the sizes are back.
    await setTileMode(page, false);
    await assertPreviewSizesOffered(page, ['1x', '50x']);
    await assertPreviewSizesDisabled(page, false);
    await assertPreviewAreaSize(page, 200, 100);
    await expect.poll(() => countRedPixelsInPreview(page)).toBe(1);
  });
});

test.describe('Maximum FPS preference', () => {
  test('should lower the FPS of the sprite when set below it', { tag: ['@preview.max-fps'] }, async ({ page }) => {
    // New sprites play at 12 FPS.
    await openEditor(page);
    await assertFps(page, 12);

    // Lower the maximum below it: the FPS follows, and so does the slider's limit.
    await setMaxFpsPreference(page, 5);
    await assertFps(page, 5);
    await expect(testId(page, 'fps-slider')).toHaveAttribute('max', '5');

    // The sprite itself changed, not only the display.
    expect(await readFpsFromPiskelFile(await downloadPiskelFile(page))).toBe(5);
  });

  test('should keep the FPS of the sprite when set above it', { tag: ['@preview.max-fps'] }, async ({ page }) => {
    await openEditor(page);
    await assertFps(page, 12);

    // The limit of the slider changes, but not the FPS.
    await setMaxFpsPreference(page, 20);
    await expect(testId(page, 'fps-slider')).toHaveAttribute('max', '20');
    await assertFps(page, 12);
  });
});

test.describe('Dragging on the preview', () => {
  test('should pan the canvas while the minimap is shown', { tag: ['@preview.minimap-drag'] }, async ({ page }) => {
    // Zoom in on the canvas until the minimap shows.
    await openEditor(page);
    const minimap = page.locator('.minimap-crop-frame');
    await zoomInUntilMinimapVisible(page, minimap);
    const positionBefore = await getPixelScreenPosition(page, 0, 0);

    // Drag from the center of the preview area towards its top left.
    await dragOnPreview(page, { x: 100, y: 100 }, { x: 60, y: 60 });

    // The canvas panned towards the top left of the sprite, so that pixel moved
    // right and down on the screen.
    const positionAfter = await getPixelScreenPosition(page, 0, 0);
    expect(positionAfter.x).toBeGreaterThan(positionBefore.x);
    expect(positionAfter.y).toBeGreaterThan(positionBefore.y);

    // The mouse is released: moving it no longer pans.
    await page.mouse.move(600, 400);
    expect(await getPixelScreenPosition(page, 0, 0)).toEqual(positionAfter);
  });
});
