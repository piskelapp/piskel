import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  assertFrameCount,
  assertNoDialogOpen,
  assertSpriteSize,
  assertWizardStep,
  browseImageFile,
  clickWizardCombine,
  clickWizardNext,
  createPngFile,
  getLayerItems,
  gridFromColorRows,
  openEditor,
  selectInsertMode,
  setPiskelFromGrid,
  waitForColorsToBeListed,
} from "../../testutils";

test('Test importing a simple image', { tag: ['@import.browse-images', '@import.select-mode', '@import.adjust-size', '@import.insert-location', '@import.combine-layers'] }, async ({ page }) => {
  // A sprite of a single red pixel, smaller than the image combined with it.
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(['R']));
  await waitForColorsToBeListed(page);

  // Import a 2x2 image, as a single image by default.
  await browseImageFile(page, await createPngFile(page, 'image.png', [
    'RG',
    'B.',
  ]));
  await expect(page.locator('input[name="import-type"][value="single"]')).toBeChecked();
  await clickWizardNext(page);

  // Combine it with the sprite: the next steps adjust the size and pick where to insert.
  await assertWizardStep(page, 'select mode');
  await clickWizardCombine(page);
  await assertWizardStep(page, 'adjust size');
  await clickWizardNext(page);
  await assertWizardStep(page, 'insert location');
  await selectInsertMode(page, 'insert');
  await clickWizardNext(page);
  await assertNoDialogOpen(page);

  // The sprite grew to the image, which is on a new layer, in the existing frame.
  await assertSpriteSize(page, 2, 2);
  await expect(getLayerItems(page)).toHaveCount(2);
  await assertFrameCount(page, 1);
  await assertColorRows(page, [
    'R.',
    '..',
  ], { layerIndex: 0 });
  await assertColorRows(page, [
    'RG',
    'B.',
  ], { layerIndex: 1 });
});
