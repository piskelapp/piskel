import test, { expect, Page } from "@playwright/test";
import {
  answerNextConfirm,
  assertCurrentFrame,
  assertCurrentLayer,
  assertDialogOpen,
  assertFps,
  assertFrameCount,
  assertImportType,
  assertLayerFrames,
  assertLayerNames,
  assertNoDialogOpen,
  assertNoWizardBackButton,
  assertResizeOption,
  assertSpriteDescription,
  assertSpriteName,
  assertWizardAnchor,
  assertWizardStep,
  assertWizardSummary,
  browseImageFile,
  browsePiskelFile,
  clickTool,
  clickWizardBack,
  clickWizardCombine,
  clickWizardNext,
  clickWizardReplace,
  closeImportWizard,
  combineInWizard,
  confirmReplacement,
  createPngFile,
  createThreeFrames,
  downloadGifExport,
  downloadPiskelFile,
  downloadPiskelFileFromSavePanel,
  drawAtPixel,
  fillSpriteNameAndDescription,
  getAddFrameButton,
  getAddLayerButton,
  getInsertFrameInput,
  getSmoothResizeCheckbox,
  getWizardField,
  gridFromRows,
  openEditor,
  openExportSettingsPanel,
  openSaveSettingsPanel,
  pickWizardAnchor,
  PIXEL_IN_FIRST_COLUMN,
  PIXEL_IN_SECOND_COLUMN,
  PIXEL_IN_THIRD_COLUMN,
  readPiskelFile,
  readPixelRows,
  redo,
  selectImportType,
  selectResizeOption,
  setFps,
  setPiskelFromGrid,
  typeInWizardField,
  undo,
  wait,
  waitForColorsToBeListed,
  waitForGrid,
} from "../../testutils";

const EMPTY = [
  '..',
  '..',
];
const DIAGONAL = [
  'X.',
  '.X',
];
const OTHER_DIAGONAL = [
  '.X',
  'X.',
];
const FIRST_ROW = [
  'XX',
  '..',
];

const openEditorWithSprite = async (page: Page, rows: string[]) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(rows));
  await waitForGrid(page, 2, 2, rows);
};

/** Download a 2x2 sprite as a .piskel file, then show another sprite */
const createDiagonalPiskelFile = async (page: Page) => {
  await openEditorWithSprite(page, DIAGONAL);
  const piskelFile = await readPiskelFile(await downloadPiskelFile(page));
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await waitForGrid(page, 2, 2, EMPTY);
  return piskelFile;
};

test.describe('Sprite name', () => {
  test('should name a new sprite after the image, without its extension', { tag: ['@import.image-name'] }, async ({ page }) => {
    await openEditorWithSprite(page, EMPTY);

    // Import an image into the empty sprite.
    await browseImageFile(page, await createPngFile(page, 'hero-idle.png', OTHER_DIAGONAL));
    await confirmReplacement(page, () => clickWizardNext(page));

    // The sprite is the image, named after the file.
    await waitForGrid(page, 2, 2, OTHER_DIAGONAL);
    await assertSpriteName(page, 'hero-idle');
  });
});

