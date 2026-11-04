import test, { expect, Page } from "@playwright/test";
import {
  assertImportType,
  assertLayerFrames,
  browseImageFile,
  clickWizardNext,
  colorToInt,
  confirmReplacement,
  createPngFile,
  getImportedFileName,
  getImportedImagePreview,
  getPixelColor,
  getSmoothResizeCheckbox,
  getSpritesheetGrid,
  getWizardField,
  gridFromRows,
  openEditor,
  selectImportType,
  setPiskelFromGrid,
  TRANSPARENT,
  typeInWizardField,
  waitForGrid,
} from "../../testutils";

/** Open the wizard with an image, from an empty sprite so that it imports directly */
const openWizardWithImage = async (page: Page, rows: string[], name = 'image.png') => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(['..', '..']));
  await waitForGrid(page, 2, 2, ['..', '..']);
  await browseImageFile(page, await createPngFile(page, name, rows));
};

/** Finish the import: an empty sprite asks for confirmation, then gets replaced */
const finishImport = async (page: Page) => {
  await confirmReplacement(page, () => clickWizardNext(page));
};

/** Import an image as a spritesheet, cut with these field values */
const importSpritesheet = async (page: Page, rows: string[], fields: Record<string, string>) => {
  await openWizardWithImage(page, rows);
  await selectImportType(page, 'sheet');
  for (const [name, value] of Object.entries(fields)) {
    await typeInWizardField(page, name, value);
  }
  await finishImport(page);
};

test.describe('Image import step', () => {
  test('should show the image and start with its size', { tag: ['@import.image-step'] }, async ({ page }) => {
    // Open the wizard with a 4x2 image.
    await openWizardWithImage(page, ['XXXX', '....'], 'hero.png');

    // The step shows the name and a preview of the file.
    await expect(getImportedFileName(page)).toHaveText('hero.png');
    await expect(getImportedImagePreview(page)).toBeVisible();

    // Single image is selected, and the fields start at the image's size.
    await assertImportType(page, 'single');
    await expect(getWizardField(page, 'resize-width')).toHaveValue('4');
    await expect(getWizardField(page, 'resize-height')).toHaveValue('2');
    await expect(getWizardField(page, 'frame-size-x')).toHaveValue('4');
    await expect(getWizardField(page, 'frame-size-y')).toHaveValue('2');
    await expect(getWizardField(page, 'frame-offset-x')).toHaveValue('0');
    await expect(getWizardField(page, 'frame-offset-y')).toHaveValue('0');
  });

  const fieldsSelectingAType = [
    { field: 'resize-width', selects: 'single', startsFrom: 'sheet' },
    { field: 'resize-height', selects: 'single', startsFrom: 'sheet' },
    { field: 'frame-size-x', selects: 'sheet', startsFrom: 'single' },
    { field: 'frame-size-y', selects: 'sheet', startsFrom: 'single' },
    { field: 'frame-offset-x', selects: 'sheet', startsFrom: 'single' },
    { field: 'frame-offset-y', selects: 'sheet', startsFrom: 'single' },
  ] as const;

  for (const { field, selects, startsFrom } of fieldsSelectingAType) {
    test(`should select ${selects} when typing in ${field}`, { tag: ['@import.auto-select-type'] }, async ({ page }) => {
      await openWizardWithImage(page, ['XXXX', '....']);
      await selectImportType(page, startsFrom);

      // Type in the field.
      await typeInWizardField(page, field, '1');

      // The import type follows.
      await assertImportType(page, selects);
    });
  }
});

