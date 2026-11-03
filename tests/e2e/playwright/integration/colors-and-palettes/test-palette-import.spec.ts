import fs from "fs/promises";
import test, { expect, Page } from "@playwright/test";
import {
  assertNoDialogOpen,
  assertNotification,
  assertPaletteDialogColorCount,
  assertPaletteDialogColors,
  assertPaletteOptions,
  assertPaletteSwatches,
  assertSelectedPalette,
  cancelPaletteDialog,
  createDistinctColors,
  createGplFile,
  createPaletteWithColors,
  createPngFileFromColors,
  createTextFile,
  downloadPiskelFile,
  dropFilesOnPixel,
  getPaletteNameInput,
  gridFromRows,
  importFileInPaletteDialog,
  importPiskelFile,
  openCreatePaletteDialog,
  openEditor,
  openEditorInNewPage,
  readPixelRows,
  removePaletteDialogColor,
  savePaletteDialog,
  setPiskelFromGrid,
  waitForGrid,
} from "../../testutils";

const RED = '#ff0000';
const GREEN = '#00ff00';
const BLUE = '#0000ff';
const BLACK = '#000000';

// The same three colors, in each format of palette file.
const PALETTE_FILES = [
  { format: '.gpl', file: createGplFile('colors.gpl', [RED, GREEN, BLUE]) },
  { format: '.pal', file: createTextFile('colors.pal', 'JASC-PAL\n0100\n3\n255 0 0\n0 255 0\n0 0 255\n') },
  { format: '.txt', file: createTextFile('colors.txt', '; a comment\nFFFF0000\nFF00FF00\nFF0000FF\n') },
];

const FILE_WITHOUT_COLORS = createTextFile('no-colors.gpl', 'GIMP Palette\nnothing here\n');

const openEditorAndPaletteDialog = async (page: Page) => {
  await openEditor(page);
  await openCreatePaletteDialog(page);
};

test.describe('Importing in the palette dialog', () => {
  for (const { format, file } of PALETTE_FILES) {
    test(`should load a ${format} file, named after the file`, { tag: ['@colors-and-palettes.import', '@colors-and-palettes.import-name'] }, async ({ page }) => {
      await openEditorAndPaletteDialog(page);

      await importFileInPaletteDialog(page, file);

      await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);
      await expect(getPaletteNameInput(page)).toHaveValue(file.name);
    });
  }

  test('should load each distinct color of an image, and add " palette" to its name', { tag: ['@colors-and-palettes.import', '@colors-and-palettes.import-name'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    // An image with a repeated color.
    await importFileInPaletteDialog(page, await createPngFileFromColors(page, 'hero.png', [RED, GREEN, RED, BLUE, GREEN]));

    await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);
    await expect(getPaletteNameInput(page)).toHaveValue('hero.png palette');
  });

  test('should sort the colors of an image like the Current colors palette', { tag: ['@colors-and-palettes.import-image-order'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    // An image with its colors in a scrambled order.
    await importFileInPaletteDialog(page, await createPngFileFromColors(page, 'colors.png', [BLUE, '#ffffff', RED, '#808080', GREEN, BLACK]));

    // Very dark, very bright, grayish, then the others by hue.
    await assertPaletteDialogColors(page, [BLACK, '#ffffff', '#808080', RED, GREEN, BLUE]);
  });

  test('should refuse an image with more than 256 colors', { tag: ['@colors-and-palettes.import-image-limit'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    await importFileInPaletteDialog(page, await createPngFileFromColors(page, 'many.png', createDistinctColors(257)));

    // A message gives the number of colors, and the dialog is unchanged.
    await assertNotification(page, 'Could not import palette : Too many colors : 257');
    await assertPaletteDialogColors(page, [BLACK]);
    await expect(getPaletteNameInput(page)).toHaveValue('New palette');
  });

  test('should accept an image with 256 colors', { tag: ['@colors-and-palettes.import-image-limit'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    await importFileInPaletteDialog(page, await createPngFileFromColors(page, 'many.png', createDistinctColors(256)));

    await assertPaletteDialogColorCount(page, 256);
  });

  test('should not save an imported palette until the save button is clicked', { tag: ['@colors-and-palettes.import-draft'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    // Import a file: nothing is saved yet.
    await importFileInPaletteDialog(page, createGplFile('colors.gpl', [RED, GREEN, BLUE]));
    await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);
    await assertPaletteOptions(page, ['Current colors']);

    // It can still be changed before saving.
    await removePaletteDialogColor(page, 1);
    await savePaletteDialog(page);

    await assertPaletteOptions(page, ['Current colors', 'colors.gpl']);
    await assertPaletteSwatches(page, [RED, BLUE]);
  });

  test('should not keep an imported palette when cancelling', { tag: ['@colors-and-palettes.import-draft'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    await importFileInPaletteDialog(page, createGplFile('colors.gpl', [RED, GREEN, BLUE]));
    await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);
    await cancelPaletteDialog(page);

    await assertPaletteOptions(page, ['Current colors']);
  });
});

test.describe('Dropping a palette file', () => {
  for (const { format, file } of PALETTE_FILES) {
    test(`should save and select a ${format} file`, { tag: ['@colors-and-palettes.drop', '@colors-and-palettes.import-name'] }, async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(['..', '..']));
      await waitForGrid(page, 2, 2, ['..', '..']);

      // Drop the file.
      await dropFilesOnPixel(page, [file]);

      // The palette is selected, without a dialog.
      await assertSelectedPalette(page, file.name);
      await assertPaletteSwatches(page, [RED, GREEN, BLUE]);
      await assertNoDialogOpen(page);

      // The sprite isn't touched.
      expect(await readPixelRows(page, 2, 2)).toEqual(['..', '..']);

      // It's saved: a new session offers it too.
      const newSession = await openEditorInNewPage(page);
      await assertPaletteOptions(newSession, ['Current colors', file.name]);
    });
  }
});