test.describe('Confirming a replacement', () => {
  const sprites = [
    {
      name: 'an empty sprite',
      rows: EMPTY,
      // An empty sprite skips the choice between replacing and combining.
      replaceWithImage: clickWizardNext,
    },
    {
      name: 'a sprite with content',
      rows: DIAGONAL,
      replaceWithImage: async (page: Page) => {
        await waitForColorsToBeListed(page);
        await clickWizardNext(page);
        await clickWizardReplace(page);
      },
    },
  ];

  for (const { name, rows, replaceWithImage } of sprites) {
    test(`should ask before replacing ${name}`, { tag: ['@import.replace-confirm'] }, async ({ page }) => {
      await openEditorWithSprite(page, rows);

      // Import an image and accept the confirmation.
      await browseImageFile(page, await createPngFile(page, 'image.png', FIRST_ROW));
      const confirmation = answerNextConfirm(page, 'accept');
      await replaceWithImage(page);
      expect(await confirmation).toContain('This will replace your current animation');

      // The sprite is replaced.
      await assertNoDialogOpen(page);
      await waitForGrid(page, 2, 2, FIRST_ROW);
    });

    test(`should keep ${name} when the confirmation is dismissed`, { tag: ['@import.replace-confirm'] }, async ({ page }) => {
      await openEditorWithSprite(page, rows);

      // Import an image and dismiss the confirmation.
      await browseImageFile(page, await createPngFile(page, 'image.png', FIRST_ROW));
      const confirmation = answerNextConfirm(page, 'dismiss');
      await replaceWithImage(page);
      await confirmation;

      // The wizard stays open, and the sprite is unchanged.
      await assertDialogOpen(page, 'import');
      expect(await readPixelRows(page, 2, 2)).toEqual(rows);
    });
  }
});

/** Export a sprite with three 10x10 frames as a GIF, then show another sprite */
const createThreeFramesGifFile = async (page: Page) => {
  await openEditor(page);
  await createThreeFrames(page);
  await openExportSettingsPanel(page);
  const { file } = await downloadGifExport(page);
  await setPiskelFromGrid(page, gridFromRows(DIAGONAL));
  await waitForGrid(page, 2, 2, DIAGONAL);
  await assertFrameCount(page, 1);
  await waitForColorsToBeListed(page);
  return { name: 'animation.gif', mimeType: 'image/gif', base64: file.toString('base64') };
};

/** Finish importing, replacing the sprite */
const replaceSpriteInWizard = async (page: Page) => {
  await confirmReplacement(page, async () => {
    await clickWizardNext(page);
    await assertWizardStep(page, 'select mode');
    await clickWizardReplace(page);
  });
};

test.describe('Animated GIF as a single image', () => {
  test('should import each frame of the GIF as a frame', { tag: ['@import.animated-gif'] }, async ({ page }) => {
    const gifFile = await createThreeFramesGifFile(page);

    // Import the GIF as a single image, the default.
    await browseImageFile(page, gifFile);
    await assertImportType(page, 'single');
    await replaceSpriteInWizard(page);

    // Each frame of the GIF is a frame of the sprite.
    await assertLayerFrames(page, 0, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, PIXEL_IN_THIRD_COLUMN]);
  });

  test('should resize every frame of the GIF', { tag: ['@import.animated-gif'] }, async ({ page }) => {
    const gifFile = await createThreeFramesGifFile(page);

    // Import the 10x10 GIF resized to 20x20, without smoothing.
    await browseImageFile(page, gifFile);
    await typeInWizardField(page, 'resize-width', '20');
    await getSmoothResizeCheckbox(page).uncheck();
    await replaceSpriteInWizard(page);

    // Each pixel becomes a block of four, on all three frames.
    await assertLayerFrames(page, 0, [
      [
        'XX..................',
        'XX..................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
      ],
      [
        '..XX................',
        '..XX................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
      ],
      [
        '....XX..............',
        '....XX..............',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
      ],
    ]);
  });
});

test.describe('Animated GIF as a spritesheet', () => {
  test('should keep each GIF frame as a frame', { tag: ['@import.gif-sheet'] }, async ({ page }) => {
    const gifFile = await createThreeFramesGifFile(page);

    // Import the GIF as a spritesheet of 2x2 frames.
    await browseImageFile(page, gifFile);
    await selectImportType(page, 'sheet');
    await typeInWizardField(page, 'frame-size-x', '2');
    await typeInWizardField(page, 'frame-size-y', '2');
    await replaceSpriteInWizard(page);

    // There are still three frames: the 10x10 GIF frames aren't cut into cells.
    // Their size isn't checked: see docs/known-issues.md.
    await assertFrameCount(page, 3);
  });
});

