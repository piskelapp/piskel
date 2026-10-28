import test, { expect } from "@playwright/test";
import {
  CMD_OR_CTRL,
  clickTool,
  drawAtPixel,
  getPixelColor,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  wait,
  TRANSPARENT,
} from "../../testutils";

test.describe('Lighten tool', () => {

  test('lighten tool: modifies pixel brightness', async ({ page }) => {
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

// ─── Lighten tool modifiers ──────────────────────────────────────

test.describe('Lighten tool modifiers', () => {

  test('Lighten should make a pixel lighter', async ({ page }) => {
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

  test('Lighten + Ctrl should darken a pixel', async ({ page }) => {
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
