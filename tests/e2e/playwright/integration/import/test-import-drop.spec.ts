import test, { expect, Page } from "@playwright/test";
import {
  answerNextConfirm,
  assertDialogOpen,
  assertFrameCount,
  assertNoDialogOpen,
  assertNotification,
  BROKEN_PISKEL_FILE,
  browsePiskelFile,
  createPngFile,
  downloadPiskelFile,
  dropFilesOnPixel,
  gridFromRows,
  openEditor,
  readPiskelFile,
  readPixelRows,
  setPiskelFromGrid,
  waitForGrid,
} from "../../testutils";

const EMPTY = [
  '....',
  '....',
  '....',
  '....',
];
const CHECKERED = [
  'X.X.',
  '.X.X',
  'X.X.',
  '.X.X',
];

const openEditorWithEmptySprite = async (page: Page) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await waitForGrid(page, 4, 4, EMPTY);
};

/** Download a 4x4 checkered sprite as a .piskel file, then empty the sprite */
const createCheckeredPiskelFile = async (page: Page) => {
  await setPiskelFromGrid(page, gridFromRows(CHECKERED));
  await waitForGrid(page, 4, 4, CHECKERED);
  const piskelFile = await readPiskelFile(await downloadPiskelFile(page));
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await waitForGrid(page, 4, 4, EMPTY);
  return piskelFile;
};

test.describe('Dropping one image', () => {
  test('should center a small image on the drop position, without the wizard', { tag: ['@import.drop-small-image'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Drop a 2x2 image on the second pixel of the third row.
    const image = await createPngFile(page, 'small.png', [
      'XX',
      'X.',
    ]);
    await dropFilesOnPixel(page, [image], 1, 2);

    // It's centered there, in the current frame.
    await waitForGrid(page, 4, 4, [
      '....',
      'XX..',
      'X...',
      '....',
    ]);
    await assertFrameCount(page, 1);
    await assertNoDialogOpen(page);
  });

  test('should keep a small image inside the canvas when dropped near an edge', { tag: ['@import.drop-small-image'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Drop a 3x3 image on the last pixel, where its center would push it out.
    const image = await createPngFile(page, 'small.png', [
      'XXX',
      'X..',
      'X..',
    ]);
    await dropFilesOnPixel(page, [image], 3, 3);

    // All of it is drawn, against the bottom right corner.
    await waitForGrid(page, 4, 4, [
      '....',
      '.XXX',
      '.X..',
      '.X..',
    ]);
  });

  test('should draw an image of the size of the canvas, without the wizard', { tag: ['@import.drop-small-image'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Drop a 4x4 image on the first pixel.
    const image = await createPngFile(page, 'same-size.png', CHECKERED);
    await dropFilesOnPixel(page, [image]);

    // It's drawn directly.
    await waitForGrid(page, 4, 4, CHECKERED);
    await assertNoDialogOpen(page);
  });

  const largeImages = [
    { name: 'wider', rows: ['XXXXX'] },
    { name: 'taller', rows: [
      'X',
      'X',
      'X',
      'X',
      'X',
    ] },
  ];

  for (const { name, rows } of largeImages) {
    test(`should open the wizard for an image ${name} than the canvas`, { tag: ['@import.drop-large-image'] }, async ({ page }) => {
      await openEditorWithEmptySprite(page);

      // Drop the image.
      const image = await createPngFile(page, 'large.png', rows);
      await dropFilesOnPixel(page, [image]);

      // The wizard opens, and nothing is drawn yet.
      await assertDialogOpen(page, 'import');
      expect(await readPixelRows(page, 4, 4)).toEqual(EMPTY);
    });
  }
});

test.describe('Dropping several images', () => {
  test('should center each image on a new frame at the drop position', { tag: ['@import.drop-several-images'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Drop two images on the second pixel of the second row.
    const firstImage = await createPngFile(page, 'first.png', ['X']);
    const secondImage = await createPngFile(page, 'second.png', ['XX']);
    await dropFilesOnPixel(page, [firstImage, secondImage], 1, 1);

    // Each image gets a new frame, and the original frame is unchanged.
    await assertFrameCount(page, 3);
    await waitForGrid(page, 4, 4, EMPTY, { frameIndex: 0 });
    await waitForGrid(page, 4, 4, [
      '....',
      '.X..',
      '....',
      '....',
    ], { frameIndex: 1 });
    await waitForGrid(page, 4, 4, [
      '....',
      'XX..',
      '....',
      '....',
    ], { frameIndex: 2 });
    await assertNoDialogOpen(page);
  });

  test('should draw images larger than the canvas without the wizard', { tag: ['@import.drop-several-images'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Drop two images wider than the canvas.
    const wideImage = await createPngFile(page, 'wide.png', ['XXXXXX']);
    const otherWideImage = await createPngFile(page, 'other-wide.png', ['XXXXXX']);
    await dropFilesOnPixel(page, [wideImage, otherWideImage]);

    // They're drawn on new frames, and what doesn't fit is cut off.
    await assertFrameCount(page, 3);
    await waitForGrid(page, 4, 4, [
      'XXXX',
      '....',
      '....',
      '....',
    ], { frameIndex: 1 });
    await waitForGrid(page, 4, 4, [
      'XXXX',
      '....',
      '....',
      '....',
    ], { frameIndex: 2 });
    await assertNoDialogOpen(page);
  });
});

test.describe('Dropping a .piskel file', () => {
  test('should replace the sprite after confirmation', { tag: ['@import.drop-piskel'] }, async ({ page }) => {
    await openEditor(page);
    const piskelFile = await createCheckeredPiskelFile(page);

    // Drop the file and accept the confirmation.
    const confirmation = answerNextConfirm(page, 'accept');
    await dropFilesOnPixel(page, [piskelFile]);
    expect(await confirmation).toContain('This will replace your current animation');

    // The sprite is replaced.
    await waitForGrid(page, 4, 4, CHECKERED);
  });

  test('should keep the sprite when the confirmation is dismissed', { tag: ['@import.drop-piskel'] }, async ({ page }) => {
    await openEditor(page);
    const piskelFile = await createCheckeredPiskelFile(page);

    // Drop the file and dismiss the confirmation.
    const confirmation = answerNextConfirm(page, 'dismiss');
    await dropFilesOnPixel(page, [piskelFile]);
    await confirmation;

    // The sprite is unchanged.
    expect(await readPixelRows(page, 4, 4)).toEqual(EMPTY);
  });
});

test.describe('Invalid .piskel files', () => {
  test('should show an error when browsing one', { tag: ['@import.piskel-error'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Browse the broken file.
    await browsePiskelFile(page, BROKEN_PISKEL_FILE);

    // An error shows, the wizard closes and the sprite is unchanged.
    await assertNotification(page, 'Piskel file import failed');
    await assertNoDialogOpen(page);
    expect(await readPixelRows(page, 4, 4)).toEqual(EMPTY);
  });

  test('should show an error when dropping one', { tag: ['@import.piskel-error'] }, async ({ page }) => {
    await openEditorWithEmptySprite(page);

    // Drop the broken file.
    await dropFilesOnPixel(page, [BROKEN_PISKEL_FILE]);

    // An error shows, and the sprite is unchanged.
    await assertNotification(page, 'Piskel file import failed');
    expect(await readPixelRows(page, 4, 4)).toEqual(EMPTY);
  });
});