test.describe('Combining', () => {
  test('should make the first imported layer the current layer', { tag: ['@import.combine-selection'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);

    // Download a sprite with two layers.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    const piskelFile = await readPiskelFile(await downloadPiskelFile(page));

    // Start again from a sprite with one layer.
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await waitForGrid(page, 2, 2, EMPTY);
    await assertLayerNames(page, ['Base layer']);

    // Combine the file with it.
    await browsePiskelFile(page, piskelFile);
    await combineInWizard(page);

    // The first imported layer, just above the existing one, is the current layer.
    await assertLayerNames(page, ['Layer 1 (imported)', 'Base layer (imported)', 'Base layer']);
    await assertCurrentLayer(page, 1);
  });
});

test.describe('Undo after importing', () => {
  /** Draw on the sprite, so that undo has a state to go back to */
  const drawFirstPixel = async (page: Page) => {
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitForGrid(page, 2, 2, [
      'X.',
      '..',
    ]);
  };

  test('should undo and redo a replacement in one step', { tag: ['@import.undo'] }, async ({ page }) => {
    const piskelFile = await createDiagonalPiskelFile(page);
    await drawFirstPixel(page);

    // Replace the sprite with the file.
    await browsePiskelFile(page, piskelFile);
    await confirmReplacement(page, () => clickWizardReplace(page));
    await waitForGrid(page, 2, 2, DIAGONAL);

    // One undo goes back to the drawing.
    await undo(page);
    await waitForGrid(page, 2, 2, [
      'X.',
      '..',
    ]);
    // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
    await wait(100);

    // One redo brings the replacement back.
    await redo(page);
    await waitForGrid(page, 2, 2, DIAGONAL);
  });

  test('should undo and redo combining in one step', { tag: ['@import.undo'] }, async ({ page }) => {
    const piskelFile = await createDiagonalPiskelFile(page);
    await drawFirstPixel(page);

    // Combine the file with the sprite.
    await browsePiskelFile(page, piskelFile);
    await combineInWizard(page);
    await assertLayerNames(page, ['Base layer (imported)', 'Base layer']);

    // One undo removes the imported layer and keeps the drawing.
    await undo(page);
    await assertLayerNames(page, ['Base layer']);
    await waitForGrid(page, 2, 2, [
      'X.',
      '..',
    ]);
    // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
    await wait(100);

    // One redo brings the imported layer back.
    await redo(page);
    await assertLayerNames(page, ['Base layer (imported)', 'Base layer']);
  });
});

test.describe('Summary of the imported content', () => {
  test('should show the imported image on each step after the first', { tag: ['@import.step-summary'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);
    await waitForColorsToBeListed(page);

    // Import an image bigger than the sprite, so that every step shows.
    await browseImageFile(page, await createPngFile(page, 'hero.png', [
      'XXX',
      'XXX',
      'XXX',
    ]));
    await clickWizardNext(page);

    // Each step shows the same summary.
    await assertWizardStep(page, 'select mode');
    await assertWizardSummary(page, { name: 'hero', size: '3×3', frames: 1, layers: 1 });
    await clickWizardCombine(page);
    await assertWizardStep(page, 'adjust size');
    await assertWizardSummary(page, { name: 'hero', size: '3×3', frames: 1, layers: 1 });
    await clickWizardNext(page);
    await assertWizardStep(page, 'insert location');
    await assertWizardSummary(page, { name: 'hero', size: '3×3', frames: 1, layers: 1 });
  });

  test('should count the frames and layers of a .piskel file', { tag: ['@import.step-summary'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);

    // Download a sprite with two frames and two layers.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await openSaveSettingsPanel(page);
    await fillSpriteNameAndDescription(page, 'adventurer', '');
    const piskelFile = await readPiskelFile(await downloadPiskelFileFromSavePanel(page));

    // Browse the file.
    await browsePiskelFile(page, piskelFile);
    await assertWizardStep(page, 'select mode');

    // The summary describes it.
    await assertWizardSummary(page, { name: 'adventurer', size: '2×2', frames: 2, layers: 2 });
  });
});

