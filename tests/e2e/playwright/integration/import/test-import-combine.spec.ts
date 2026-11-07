import test, { expect, Page } from "@playwright/test";
import {
  assertCropWarning,
  assertInsertMode,
  assertLayerFrames,
  assertNoDialogOpen,
  assertNoResizeOptions,
  assertResizeOption,
  assertWizardAnchor,
  assertWizardStep,
  browseImageFile,
  clickFirstInsertFrame,
  clickWizardCombine,
  clickWizardNext,
  createPngFile,
  getInsertFrameInput,
  getWizardAnchorLabel,
  gridFromRows,
  openEditor,
  pickInsertFrame,
  pickWizardAnchor,
  selectFrame,
  selectImportType,
  selectInsertMode,
  selectResizeOption,
  setPiskelFromGrid,
  typeInWizardField,
  waitForColorsToBeListed,
  waitForGrid,
  clickTool,
  drawAtPixel,
  getAddFrameButton,
  assertFrameCount,
} from "../../testutils";

const CURRENT_LAYER = 0;
const IMPORTED_LAYER = 1;

const EMPTY = [
  '....',
  '....',
  '....',
  '....',
];
const SOLID = [
  'XXXX',
  'XXXX',
  'XXXX',
  'XXXX',
];
const CHECKERED = [
  'X.X.',
  '.X.X',
  'X.X.',
  '.X.X',
];

/** The frames of createThreeSmallFrames: a pixel in the first, second or third column */
const PIXEL_IN_FIRST_COLUMN = [
  'X...',
  '....',
  '....',
  '....',
];
const PIXEL_IN_SECOND_COLUMN = [
  '.X..',
  '....',
  '....',
  '....',
];
const PIXEL_IN_THIRD_COLUMN = [
  '..X.',
  '....',
  '....',
  '....',
];

/**
 * Create a 4x4 sprite with three frames, each with a pixel in a different column. It's
 * 4x4, like the images combined with it, so that the wizard skips the size step.
 */
const createThreeSmallFrames = async (page: Page) => {
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 0, 0);
  await waitForGrid(page, 4, 4, PIXEL_IN_FIRST_COLUMN, { frameIndex: 0 });
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 2);
  await drawAtPixel(page, 1, 0);
  await waitForGrid(page, 4, 4, PIXEL_IN_SECOND_COLUMN, { frameIndex: 1 });
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 3);
  await drawAtPixel(page, 2, 0);
  await waitForGrid(page, 4, 4, PIXEL_IN_THIRD_COLUMN, { frameIndex: 2 });
};

/** Start from a sprite, and combine an image with it, up to the first step after select mode */
const startCombining = async (page: Page, spriteRows: string[], imageRows: string[]) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(spriteRows));
  await waitForGrid(page, spriteRows[0].length, spriteRows.length, spriteRows);
  await waitForColorsToBeListed(page);
  await browseImageFile(page, await createPngFile(page, 'image.png', imageRows));
  await clickWizardNext(page);
  await assertWizardStep(page, 'select mode');
  await clickWizardCombine(page);
};

/** Finish combining from the adjust size step, in the existing frame */
const finishFromAdjustSize = async (page: Page) => {
  await clickWizardNext(page);
  await assertWizardStep(page, 'insert location');
  await selectInsertMode(page, 'insert');
  await clickWizardNext(page);
  await assertNoDialogOpen(page);
};

