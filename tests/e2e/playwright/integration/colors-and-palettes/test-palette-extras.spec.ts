import test, { expect, Page } from "@playwright/test";
import fs from "fs/promises";
import {
  answerNextConfirm,
  assertNoDialogOpen,
  assertPaletteDialogColors,
  assertPaletteSwatches,
  assertSelectedPalette,
  createGplFile,
  createPaletteWithColors,
  getPaletteDialogButton,
  getPaletteNameInput,
  importFileInPaletteDialog,
  openCreatePaletteDialog,
  openEditPaletteDialog,
  openEditor,
  savePaletteDialog,
} from "../../testutils";

const RED = '#ff0000';
const GREEN = '#00ff00';
const BLUE = '#0000ff';

/** Names of the palettes offered in the palette list */
const getPaletteNames = (page: Page) =>
  page.locator('.palettes-list-select option').allInnerTexts();

test.describe('Palette extras — edit and delete', () => {

  test('edit palette button should open dialog with palette data', { tag: ['@colors-and-palettes.edit'] }, async ({ page }) => {
    // Create a palette, which becomes the selected one.
    await openEditor(page);
    await createPaletteWithColors(page, 'Edit Test', [RED, GREEN]);

    // The edit button opens the dialog on it.
    await openEditPaletteDialog(page);
    await expect(page.locator('.dialog-title')).toHaveText('Edit Palette');
    await expect(getPaletteNameInput(page)).toHaveValue('Edit Test');
    await assertPaletteDialogColors(page, [RED, GREEN]);

    // Only an existing palette can be downloaded or deleted, and only a new one gets
    // an import button.
    await expect(getPaletteDialogButton(page, 'download')).toBeVisible();
    await expect(getPaletteDialogButton(page, 'delete')).toBeVisible();
    await expect(getPaletteDialogButton(page, 'import')).toBeHidden();
  });

  test('delete palette should remove it after confirmation', { tag: ['@colors-and-palettes.delete'] }, async ({ page }) => {
    await openEditor(page);
    await createPaletteWithColors(page, 'Delete Me', [RED]);
    await openEditPaletteDialog(page);

    // Delete it, and accept the confirmation: it's no longer offered.
    const confirmation = answerNextConfirm(page, 'accept');
    await getPaletteDialogButton(page, 'delete').click();
    await confirmation;
    await assertNoDialogOpen(page);
    await expect.poll(() => getPaletteNames(page)).not.toContain('Delete Me');
  });

  test('delete palette cancel should keep the palette', { tag: ['@colors-and-palettes.delete'] }, async ({ page }) => {
    await openEditor(page);
    await createPaletteWithColors(page, 'Keep Me', [RED]);
    await openEditPaletteDialog(page);

    // Delete it, but cancel the confirmation.
    const confirmation = answerNextConfirm(page, 'dismiss');
    await getPaletteDialogButton(page, 'delete').click();
    await confirmation;

    // Close the dialog: the palette is still offered, and still selected.
    await page.locator('.dialog-close').click();
    await assertNoDialogOpen(page);
    expect(await getPaletteNames(page)).toContain('Keep Me');
    await assertSelectedPalette(page, 'Keep Me');
  });
});

test.describe('Palette extras — import .gpl', () => {

  test('importing a .gpl file should populate palette colors', { tag: ['@colors-and-palettes.import'] }, async ({ page }) => {
    // Import a GIMP palette with three colors in a new palette.
    await openEditor(page);
    await openCreatePaletteDialog(page);
    await importFileInPaletteDialog(page, createGplFile('test-palette.gpl', [RED, GREEN, BLUE]));
    await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);

    // Save it: its swatches are the three colors.
    await getPaletteNameInput(page).fill('Imported GPL');
    await savePaletteDialog(page);
    await assertSelectedPalette(page, 'Imported GPL');
    await assertPaletteSwatches(page, [RED, GREEN, BLUE]);
  });
});

test.describe('Palette extras — download .gpl', () => {

  test('download button should produce a valid .gpl file', { tag: ['@colors-and-palettes.download'] }, async ({ page }) => {
    await openEditor(page);
    await createPaletteWithColors(page, 'Download Test', [RED, BLUE]);
    await openEditPaletteDialog(page);

    // Download it.
    const downloadPromise = page.waitForEvent('download');
    await getPaletteDialogButton(page, 'download').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('Download Test.gpl');

    // It's a GIMP palette with the name and the colors, one per line.
    const content = await fs.readFile(await download.path(), 'utf-8');
    expect(content).toMatch(/^GIMP Palette/);
    expect(content).toContain('Name: Download Test');
    expect(content).toMatch(/^\s*255\s+0\s+0\b/m);
    expect(content).toMatch(/^\s*0\s+0\s+255\b/m);
  });
});
