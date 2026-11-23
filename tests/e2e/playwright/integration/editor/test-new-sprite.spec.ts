import test, { expect } from "@playwright/test";
import {
  assertFps,
  assertFrameCount,
  assertLayerNames,
  colorToInt,
  drawAtPixel,
  expectResizeValues,
  getPixelColor,
  getPrimaryColor,
  getSecondaryColor,
  getSelectedToolId,
  openEditor,
  openEditorInNewPage,
  openResizeSettingsPanel,
  screenshotSettledCanvas,
  setDefaultSize,
  setMaxFpsPreference,
  testId,
} from "../../testutils";

test.describe('New sprite', () => {
  test('should start with the default name, layer, frame, FPS, tool and colors', { tag: ['@editor.new-sprite'] }, async ({ page }) => {
    await openEditor(page);

    // The sprite has the default name, one layer, one frame and 12 FPS.
    await expect(page.locator('.piskel-name')).toHaveText('New Piskel');
    await assertLayerNames(page, ['Layer 1']);
    await assertFrameCount(page, 1);
    await assertFps(page, 12);

    // The pen is selected, and the colors are black and transparent.
    expect(await getSelectedToolId(page)).toBe('tool-pen');
    expect(await getPrimaryColor(page)).toBe('#000000');
    expect(await getSecondaryColor(page)).toBe('rgba(0, 0, 0, 0)');

    // Once the canvas is laid out, drawing uses them: the pen draws a black pixel.
    await screenshotSettledCanvas(page);
    await drawAtPixel(page, 0, 0);
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#000000'));
  });

  test('should start at 32x32 out of the box', { tag: ['@editor.new-sprite'] }, async ({ page }) => {
    await openEditor(page);

    await openResizeSettingsPanel(page);
    await expectResizeValues(page, '32', '32');
  });

  test('should start at the default size chosen by the user', { tag: ['@editor.new-sprite', '@settings.default-size'] }, async ({ page }) => {
    // Choose a default size of 64x48.
    await openEditor(page);
    await setDefaultSize(page, '64', '48');

    // A new session starts on a new sprite of that size.
    const secondSession = await openEditorInNewPage(page);
    await expect(testId(secondSession, 'cursor-coordinates')).toContainText('[64x48]');
    await openResizeSettingsPanel(secondSession);
    await expectResizeValues(secondSession, '64', '48');

    // The rest of the new sprite is as usual.
    await expect(secondSession.locator('.piskel-name')).toHaveText('New Piskel');
    await assertLayerNames(secondSession, ['Layer 1']);
    await assertFrameCount(secondSession, 1);
    await assertFps(secondSession, 12);
  });

  test('should not inherit the FPS of the previous sprite', { tag: ['@editor.new-sprite'] }, async ({ page }) => {
    // Change the FPS of the sprite to 5.
    await openEditor(page);
    await testId(page, 'fps-slider').fill('5');
    await assertFps(page, 5);

    // A new session starts on a new sprite at 12 FPS.
    const secondSession = await openEditorInNewPage(page);
    await assertFps(secondSession, 12);
  });

  test('should start below 12 FPS when the maximum FPS is lower', { tag: ['@editor.new-sprite', '@preview.max-fps'] }, async ({ page }) => {
    // Set the maximum FPS to 5.
    await openEditor(page);
    await setMaxFpsPreference(page, 5);

    // A new session starts on a new sprite limited to 5 FPS.
    const secondSession = await openEditorInNewPage(page);
    await assertFps(secondSession, 5);
    await expect(testId(secondSession, 'fps-slider')).toHaveAttribute('max', '5');
  });
});