test.describe('Palette messages', () => {
  test('should confirm saving a palette', { tag: ['@colors-and-palettes.messages'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    await getPaletteNameInput(page).fill('My colors');
    await savePaletteDialog(page);

    await assertNotification(page, 'Palette My colors successfully saved !');
  });

  test('should show an error for a palette file that can not be read', { tag: ['@colors-and-palettes.messages'] }, async ({ page }) => {
    await openEditorAndPaletteDialog(page);

    await importFileInPaletteDialog(page, FILE_WITHOUT_COLORS);

    // An error shows, and the dialog is unchanged. The rest of the message isn't
    // checked: see docs/known-issues.md.
    await assertNotification(page, 'Could not import palette');
    await assertPaletteDialogColors(page, [BLACK]);
    await expect(getPaletteNameInput(page)).toHaveValue('New palette');
  });
});

test.describe('Palette storage', () => {
  test('should keep palettes in this browser, not in .piskel files', { tag: ['@colors-and-palettes.storage'] }, async ({ page, browser }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(['X.', '..']));
    await waitForGrid(page, 2, 2, ['X.', '..']);

    // Save a palette and download the sprite.
    await createPaletteWithColors(page, 'My colors', [RED, GREEN, BLUE]);
    const piskelPath = await downloadPiskelFile(page);

    // The file doesn't mention the palette.
    expect(await fs.readFile(piskelPath, 'utf-8')).not.toContain('My colors');

    // Another session of this browser has the palette.
    const newSession = await openEditorInNewPage(page);
    await assertPaletteOptions(newSession, ['Current colors', 'My colors']);

    // Another browser that opens the file gets the sprite, but not the palette.
    const otherBrowser = await browser.newContext();
    const otherPage = await otherBrowser.newPage();
    await openEditor(otherPage);
    await importPiskelFile(otherPage, piskelPath);
    await waitForGrid(otherPage, 2, 2, ['X.', '..']);
    await assertPaletteOptions(otherPage, ['Current colors']);
    await otherBrowser.close();
  });
});