test.describe('Importing as a single image', () => {
  test('should import the image at its own size by default', { tag: ['@import.single-image'] }, async ({ page }) => {
    await openWizardWithImage(page, ['XXXX', 'X...']);

    // Import without changing anything.
    await finishImport(page);

    // The sprite is the image, as one frame, with its exact colors.
    await assertLayerFrames(page, 0, [['XXXX', 'X...']]);
    expect(await getPixelColor(page, 0, 1)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 1, 1)).toBe(TRANSPARENT);
  });

  const typedSizes = [
    { typed: 'resize-width', value: '2', other: 'resize-height', expected: '1', title: 'a width' },
    { typed: 'resize-height', value: '4', other: 'resize-width', expected: '8', title: 'a height' },
  ];

  for (const { typed, value, other, expected, title } of typedSizes) {
    test(`should keep the aspect ratio when typing ${title}`, { tag: ['@import.resize-aspect'] }, async ({ page }) => {
      await openWizardWithImage(page, ['XXXX', '....']);

      // Type a size for this 4x2 image.
      await typeInWizardField(page, typed, value);

      // The other field follows.
      await expect(getWizardField(page, other)).toHaveValue(expected);
    });
  }

  test('should round the aspect ratio to the nearest pixel', { tag: ['@import.resize-aspect'] }, async ({ page }) => {
    await openWizardWithImage(page, ['XXX', '...']);

    // A width of 4 on this 3x2 image gives a height of 2.67.
    await typeInWizardField(page, 'resize-width', '4');
    await expect(getWizardField(page, 'resize-height')).toHaveValue('3');
  });

  test('should keep hard edges when resizing without smoothing', { tag: ['@import.single-image', '@import.resize-smoothing'] }, async ({ page }) => {
    await openWizardWithImage(page, ['X.']);

    // Double the size of the image, without smoothing.
    await typeInWizardField(page, 'resize-width', '4');
    await getSmoothResizeCheckbox(page).uncheck();
    await finishImport(page);

    // Each pixel becomes a block of four, with its exact color.
    await assertLayerFrames(page, 0, [['XX..', 'XX..']]);
    expect(await getPixelColor(page, 1, 1)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 2, 1)).toBe(TRANSPARENT);
  });

  test('should blend pixels when resizing with smoothing, the default', { tag: ['@import.resize-smoothing'] }, async ({ page }) => {
    await openWizardWithImage(page, ['X.']);
    await expect(getSmoothResizeCheckbox(page)).toBeChecked();

    // Make the image much bigger.
    await typeInWizardField(page, 'resize-width', '16');
    await finishImport(page);

    // Around the edge between the two pixels, a color is neither red nor transparent.
    const colorsAcrossTheEdge = [];
    for (let col = 0; col < 16; col++) {
      colorsAcrossTheEdge.push(await getPixelColor(page, col, 4));
    }
    const blended = colorsAcrossTheEdge.filter((color) => color !== colorToInt('#FF0000') && color !== TRANSPARENT);
    expect(blended.length).toBeGreaterThan(0);
  });
});

