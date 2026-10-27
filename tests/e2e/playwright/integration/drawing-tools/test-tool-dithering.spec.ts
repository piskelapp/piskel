import test, { expect } from "@playwright/test";
import {
  clickTool,
  drawAtPixel,
  getPixelColor,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
  setSecondaryColor,
  TRANSPARENT,
} from "../../testutils";

/** Create an NxN transparent TestGrid */
function emptyTestGrid(size = 10): ("T")[][] {
  return Array.from({ length: size }, () => Array(size).fill('T') as ("T")[]);
}

test.describe('Dithering tool', () => {

  test('dithering tool: draws checkerboard pattern', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, emptyTestGrid());

    await clickTool(page, 'tool-dithering');
    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');

    // Draw a 4x4 area
    for (let y = 3; y <= 6; y++) {
      for (let x = 3; x <= 6; x++) {
        await drawAtPixel(page, x, y);
      }
    }

    // Verify checkerboard: alternating colors based on (col+row)%2
    const p33 = await getPixelColor(page, 3, 3);
    const p43 = await getPixelColor(page, 4, 3);
    const p34 = await getPixelColor(page, 3, 4);
    const p44 = await getPixelColor(page, 4, 4);

    // Diagonal pixels match, adjacent differ
    expect(p33).toBe(p44);
    expect(p43).toBe(p34);
    expect(p33).not.toBe(p43);

    // All are non-transparent
    expect(p33).not.toBe(TRANSPARENT);
    expect(p43).not.toBe(TRANSPARENT);
  });
});
