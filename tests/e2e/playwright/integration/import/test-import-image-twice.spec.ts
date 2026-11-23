import test, { expect, Page } from "@playwright/test";
import {
  assertColorRows,
  assertFrameCount,
  assertSpriteSize,
  assertWizardStep,
  browseImageFile,
  clickWizardNext,
  clickWizardReplace,
  confirmReplacement,
  createPngFile,
  getLayerItems,
  gridFromColorRows,
  openEditor,
  setPiskelFromGrid,
  waitForColorsToBeListed,
} from "../../testutils";

/** Import an image, replacing the sprite */
const replaceWithImage = async (page: Page, rows: string[]) => {
  await browseImageFile(page, await createPngFile(page, 'image.png', rows));
  await clickWizardNext(page);
  await assertWizardStep(page, 'select mode');
  await confirmReplacement(page, () => clickWizardReplace(page));
};

test('Double Image import test', { tag: ['@import.browse-images', '@import.select-mode'] }, async ({ page }) => {
  // A sprite of a single red pixel.
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(['R']));
  await waitForColorsToBeListed(page);

  // Replace it with a 2x2 image.
  await replaceWithImage(page, [
    'RG',
    'B.',
  ]);
  await assertSpriteSize(page, 2, 2);
  await expect(getLayerItems(page)).toHaveCount(1);
  await assertFrameCount(page, 1);
  await assertColorRows(page, [
    'RG',
    'B.',
  ]);

  // The wizard works again: replace it with a 1x1 image.
  await replaceWithImage(page, ['B']);
  await assertSpriteSize(page, 1, 1);
  await expect(getLayerItems(page)).toHaveCount(1);
  await assertFrameCount(page, 1);
  await assertColorRows(page, ['B']);
});
