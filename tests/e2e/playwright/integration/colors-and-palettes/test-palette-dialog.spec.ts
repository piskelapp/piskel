import test, { expect, Page } from "@playwright/test";
import {
  assertPaletteDialogColors,
  assertPaletteDialogSelectedColor,
  assertPaletteOptions,
  assertPaletteSwatches,
  assertSelectedPalette,
  cancelPaletteDialog,
  clickPaletteDialogAddColor,
  createPaletteWithColors,
  dragPaletteDialogColor,
  getPaletteDialogButton,
  getPaletteNameInput,
  openCreatePaletteDialog,
  openEditor,
  openEditPaletteDialog,
  removePaletteDialogColor,
  savePaletteDialog,
  selectPaletteDialogColor,
  typePaletteDialogColor,
} from "../../testutils";

const RED = '#ff0000';
const GREEN = '#00ff00';
const BLUE = '#0000ff';
const YELLOW = '#ffff00';
const BLACK = '#000000';

const THREE_COLORS = 'Three colors';

/** Create a palette with three colors, and edit it */
const editPaletteWithThreeColors = async (page: Page) => {
  await openEditor(page);
  await createPaletteWithColors(page, THREE_COLORS, [RED, GREEN, BLUE]);
  await openEditPaletteDialog(page);
  await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);
};

test.describe('Changing colors in the palette dialog', () => {
  test('should add a copy of the selected color at the end, and select it', { tag: ['@colors-and-palettes.palette-dialog-add-copy'] }, async ({ page }) => {
    await editPaletteWithThreeColors(page);

    // Select the first color and add a color.
    await selectPaletteDialogColor(page, 0);
    await clickPaletteDialogAddColor(page);

    // There's a copy of it at the end, and the copy is selected.
    await assertPaletteDialogColors(page, [RED, GREEN, BLUE, RED]);
    await assertPaletteDialogSelectedColor(page, 3);
  });

  test('should change the selected color when typing a hex value', { tag: ['@colors-and-palettes.palette-dialog-edit-color'] }, async ({ page }) => {
    await editPaletteWithThreeColors(page);

    // Select the second color and type another one.
    await selectPaletteDialogColor(page, 1);
    await typePaletteDialogColor(page, YELLOW);
    await assertPaletteDialogColors(page, [RED, YELLOW, BLUE]);

    // The saved palette has it too.
    await savePaletteDialog(page);
    await assertPaletteSwatches(page, [RED, YELLOW, BLUE]);
  });

  const drags = [
    { title: 'forwards', from: 0, to: 2, reordered: [GREEN, BLUE, RED] },
    { title: 'backwards', from: 2, to: 0, reordered: [BLUE, RED, GREEN] },
    { title: 'to the next position', from: 0, to: 1, reordered: [GREEN, RED, BLUE] },
  ];

  for (const { title, from, to, reordered } of drags) {
    test(`should move a color ${title} by dragging it`, { tag: ['@colors-and-palettes.palette-dialog-reorder'] }, async ({ page }) => {
      await editPaletteWithThreeColors(page);

      // Drag the color.
      await dragPaletteDialogColor(page, from, to);

      // It moves in the list, and it's selected.
      await assertPaletteDialogColors(page, reordered);
      await assertPaletteDialogSelectedColor(page, to);

      // The saved palette keeps that order.
      await savePaletteDialog(page);
      await assertPaletteSwatches(page, reordered);
    });
  }

  test('should let all the colors be removed and saved', { tag: ['@colors-and-palettes.empty-palette'] }, async ({ page }) => {
    await editPaletteWithThreeColors(page);

    // Remove every color.
    await removePaletteDialogColor(page, 0);
    await removePaletteDialogColor(page, 0);
    await removePaletteDialogColor(page, 0);
    await assertPaletteDialogColors(page, []);

    // The palette is saved empty, and it's still there.
    await savePaletteDialog(page);
    await assertPaletteSwatches(page, []);
    await assertSelectedPalette(page, THREE_COLORS);
  });
});