test.describe('Back button', () => {
  test('should go back through the steps and keep the choices', { tag: ['@import.back'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);
    await waitForColorsToBeListed(page);

    // Import a 4x4 image resized to 3x3, and combine it.
    await browseImageFile(page, await createPngFile(page, 'image.png', [
      'XXXX',
      'XXXX',
      'XXXX',
      'XXXX',
    ]));
    await typeInWizardField(page, 'resize-width', '3');
    await clickWizardNext(page);
    await assertWizardStep(page, 'select mode');
    await clickWizardCombine(page);

    // Choose to keep the size, with the anchor in the middle.
    await assertWizardStep(page, 'adjust size');
    await selectResizeOption(page, 'keep');
    await pickWizardAnchor(page, 'MIDDLE');
    await clickWizardNext(page);

    // Go back to the adjust size step: its choices are kept.
    await assertWizardStep(page, 'insert location');
    await clickWizardBack(page);
    await assertWizardStep(page, 'adjust size');
    await assertResizeOption(page, 'keep');
    await assertWizardAnchor(page, 'MIDDLE');

    // Go back to the image import step: its fields are kept.
    await clickWizardBack(page);
    await assertWizardStep(page, 'select mode');
    await clickWizardBack(page);
    await assertWizardStep(page, 'image import');
    await assertImportType(page, 'single');
    await expect(getWizardField(page, 'resize-width')).toHaveValue('3');
    await expect(getWizardField(page, 'resize-height')).toHaveValue('3');
  });

  test('should keep the spritesheet fields', { tag: ['@import.back'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);
    await waitForColorsToBeListed(page);

    // Choose a frame size and an offset for a spritesheet.
    await browseImageFile(page, await createPngFile(page, 'image.png', [
      'XXXX',
      'XXXX',
      'XXXX',
      'XXXX',
    ]));
    await selectImportType(page, 'sheet');
    await typeInWizardField(page, 'frame-size-x', '2');
    await typeInWizardField(page, 'frame-size-y', '3');
    await typeInWizardField(page, 'frame-offset-x', '1');

    // Go to the next step and back.
    await clickWizardNext(page);
    await assertWizardStep(page, 'select mode');
    await clickWizardBack(page);
    await assertWizardStep(page, 'image import');

    // Spritesheet is still selected, with its fields.
    await assertImportType(page, 'sheet');
    await expect(getWizardField(page, 'frame-size-x')).toHaveValue('2');
    await expect(getWizardField(page, 'frame-size-y')).toHaveValue('3');
    await expect(getWizardField(page, 'frame-offset-x')).toHaveValue('1');
  });

  test('should not be offered on the first step', { tag: ['@import.back'] }, async ({ page }) => {
    const piskelFile = await createDiagonalPiskelFile(page);

    // A .piskel file starts on the select mode step.
    await browsePiskelFile(page, piskelFile);
    await assertWizardStep(page, 'select mode');
    await assertNoWizardBackButton(page);
    await closeImportWizard(page);

    // An image starts on the image import step.
    await browseImageFile(page, await createPngFile(page, 'image.png', FIRST_ROW));
    await assertNoWizardBackButton(page);
  });
});

test.describe('Closing the wizard', () => {
  const stepsToReach = [
    { step: 'image import', stepsAfterTheFirst: 0 },
    { step: 'select mode', stepsAfterTheFirst: 1 },
    { step: 'adjust size', stepsAfterTheFirst: 2 },
    { step: 'insert location', stepsAfterTheFirst: 3 },
  ] as const;

  for (const { step, stepsAfterTheFirst } of stepsToReach) {
    test(`should leave the sprite unchanged from the ${step} step`, { tag: ['@import.cancel'] }, async ({ page }) => {
      await openEditorWithSprite(page, DIAGONAL);
      await waitForColorsToBeListed(page);

      // Go through the wizard, with an image bigger than the sprite, up to this step.
      await browseImageFile(page, await createPngFile(page, 'image.png', [
        'XXX',
        'XXX',
        'XXX',
      ]));
      if (stepsAfterTheFirst >= 1) {
        await clickWizardNext(page);
        await assertWizardStep(page, 'select mode');
      }
      if (stepsAfterTheFirst >= 2) {
        await clickWizardCombine(page);
        await assertWizardStep(page, 'adjust size');
      }
      if (stepsAfterTheFirst >= 3) {
        await clickWizardNext(page);
        await assertWizardStep(page, 'insert location');
      }

      // Close it.
      await closeImportWizard(page);

      // The sprite is as it was.
      await assertLayerFrames(page, 0, [DIAGONAL]);
      await assertLayerNames(page, ['Base layer']);
    });
  }
});