test.describe('Adjust size step, with bigger content', () => {
  const SPRITE = [
    'X.',
    '..',
  ];

  test('should expand the canvas by default, from the top left corner', { tag: ['@import.adjust-expand'] }, async ({ page }) => {
    await startCombining(page, SPRITE, CHECKERED);

    // Keep the defaults.
    await assertWizardStep(page, 'adjust size');
    await assertResizeOption(page, 'expand');
    await finishFromAdjustSize(page);

    // The canvas fits the content, and the sprite stays at the top left corner.
    await assertLayerFrames(page, CURRENT_LAYER, [[
      'X...',
      '....',
      '....',
      '....',
    ]]);
    await assertLayerFrames(page, IMPORTED_LAYER, [CHECKERED]);
  });

  test('should place the current sprite with the anchor when expanding', { tag: ['@import.adjust-expand'] }, async ({ page }) => {
    await startCombining(page, SPRITE, CHECKERED);

    // Anchor to the bottom right corner.
    await assertWizardStep(page, 'adjust size');
    await pickWizardAnchor(page, 'BOTTOMRIGHT');
    await finishFromAdjustSize(page);

    // The sprite moves to that corner.
    await assertLayerFrames(page, CURRENT_LAYER, [[
      '....',
      '....',
      '..X.',
      '....',
    ]]);
    await assertLayerFrames(page, IMPORTED_LAYER, [CHECKERED]);
  });

  const contentBiggerInOneDirection = [
    { direction: 'wider', image: ['XXXX'], expanded: [
      '..X.',
      '....',
    ] },
    { direction: 'taller', image: [
      'X',
      'X',
      'X',
      'X',
    ], expanded: [
      '..',
      '..',
      'X.',
      '..',
    ] },
  ];

  for (const { direction, image, expanded } of contentBiggerInOneDirection) {
    test(`should expand in one direction only when the content is ${direction}`, { tag: ['@import.adjust-expand'] }, async ({ page }) => {
      await startCombining(page, SPRITE, image);

      // Anchor to the bottom right corner.
      await assertWizardStep(page, 'adjust size');
      await pickWizardAnchor(page, 'BOTTOMRIGHT');
      await finishFromAdjustSize(page);

      // One side grows, the other stays, and the anchor places the sprite.
      // The imported layer isn't checked: see docs/known-issues.md.
      await assertLayerFrames(page, CURRENT_LAYER, [expanded]);
    });
  }

  const croppedContent = [
    { anchor: 'TOPLEFT', image: [
      'XX.X',
      'X..X',
      '...X',
      'XXXX',
    ], kept: [
      'XX',
      'X.',
    ] },
    { anchor: 'MIDDLE', image: [
      'XXXX',
      'XX.X',
      'X.XX',
      'XXXX',
    ], kept: [
      'X.',
      '.X',
    ] },
    { anchor: 'BOTTOMRIGHT', image: [
      'XXXX',
      'X...',
      'X..X',
      'X.XX',
    ], kept: [
      '.X',
      'XX',
    ] },
  ];

  for (const { anchor, image, kept } of croppedContent) {
    test(`should crop to the ${anchor} part when keeping the size`, { tag: ['@import.adjust-keep'] }, async ({ page }) => {
      await startCombining(page, SPRITE, image);

      // Keep the size: a warning says the content will be cropped.
      await assertWizardStep(page, 'adjust size');
      await selectResizeOption(page, 'keep');
      await assertCropWarning(page);
      await pickWizardAnchor(page, anchor);
      await finishFromAdjustSize(page);

      // The canvas and the sprite don't change, and the anchor picks what's kept.
      await assertLayerFrames(page, CURRENT_LAYER, [SPRITE]);
      await assertLayerFrames(page, IMPORTED_LAYER, [kept]);
    });
  }
});

test.describe('Adjust size step, with smaller content', () => {
  const placedContent = [
    { anchor: 'TOPLEFT', placed: [
      'XX..',
      'X...',
      '....',
      '....',
    ] },
    { anchor: 'MIDDLE', placed: [
      '....',
      '.XX.',
      '.X..',
      '....',
    ] },
    { anchor: 'BOTTOMRIGHT', placed: [
      '....',
      '....',
      '..XX',
      '..X.',
    ] },
  ];

  for (const { anchor, placed } of placedContent) {
    test(`should place the content at ${anchor} without changing the canvas`, { tag: ['@import.adjust-smaller'] }, async ({ page }) => {
      await startCombining(page, SOLID, [
        'XX',
        'X.',
      ]);

      // There's no choice of size, only the anchor.
      await assertWizardStep(page, 'adjust size');
      await assertNoResizeOptions(page);
      await pickWizardAnchor(page, anchor);
      await finishFromAdjustSize(page);

      // The canvas and the sprite don't change, and the anchor places the content.
      await assertLayerFrames(page, CURRENT_LAYER, [SOLID]);
      await assertLayerFrames(page, IMPORTED_LAYER, [placed]);
    });
  }
});

test.describe('Anchor', () => {
  test('should start at the top left corner, with nine positions', { tag: ['@import.adjust-anchor'] }, async ({ page }) => {
    await startCombining(page, [
      'X.',
      '..',
    ], CHECKERED);
    await assertWizardStep(page, 'adjust size');

    await assertWizardAnchor(page, 'TOPLEFT');
  });

  test('should name what it does when the content is bigger', { tag: ['@import.adjust-anchor'] }, async ({ page }) => {
    await startCombining(page, [
      'X.',
      '..',
    ], CHECKERED);
    await assertWizardStep(page, 'adjust size');

    // Expanding resizes.
    await expect(getWizardAnchorLabel(page)).toHaveText('Select resize anchor:');

    // Keeping crops.
    await selectResizeOption(page, 'keep');
    await expect(getWizardAnchorLabel(page)).toContainText('Select crop anchor:');
  });

  test('should name what it does when the content is smaller', { tag: ['@import.adjust-anchor'] }, async ({ page }) => {
    await startCombining(page, SOLID, [
      'XX',
      'X.',
    ]);
    await assertWizardStep(page, 'adjust size');

    await expect(getWizardAnchorLabel(page)).toHaveText('Select position anchor:');
  });
});