test.describe('Actions of the palette dialog', () => {
  test('should offer importing when creating a palette', { tag: ['@colors-and-palettes.palette-dialog-buttons'] }, async ({ page }) => {
    await openEditor(page);

    await openCreatePaletteDialog(page);

    await expect(getPaletteDialogButton(page, 'import')).toBeVisible();
    await expect(getPaletteDialogButton(page, 'download')).toBeHidden();
    await expect(getPaletteDialogButton(page, 'delete')).toBeHidden();
  });

  test('should offer downloading and deleting when editing a palette', { tag: ['@colors-and-palettes.palette-dialog-buttons'] }, async ({ page }) => {
    await editPaletteWithThreeColors(page);

    await expect(getPaletteDialogButton(page, 'import')).toBeHidden();
    await expect(getPaletteDialogButton(page, 'download')).toBeVisible();
    await expect(getPaletteDialogButton(page, 'delete')).toBeVisible();
  });
});

test.describe('Cancelling the palette dialog', () => {
  test('should not create the palette', { tag: ['@colors-and-palettes.palette-dialog-cancel'] }, async ({ page }) => {
    await openEditor(page);

    // Start a new palette, and cancel.
    await openCreatePaletteDialog(page);
    await getPaletteNameInput(page).fill('Never saved');
    await cancelPaletteDialog(page);

    // There's no new palette.
    await assertPaletteOptions(page, ['Current colors']);
    await assertSelectedPalette(page, 'Current colors');
  });

  test('should discard the changes to an existing palette', { tag: ['@colors-and-palettes.palette-dialog-cancel'] }, async ({ page }) => {
    await editPaletteWithThreeColors(page);

    // Change everything, and cancel.
    await getPaletteNameInput(page).fill('Another name');
    await selectPaletteDialogColor(page, 0);
    await typePaletteDialogColor(page, YELLOW);
    await removePaletteDialogColor(page, 1);
    await clickPaletteDialogAddColor(page);
    await cancelPaletteDialog(page);

    // The palette is as it was.
    await assertPaletteOptions(page, ['Current colors', THREE_COLORS]);
    await assertPaletteSwatches(page, [RED, GREEN, BLUE]);

    // So is what the dialog shows.
    await openEditPaletteDialog(page);
    await expect(getPaletteNameInput(page)).toHaveValue(THREE_COLORS);
    await assertPaletteDialogColors(page, [RED, GREEN, BLUE]);
  });
});

test.describe('Saving an edited palette', () => {
  test('should replace it, and keep it selected', { tag: ['@colors-and-palettes.edit-save'] }, async ({ page }) => {
    await editPaletteWithThreeColors(page);

    // Change the name and the colors, and save.
    await getPaletteNameInput(page).fill('Renamed');
    await removePaletteDialogColor(page, 0);
    await savePaletteDialog(page);

    // There's no other palette, and this one is updated and selected.
    await assertPaletteOptions(page, ['Current colors', 'Renamed']);
    await assertSelectedPalette(page, 'Renamed');
    await assertPaletteSwatches(page, [GREEN, BLUE]);

    // Opening it again shows the changes.
    await openEditPaletteDialog(page);
    await expect(getPaletteNameInput(page)).toHaveValue('Renamed');
    await assertPaletteDialogColors(page, [GREEN, BLUE]);
  });
});

test.describe('Cloning the current colors', () => {
  test('should start with one black color when the sprite has no colors', { tag: ['@colors-and-palettes.clone-empty'] }, async ({ page }) => {
    await openEditor(page);
    await assertPaletteSwatches(page, []);

    // Edit the Current colors palette.
    await assertSelectedPalette(page, 'Current colors');
    await openEditPaletteDialog(page);

    await expect(getPaletteNameInput(page)).toHaveValue('Current colors clone');
    await assertPaletteDialogColors(page, [BLACK]);
  });
});
