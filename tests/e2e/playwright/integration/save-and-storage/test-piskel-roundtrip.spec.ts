import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  assertFrameCount,
  getLayerItems,
  assertSpriteSize,
  downloadPiskelFile,
  gridFromColorRows,
  importPiskelFile,
  openEditor,
  setPiskelFromGrid,
} from "../../testutils";

/** A 10x10 sprite with a red, a green and a blue pixel */
const SPRITE = [
  'RG........',
  'B.........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('.piskel round-trip', () => {

  test('should save and re-import a .piskel file with identical content', { tag: ['@save-and-storage.piskel-file'] }, async ({ page }) => {
    // Save a sprite to a .piskel file.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(SPRITE));
    await assertColorRows(page, SPRITE);
    const piskelPath = await downloadPiskelFile(page);
    expect(piskelPath).toMatch(/\.piskel$/);

    // Replace it with a smaller empty sprite.
    await setPiskelFromGrid(page, gridFromColorRows([
      '....',
      '....',
      '....',
      '....',
    ]));
    await assertSpriteSize(page, 4, 4);

    // Import the file: the sprite is back, with its size, its only frame and layer,
    // and its colors.
    await importPiskelFile(page, piskelPath);
    await assertSpriteSize(page, 10, 10);
    await assertFrameCount(page, 1);
    await expect(getLayerItems(page)).toHaveCount(1);
    await assertColorRows(page, SPRITE);
  });
});
