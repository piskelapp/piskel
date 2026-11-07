import test, { Page } from "@playwright/test";
import {
  assertEmptyPaletteMessage,
  assertFrameCount,
  assertLayerFrames,
  assertPaletteSwatchCount,
  assertPaletteSwatches,
  assertPrimaryColor,
  assertSecondaryColor,
  assertSelectedPalette,
  assertSwatchHighlights,
  browseImageFile,
  clickTool,
  clickTransparentSwatchOfPrimaryColor,
  clickWizardNext,
  confirmReplacement,
  createDistinctColors,
  createPaletteWithColors,
  createPngFileFromColors,
  drawAtPixel,
  getAddFrameButton,
  getAddLayerButton,
  getPaletteSwatch,
  gridFromRows,
  openCreatePaletteDialog,
  openEditor,
  openEditorInNewPage,
  removePaletteDialogColor,
  savePaletteDialog,
  selectImportType,
  selectPalette,
  setPiskelFromGrid,
  setPiskelFromImageSrc,
  setPrimaryColor,
  typeInWizardField,
  wait,
  waitForGrid,
  assertColorRows,
} from "../../testutils";

/** 10x10 frames */
const EMPTY = [
  '..........',
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
const PIXEL_AT_0_0 = [
  'X.........',
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

const RED = '#ff0000';
const GREEN = '#00ff00';
const BLUE = '#0000ff';
const NOT_IN_THE_PALETTE = '#123456';
const TRANSPARENT_COLOR = 'rgba(0, 0, 0, 0)';

const openEditorWithThreeColors = async (page: Page) => {
  await openEditor(page);
  await createPaletteWithColors(page, 'Three colors', [RED, GREEN, BLUE]);
};

test.describe('Clicking swatches', () => {
  test('should set the secondary color with a right click', { tag: ['@colors-and-palettes.swatch-right-click'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);
    await assertPrimaryColor(page, '#000000');

    // Right click a swatch.
    await getPaletteSwatch(page, GREEN).click({ button: 'right' });

    // The secondary color changes, and the primary color doesn't.
    await assertSecondaryColor(page, GREEN);
    await assertPrimaryColor(page, '#000000');
  });

  test('should highlight the swatches of the current colors', { tag: ['@colors-and-palettes.swatch-highlight'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);

    // Neither default color is in this palette.
    await assertSwatchHighlights(page, { primary: null, secondary: null });

    // Pick a primary and a secondary color.
    await getPaletteSwatch(page, RED).click();
    await getPaletteSwatch(page, BLUE).click({ button: 'right' });
    await assertSwatchHighlights(page, { primary: RED, secondary: BLUE });

    // A color outside the palette removes its highlight.
    await setPrimaryColor(page, NOT_IN_THE_PALETTE);
    await assertSwatchHighlights(page, { primary: null, secondary: BLUE });
  });

  test('should show the primary highlight when both colors are the same', { tag: ['@colors-and-palettes.swatch-same-color'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);

    // Use the same swatch for both colors.
    await getPaletteSwatch(page, GREEN).click({ button: 'right' });
    await getPaletteSwatch(page, GREEN).click();

    await assertSwatchHighlights(page, { primary: GREEN, secondary: null });
  });

  test('should show a message for an empty palette', { tag: ['@colors-and-palettes.swatch-highlight', '@colors-and-palettes.empty-palette'] }, async ({ page }) => {
    await openEditor(page);

    // Create a palette and remove its only color.
    await openCreatePaletteDialog(page);
    await removePaletteDialogColor(page, 0);
    await savePaletteDialog(page);

    await assertPaletteSwatches(page, []);
    await assertEmptyPaletteMessage(page);
  });
});

test.describe('Choosing a palette', () => {
  test('should show the chosen palette and remember it in a new session', { tag: ['@colors-and-palettes.select-palette'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);
    await createPaletteWithColors(page, 'Two colors', [RED, BLUE]);

    // Choose the first palette.
    await selectPalette(page, 'Three colors');
    await assertPaletteSwatches(page, [RED, GREEN, BLUE]);

    // A new session opens with the same palette.
    const newSession = await openEditorInNewPage(page);
    await assertSelectedPalette(newSession, 'Three colors');
    await assertPaletteSwatches(newSession, [RED, GREEN, BLUE]);
  });
});

test.describe('Selecting colors with the keyboard', () => {
  /** Press a key, then check the primary color it should have given */
  const pressAndAssertPrimaryColor = async (page: Page, key: string, color: string) => {
    await page.keyboard.press(key);
    // Give a key that should do nothing the time to do something.
    await wait(100);
    await assertPrimaryColor(page, color);
  };

  test('should do nothing for a number past the end of the palette', { tag: ['@colors-and-palettes.number-keys-range'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);

    await pressAndAssertPrimaryColor(page, '3', BLUE);
    await pressAndAssertPrimaryColor(page, '4', BLUE);
    await pressAndAssertPrimaryColor(page, '9', BLUE);
  });

  test('should select the next and previous colors', { tag: ['@colors-and-palettes.prev-next'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);

    await pressAndAssertPrimaryColor(page, '1', RED);
    await pressAndAssertPrimaryColor(page, '>', GREEN);
    await pressAndAssertPrimaryColor(page, '>', BLUE);
    await pressAndAssertPrimaryColor(page, '<', GREEN);
    await pressAndAssertPrimaryColor(page, '<', RED);
  });

  test('should stop at the first and last colors', { tag: ['@colors-and-palettes.prev-next-ends'] }, async ({ page }) => {
    await openEditorWithThreeColors(page);

    // From the last color, > stays there.
    await pressAndAssertPrimaryColor(page, '3', BLUE);
    await pressAndAssertPrimaryColor(page, '>', BLUE);

    // From the first color, < stays there.
    await pressAndAssertPrimaryColor(page, '1', RED);
    await pressAndAssertPrimaryColor(page, '<', RED);
  });
});

test.describe('Color pickers', () => {
  test('should make a typed color fully opaque', { tag: ['@colors-and-palettes.picker-opaque'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Type a color that is half transparent.
    await setPrimaryColor(page, 'rgba(255, 0, 0, 0.5)');
    await assertPrimaryColor(page, RED);

    // It draws fully opaque.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await assertColorRows(page, [
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
    ]);
  });

  test('should offer a transparent swatch', { tag: ['@colors-and-palettes.picker-opaque'] }, async ({ page }) => {
    await openEditor(page);
    await assertPrimaryColor(page, '#000000');

    await clickTransparentSwatchOfPrimaryColor(page);

    await assertPrimaryColor(page, TRANSPARENT_COLOR);
  });
});

test.describe('Current colors palette', () => {
  test('should sort the colors by group, not in order of use', { tag: ['@colors-and-palettes.current-colors-order'] }, async ({ page }) => {
    await openEditor(page);

    // A sprite that uses these colors in a scrambled order.
    const image = await createPngFileFromColors(page, 'colors.png', [
      BLUE, '#ffffff', '#7a8a7a', '#1a0000', GREEN, '#ffe6e6', '#808080', RED, '#000000',
    ]);
    await setPiskelFromImageSrc(page, `data:image/png;base64,${image.base64}`);

    await assertPaletteSwatches(page, [
      // Very dark colors, by lightness.
      '#000000', '#1a0000',
      // Very bright colors, by lightness.
      '#ffe6e6', '#ffffff',
      // Grayish colors, by hue.
      '#808080', '#7a8a7a',
      // All other colors, by hue.
      RED, GREEN, BLUE,
    ]);
  });

  test('should gather the colors of every layer and frame, without transparent', { tag: ['@colors-and-palettes.current-colors-order'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');

    // Draw red on the first frame.
    await setPrimaryColor(page, RED);
    await drawAtPixel(page, 0, 0);
    await assertLayerFrames(page, 0, [PIXEL_AT_0_0]);

    // Draw green on a second frame.
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, GREEN);
    await drawAtPixel(page, 0, 0);
    await assertLayerFrames(page, 0, [PIXEL_AT_0_0, PIXEL_AT_0_0]);

    // Draw blue on a second layer, on that second frame.
    await getAddLayerButton(page).click();
    await setPrimaryColor(page, BLUE);
    await drawAtPixel(page, 0, 0);
    await assertLayerFrames(page, 1, [EMPTY, PIXEL_AT_0_0]);

    await assertPaletteSwatches(page, [RED, GREEN, BLUE]);
  });
});

test.describe('Palettes with many colors', () => {
  test('should show the first 256 colors of a palette', { tag: ['@colors-and-palettes.max-colors'] }, async ({ page }) => {
    await openEditor(page);
    const colors = createDistinctColors(300);

    await createPaletteWithColors(page, 'Many colors', colors);

    await assertPaletteSwatches(page, colors.slice(0, 256));
  });

  test('should show at most 256 current colors from one frame', { tag: ['@colors-and-palettes.max-colors'] }, async ({ page }) => {
    await openEditor(page);

    // A frame with 300 colors.
    const image = await createPngFileFromColors(page, 'colors.png', createDistinctColors(300));
    await setPiskelFromImageSrc(page, `data:image/png;base64,${image.base64}`);

    await assertPaletteSwatchCount(page, 256);
  });

  test('should show at most 256 current colors from several frames', { tag: ['@colors-and-palettes.max-colors'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await waitForGrid(page, 10, 10, EMPTY);

    // Import a spritesheet as two frames of 200 colors each, 400 colors in all.
    const image = await createPngFileFromColors(page, 'colors.png', createDistinctColors(400));
    await browseImageFile(page, image);
    await selectImportType(page, 'sheet');
    await typeInWizardField(page, 'frame-size-x', '200');
    await confirmReplacement(page, () => clickWizardNext(page));
    await assertFrameCount(page, 2);

    await assertPaletteSwatchCount(page, 256);
  });
});