test.describe('Insert location step', () => {
  /** Start from three frames, and combine a 4x4 image up to the insert location step */
  const reachInsertLocation = async (page: Page, imageRows: string[], options: { frameToSelect?: number; asSheet?: boolean } = {}) => {
    await openEditor(page);
    await createThreeSmallFrames(page);
    if (options.frameToSelect !== undefined) {
      await selectFrame(page, options.frameToSelect);
    }
    await waitForColorsToBeListed(page);
    await browseImageFile(page, await createPngFile(page, 'image.png', imageRows));
    if (options.asSheet) {
      await selectImportType(page, 'sheet');
      await typeInWizardField(page, 'frame-size-x', '4');
      await typeInWizardField(page, 'frame-size-y', '4');
    }
    await clickWizardNext(page);
    await assertWizardStep(page, 'select mode');
    await clickWizardCombine(page);
    await assertWizardStep(page, 'insert location');
  };

  test('should start on the current frame, as new frames', { tag: ['@import.insert-defaults'] }, async ({ page }) => {
    await reachInsertLocation(page, SOLID, { frameToSelect: 1 });

    // The second frame is current.
    await expect(getInsertFrameInput(page)).toHaveValue('2');
    await assertInsertMode(page, 'add');
  });

  test('should insert new frames after the picked frame', { tag: ['@import.insert-location', '@import.insert-new-frames'] }, async ({ page }) => {
    await reachInsertLocation(page, SOLID);

    // Pick the second frame, as new frames.
    await pickInsertFrame(page, 2);
    await clickWizardNext(page);
    await assertNoDialogOpen(page);

    // The new frame comes after it, empty on the existing layer.
    await assertLayerFrames(page, CURRENT_LAYER, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, EMPTY, PIXEL_IN_THIRD_COLUMN]);

    // The imported layer is empty on all the other frames.
    await assertLayerFrames(page, IMPORTED_LAYER, [EMPTY, EMPTY, SOLID, EMPTY]);
  });

  test('should insert new frames before the first frame', { tag: ['@import.insert-new-frames'] }, async ({ page }) => {
    await reachInsertLocation(page, SOLID);

    // Go to the very start of the frames.
    await clickFirstInsertFrame(page);
    await expect(getInsertFrameInput(page)).toHaveValue('0');
    await clickWizardNext(page);
    await assertNoDialogOpen(page);

    await assertLayerFrames(page, CURRENT_LAYER, [EMPTY, PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, PIXEL_IN_THIRD_COLUMN]);
    await assertLayerFrames(page, IMPORTED_LAYER, [SOLID, EMPTY, EMPTY, EMPTY]);
  });

  test('should insert in existing frames starting at the picked one', { tag: ['@import.insert-location', '@import.insert-existing'] }, async ({ page }) => {
    await reachInsertLocation(page, SOLID);

    // Pick the second frame, in existing frames.
    await selectInsertMode(page, 'insert');
    await pickInsertFrame(page, 2);
    await clickWizardNext(page);
    await assertNoDialogOpen(page);

    // No frames are added, and the imported layer only has content on the picked frame.
    await assertLayerFrames(page, CURRENT_LAYER, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, PIXEL_IN_THIRD_COLUMN]);
    await assertLayerFrames(page, IMPORTED_LAYER, [EMPTY, SOLID, EMPTY]);
  });

  test('should add frames when the imported frames go past the last one', { tag: ['@import.insert-overflow'] }, async ({ page }) => {
    // A spritesheet with two 4x4 frames.
    const imageRows = [
      'XXXXX.X.',
      'XXXX.X.X',
      'XXXXX.X.',
      'XXXX.X.X',
    ];
    await reachInsertLocation(page, imageRows, { asSheet: true });

    // Insert them in existing frames, starting at the last one.
    await selectInsertMode(page, 'insert');
    await pickInsertFrame(page, 3);
    await clickWizardNext(page);
    await assertNoDialogOpen(page);

    // One frame is added, empty on the existing layer.
    await assertLayerFrames(page, CURRENT_LAYER, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, PIXEL_IN_THIRD_COLUMN, EMPTY]);
    await assertLayerFrames(page, IMPORTED_LAYER, [EMPTY, EMPTY, SOLID, CHECKERED]);
  });
});
