import test, { expect, Page } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  colorToInt,
  dragThereAndBack,
  drawAtPixel,
  getPixelColor,
  gridFromRows,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  wait,
  waitForGrid,
  TRANSPARENT,
} from "../../testutils";

test.describe('Lighten tool', () => {

  test('lighten tool: modifies pixel brightness', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditor(page);

    // Start with a medium gray pixel
    await setPiskelFromGrid(page, [
      ["T", "T", "T", "T"],
      ["T", "R", "R", "T"],
      ["T", "R", "R", "T"],
      ["T", "T", "T", "T"],
    ]);

    const originalColor = await getPixelColor(page, 1, 1);

    // Click lighten tool on the red pixel
    await clickTool(page, 'tool-lighten');
    await drawAtPixel(page, 1, 1);

    // The pixel should have changed (lightened)
    const lightenedColor = await getPixelColor(page, 1, 1);
    expect(lightenedColor).not.toBe(originalColor);
    expect(lightenedColor).not.toBe(TRANSPARENT);

    // Neighbouring pixels should be unchanged
    expect(await getPixelColor(page, 2, 1)).toBe(originalColor);
  });
});

test.describe('Lighten steps', () => {
  /** Open the editor on a red row, with the lighten tool */
  const openEditorWithLighten = async (page: Page) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(['XXXX', '....']));
    await waitForGrid(page, 4, 2, ['XXXX', '....']);
    await clickTool(page, 'tool-lighten');
  };

  // Lightness is 50% for red. A click adds 3 points, or 6 with shift.
  const RED = colorToInt('#FF0000');

  test('should keep lightening with repeated passes', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditorWithLighten(page);

    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0F0F'));

    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF1E1E'));
  });

  test('should lighten once per pixel with shift, with a stronger step', { tag: ['@drawing-tools.lighten-once'] }, async ({ page }) => {
    await openEditorWithLighten(page);

    // Shift applies the lighten only once per pixel. Go over the pixels twice.
    await page.keyboard.down('Shift');
    await dragThereAndBack(page, 0, 0, 2, 0);
    await page.keyboard.up('Shift');

    // Each pixel went up by one strong step, and the last pixel wasn't touched.
    const LIGHTENED = colorToInt('#FF1F1F');
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(LIGHTENED);
    expect(await getPixelColor(page, 1, 0)).toBe(LIGHTENED);
    expect(await getPixelColor(page, 2, 0)).toBe(LIGHTENED);
    expect(await getPixelColor(page, 3, 0)).toBe(RED);
  });

  test('should apply again with shift in a new stroke', { tag: ['@drawing-tools.lighten-once'] }, async ({ page }) => {
    await openEditorWithLighten(page);

    // Shift applies the lighten only once per pixel, for each stroke.
    await page.keyboard.down('Shift');
    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF1F1F'));

    await drawAtPixel(page, 0, 0);
    await expect.poll(() => getPixelColor(page, 0, 0)).toBe(colorToInt('#FF3E3E'));
    await page.keyboard.up('Shift');
  });
});

// ─── Lighten tool modifiers ──────────────────────────────────────

test.describe('Lighten tool modifiers', () => {

  test('Lighten should make a pixel lighter', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await setPrimaryColor(page, '#808080');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await wait(200);

    const before = await getPixelColor(page, 1, 1);

    await clickTool(page, 'tool-lighten');
    await drawAtPixel(page, 1, 1);
    await wait(200);

    const after = await getPixelColor(page, 1, 1);
    expect(after).not.toBe(before);
    expect(after).not.toBe(TRANSPARENT);

    const rBefore = before & 0xFF;
    const rAfter = after & 0xFF;
    expect(rAfter).toBeGreaterThan(rBefore);
  });

  test('Lighten + Ctrl should darken a pixel', { tag: ['@drawing-tools.lighten'] }, async ({ page }) => {
    await openEditor(page);

    await setPiskelFromGrid(page, [
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
      ['T', 'T', 'T', 'T'],
    ]);
    await setPrimaryColor(page, '#808080');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await wait(200);

    const before = await getPixelColor(page, 1, 1);

    await clickTool(page, 'tool-lighten');
    await page.keyboard.down(CMD_OR_CTRL);
    await drawAtPixel(page, 1, 1);
    await page.keyboard.up(CMD_OR_CTRL);
    await wait(200);

    const after = await getPixelColor(page, 1, 1);
    expect(after).not.toBe(before);
    expect(after).not.toBe(TRANSPARENT);

    const rBefore = before & 0xFF;
    const rAfter = after & 0xFF;
    expect(rAfter).toBeLessThan(rBefore);
  });
});
