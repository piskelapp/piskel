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
  downloadPiskelFile,
  getWizardField,
  gridFromColorRows,
  importPiskelFile,
  openEditor,
  selectImportType,
  setPiskelFromGrid,
  typeInWizardField,
  waitForColorsToBeListed,
} from "../../testutils";

// The images are small, so that their frames read at a glance.

/** A 10x10 sprite with a red pixel, which the imports replace */
const RED_PIXEL = [
  'R.........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

/** A 2x2 sprite with a red, a green and a blue pixel */
const RGB_SPRITE = [
  'RG',
  'B.',
];

/** Open the editor on a sprite with a red pixel */
const openEditorWithRedPixel = async (page: Page) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows(RED_PIXEL));
  await waitForColorsToBeListed(page);
};

/** Go from the image step to the end of the wizard, replacing the sprite */
const replaceSprite = async (page: Page) => {
  await clickWizardNext(page);
  await assertWizardStep(page, 'select mode');
  await confirmReplacement(page, () => clickWizardReplace(page));
};

test.describe('File handling — image import', () => {

  test('importing a PNG image as single should replace the canvas', { tag: ['@import.single-image'] }, async ({ page }) => {
    await openEditorWithRedPixel(page);

    // Import a 2x2 image, as a single image by default.
    await browseImageFile(page, await createPngFile(page, 'image.png', RGB_SPRITE));
    await expect(page.locator('input[name="import-type"][value="single"]')).toBeChecked();
    await replaceSprite(page);

    // The sprite is the image.
    await assertSpriteSize(page, 2, 2);
    await assertColorRows(page, RGB_SPRITE);
  });

  test('importing a PNG as spritesheet should create multiple frames', { tag: ['@import.spritesheet'] }, async ({ page }) => {
    await openEditorWithRedPixel(page);

    // Import a red and a blue frame side by side, as a spritesheet of 2x2 frames.
    await browseImageFile(page, await createPngFile(page, 'spritesheet.png', [
      'RRBB',
      'RRBB',
    ]));
    await selectImportType(page, 'sheet');
    await typeInWizardField(page, 'frame-size-x', '2');
    await typeInWizardField(page, 'frame-size-y', '2');
    await replaceSprite(page);

    // Each frame of the image is a frame of the sprite.
    await assertFrameCount(page, 2);
    await assertSpriteSize(page, 2, 2);
    await assertColorRows(page, [
      'RR',
      'RR',
    ], { frameIndex: 0 });
    await assertColorRows(page, [
      'BB',
      'BB',
    ], { frameIndex: 1 });
  });

  test('spritesheet import with offset should extract correct frames', { tag: ['@import.spritesheet'] }, async ({ page }) => {
    await openEditorWithRedPixel(page);

    // A red and a green frame, inside a black border of one pixel.
    await browseImageFile(page, await createPngFile(page, 'padded.png', [
      'KKKKKK',
      'KRRGGK',
      'KRRGGK',
      'KKKKKK',
    ]));
    await selectImportType(page, 'sheet');

    // The offset is 0 by default. Skip the border with an offset of 1.
    await expect(getWizardField(page, 'frame-offset-x')).toHaveValue('0');
    await expect(getWizardField(page, 'frame-offset-y')).toHaveValue('0');
    await typeInWizardField(page, 'frame-size-x', '2');
    await typeInWizardField(page, 'frame-size-y', '2');
    await typeInWizardField(page, 'frame-offset-x', '1');
    await typeInWizardField(page, 'frame-offset-y', '1');
    await replaceSprite(page);

    // The frames are the red and the green squares, without the border.
    await assertFrameCount(page, 2);
    await assertSpriteSize(page, 2, 2);
    await assertColorRows(page, [
      'RR',
      'RR',
    ], { frameIndex: 0 });
    await assertColorRows(page, [
      'GG',
      'GG',
    ], { frameIndex: 1 });
  });
});

test.describe('File handling — .piskel import', () => {

  test('importing a .piskel file should restore pixel content', { tag: ['@import.browse-piskel'] }, async ({ page }) => {
    // Save a sprite to a .piskel file.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(RGB_SPRITE));
    const piskelPath = await downloadPiskelFile(page);

    // Replace it with an empty sprite.
    await setPiskelFromGrid(page, gridFromColorRows([
      '..',
      '..',
    ]));
    await assertColorRows(page, [
      '..',
      '..',
    ]);

    // Import the file: the pixels are back.
    await importPiskelFile(page, piskelPath);
    await assertSpriteSize(page, 2, 2);
    await assertColorRows(page, RGB_SPRITE);
  });
});
