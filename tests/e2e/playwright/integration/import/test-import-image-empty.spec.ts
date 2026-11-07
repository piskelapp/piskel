import test from "@playwright/test";
import {
  assertColorRows,
  assertSpriteSize,
  browseImageFile,
  clickWizardNext,
  confirmReplacement,
  createPngFile,
  gridFromColorRows,
  openEditor,
  setPiskelFromGrid,
} from "../../testutils";

test('Test importing a simple image over an empty one', { tag: ['@import.browse-images', '@import.empty-sprite'] }, async ({ page }) => {
  // An empty sprite.
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(['.']));

  // Import an image: as the sprite is empty, the first step finishes the import,
  // without asking whether to replace or combine. Only the replacement is confirmed.
  await browseImageFile(page, await createPngFile(page, 'image.png', [
    'RG',
    'B.',
  ]));
  await confirmReplacement(page, () => clickWizardNext(page));

  // The sprite is the image.
  await assertSpriteSize(page, 2, 2);
  await assertColorRows(page, [
    'RG',
    'B.',
  ]);
});
