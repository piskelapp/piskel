import test from "@playwright/test";
import {
  assertColorRows,
  clickTool,
  drawAtPixel,
  gridFromColorRows,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
} from "../../testutils";

test.describe('Paint bucket tool', () => {

  test('paint bucket: fills connected transparent area', { tag: ['@drawing-tools.paint-bucket'] }, async ({ page }) => {
    // A red square, transparent inside and outside.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      '..........',
      '.RRRRRR...',
      '.R....R...',
      '.R....R...',
      '.R....R...',
      '.R....R...',
      '.RRRRRR...',
      '..........',
      '..........',
      '..........',
    ]));

    // Fill the inside with blue.
    await clickTool(page, 'tool-paint-bucket');
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 3, 3);

    // Only the inside is filled: the square stops the fill.
    await assertColorRows(page, [
      '..........',
      '.RRRRRR...',
      '.RBBBBR...',
      '.RBBBBR...',
      '.RBBBBR...',
      '.RBBBBR...',
      '.RRRRRR...',
      '..........',
      '..........',
      '..........',
    ]);
  });

  test('paint bucket: does not spread to diagonal pixels', { tag: ['@drawing-tools.paint-bucket'] }, async ({ page }) => {
    // A transparent area inside a red frame. The transparent pixel at (3,3) only
    // touches it by a corner.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RRRR......',
      'R..R......',
      'R..R......',
      'RRR.R.....',
      '...R......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));

    // Fill the area with green.
    await clickTool(page, 'tool-paint-bucket');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);

    // The fill stops at the frame: the pixel at (3,3) and the outside stay transparent.
    await assertColorRows(page, [
      'RRRR......',
      'RGGR......',
      'RGGR......',
      'RRR.R.....',
      '...R......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });
});
