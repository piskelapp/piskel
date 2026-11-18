import test from "@playwright/test";
import {
  assertColorRows,
  assertFrameCount,
  assertLayerNames,
  assertSpriteSize,
  downloadPiskelFile,
  getAddFrameButton,
  getAddLayerButton,
  gridFromColorRows,
  importPiskelFile,
  openEditor,
  renameCurrentLayer,
  setPiskelFromGrid,
} from "../../testutils";

/** A 10x10 sprite with two red pixels on a diagonal */
const RED_DIAGONAL = [
  'R.........',
  '.R........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

test.describe('.piskel import', () => {

  test('should import a .piskel file with multiple layers', { tag: ['@import.browse-piskel', '@import.select-mode'] }, async ({ page }) => {
    // A sprite with two layers, the top one renamed.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_DIAGONAL));
    await getAddLayerButton(page).click();
    await renameCurrentLayer(page, 'Top Layer');
    await assertLayerNames(page, ['Top Layer', 'Base layer']);

    // Save it, and replace it with a sprite of one layer.
    const piskelPath = await downloadPiskelFile(page);
    await setPiskelFromGrid(page, gridFromColorRows(['.']));
    await assertLayerNames(page, ['Base layer']);

    // Import the file: both layers are back, with their names and pixels.
    await importPiskelFile(page, piskelPath);
    await assertLayerNames(page, ['Top Layer', 'Base layer']);
    await assertSpriteSize(page, 10, 10);
    await assertColorRows(page, RED_DIAGONAL, { layerIndex: 0 });
  });

  test('should import a .piskel file with multiple frames', { tag: ['@import.browse-piskel', '@import.select-mode'] }, async ({ page }) => {
    // A sprite with three frames.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RED_DIAGONAL));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);

    // Save it, and replace it with a sprite of one frame.
    const piskelPath = await downloadPiskelFile(page);
    await setPiskelFromGrid(page, gridFromColorRows(['.']));
    await assertFrameCount(page, 1);

    // Import the file: the three frames are back.
    await importPiskelFile(page, piskelPath);
    await assertFrameCount(page, 3);
    await assertSpriteSize(page, 10, 10);
    await assertColorRows(page, RED_DIAGONAL, { frameIndex: 0 });
  });
});