test.describe('Importing as a spritesheet', () => {
  // Four 2x2 cells, each with its own shape.
  const FOUR_CELLS = [
    'X.XX',
    '..X.',
    '.X..',
    'XX.X',
  ];
  const FOUR_CELLS_IN_READING_ORDER = [
    ['X.', '..'],
    ['XX', 'X.'],
    ['.X', 'XX'],
    ['..', '.X'],
  ];

  test('should read the frames left to right, then top to bottom', { tag: ['@import.spritesheet', '@import.sheet-order'] }, async ({ page }) => {
    await importSpritesheet(page, FOUR_CELLS, { 'frame-size-x': '2', 'frame-size-y': '2' });
    await assertLayerFrames(page, 0, FOUR_CELLS_IN_READING_ORDER);

    // The cells keep their exact colors.
    const secondFrame = 1;
    expect(await getPixelColor(page, 0, 0, 0, secondFrame)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 1, 1, 0, secondFrame)).toBe(TRANSPARENT);
  });

  test('should use the default frame size and offset to import the whole image', { tag: ['@import.spritesheet'] }, async ({ page }) => {
    // Select spritesheet without changing the fields.
    await importSpritesheet(page, FOUR_CELLS, {});

    // The whole image is one frame.
    await assertLayerFrames(page, 0, [FOUR_CELLS]);
  });

  test('should take a frame size that is not square', { tag: ['@import.sheet-size'] }, async ({ page }) => {
    await importSpritesheet(page, ['XX..', 'X..X'], { 'frame-size-x': '2', 'frame-size-y': '1' });

    // The sprite is 2x1. The empty cell is skipped.
    await assertLayerFrames(page, 0, [['XX'], ['X.'], ['.X']]);
  });

  test('should start each row at the offset', { tag: ['@import.sheet-offset'] }, async ({ page }) => {
    // The same four cells as above, moved by 1 pixel. The first row and column are noise.
    await importSpritesheet(page, [
      'XXXXX',
      'XX.XX',
      'X..X.',
      'X.X..',
      'XXX.X',
    ], { 'frame-size-x': '2', 'frame-size-y': '2', 'frame-offset-x': '1', 'frame-offset-y': '1' });

    await assertLayerFrames(page, 0, FOUR_CELLS_IN_READING_ORDER);
  });

  test('should skip fully transparent cells', { tag: ['@import.sheet-empty-cells'] }, async ({ page }) => {
    await importSpritesheet(page, [
      'XX..',
      'XX..',
      '....',
      '..XX',
    ], { 'frame-size-x': '2', 'frame-size-y': '2' });

    // Only the first and last cells make frames.
    await assertLayerFrames(page, 0, [['XX', 'XX'], ['..', 'XX']]);
  });

  test('should ignore cells that do not fit in the image', { tag: ['@import.sheet-partial-cells'] }, async ({ page }) => {
    await importSpritesheet(page, [
      'X..XX',
      '...XX',
      '...XX',
      'XXXXX',
    ], { 'frame-size-x': '3', 'frame-size-y': '3' });

    // Only one 3x3 cell fits in this 5x4 image.
    await assertLayerFrames(page, 0, [['X..', '...', '...']]);
  });

  test('should show and update a grid on the preview', { tag: ['@import.spritesheet', '@import.sheet-grid'] }, async ({ page }) => {
    await openWizardWithImage(page, FOUR_CELLS);
    const grid = getSpritesheetGrid(page);
    const readGridImage = () => grid.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

    // Selecting spritesheet shows the grid.
    await expect(grid).toBeHidden();
    await selectImportType(page, 'sheet');
    await expect(grid).toBeVisible();
    const gridOfWholeImage = await readGridImage();

    // Typing a frame size redraws it.
    await typeInWizardField(page, 'frame-size-x', '2');
    await expect.poll(readGridImage).not.toBe(gridOfWholeImage);

    // Selecting single image hides it.
    await selectImportType(page, 'single');
    await expect(grid).toBeHidden();
  });

  const invalidFrameSizes = ['0', 'ab'];

  for (const value of invalidFrameSizes) {
    test(`should use a frame size of 1 instead of "${value}"`, { tag: ['@import.sheet-invalid'] }, async ({ page }) => {
      await openWizardWithImage(page, ['X.', '.X']);
      await selectImportType(page, 'sheet');

      // Paste the value.
      await getWizardField(page, 'frame-size-x').fill(value);
      await getWizardField(page, 'frame-size-y').fill(value);
      await finishImport(page);

      // The image is cut in 1x1 cells, and the empty ones are skipped.
      await assertLayerFrames(page, 0, [['X'], ['X']]);
    });
  }

  const invalidOffsets = ['-3', 'ab'];

  for (const value of invalidOffsets) {
    test(`should use an offset of 0 instead of "${value}"`, { tag: ['@import.sheet-invalid'] }, async ({ page }) => {
      await openWizardWithImage(page, FOUR_CELLS);
      await selectImportType(page, 'sheet');
      await typeInWizardField(page, 'frame-size-x', '2');
      await typeInWizardField(page, 'frame-size-y', '2');

      // Paste the value.
      await getWizardField(page, 'frame-offset-x').fill(value);
      await getWizardField(page, 'frame-offset-y').fill(value);
      await finishImport(page);

      // The cells start at the top left corner.
      await assertLayerFrames(page, 0, FOUR_CELLS_IN_READING_ORDER);
    });
  }
});