test.describe('Sprite properties after importing', () => {
  /** Name a sprite and set its FPS, then download it as a .piskel file */
  const downloadNamedPiskelFile = async (page: Page, name: string, description: string, fps: number) => {
    await setFps(page, fps);
    await openSaveSettingsPanel(page);
    await fillSpriteNameAndDescription(page, name, description);
    return await readPiskelFile(await downloadPiskelFileFromSavePanel(page));
  };

  test('should take the imported properties when replacing', { tag: ['@import.replace-result'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);

    // Download a sprite with its own name, description and FPS.
    const piskelFile = await downloadNamedPiskelFile(page, 'imported hero', 'the imported one', 6);

    // Start from another sprite, with a second frame and layer selected.
    await downloadNamedPiskelFile(page, 'current hero', 'the current one', 20);
    await getAddFrameButton(page).click();
    await assertCurrentFrame(page, 1);
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    // Replace it with the file.
    await browsePiskelFile(page, piskelFile);
    await confirmReplacement(page, () => clickWizardReplace(page));

    // The sprite has the imported properties, on its first frame and layer.
    await assertSpriteName(page, 'imported hero');
    await assertFps(page, 6);
    await assertCurrentFrame(page, 0);
    await assertCurrentLayer(page, 0);
    await assertSpriteDescription(page, 'the imported one');
  });

  test('should give an imported image the default FPS', { tag: ['@import.image-fps'] }, async ({ page }) => {
    await openEditorWithSprite(page, EMPTY);
    await setFps(page, 6);

    // Import an image into the empty sprite.
    await browseImageFile(page, await createPngFile(page, 'image.png', FIRST_ROW));
    await confirmReplacement(page, () => clickWizardNext(page));
    await waitForGrid(page, 2, 2, FIRST_ROW);

    // It has the default FPS, not the one of the previous sprite.
    await assertFps(page, 12);
  });

  test('should keep the properties of the current sprite when combining', { tag: ['@import.combine-keeps-sprite'] }, async ({ page }) => {
    await openEditorWithSprite(page, DIAGONAL);

    // Download a sprite with its own name, description and FPS.
    const piskelFile = await downloadNamedPiskelFile(page, 'imported hero', 'the imported one', 6);

    // Change the properties of the current sprite and save them.
    await downloadNamedPiskelFile(page, 'current hero', 'the current one', 20);

    // Combine the file with it.
    await browsePiskelFile(page, piskelFile);
    await combineInWizard(page);

    // The sprite keeps its own properties.
    await assertSpriteName(page, 'current hero');
    await assertFps(page, 20);
    await assertSpriteDescription(page, 'the current one');
  });

  test('should select the first frame after combining', { tag: ['@import.combine-first-frame'] }, async ({ page }) => {
    const piskelFile = await createDiagonalPiskelFile(page);

    // Add a frame to the sprite and stay on it.
    await getAddFrameButton(page).click();
    await assertCurrentFrame(page, 1);

    // Combine the file with the sprite.
    await browsePiskelFile(page, piskelFile);
    await assertWizardStep(page, 'select mode');
    await clickWizardCombine(page);
    await assertWizardStep(page, 'insert location');
    await expect(getInsertFrameInput(page)).toHaveValue('2');
    await clickWizardNext(page);
    await assertNoDialogOpen(page);

    // The first frame is selected.
    await assertCurrentFrame(page, 0);
  });
});
