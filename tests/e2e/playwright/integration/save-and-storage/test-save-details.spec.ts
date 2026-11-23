import test, { Dialog, expect, Page } from "@playwright/test";
import {
  assertLocalSaveDates,
  assertLocalSaves,
  assertNotification,
  assertSettingsDrawerOpen,
  assertSpriteTitle,
  clickDeleteLocalSave,
  clickTool,
  CMD_OR_CTRL,
  drawAtPixel,
  getDownloadFileName,
  getExportDownloadButton,
  getSaveButtonsDisabledStates,
  getSaveInBrowserButton,
  gridFromRows,
  loadLocalSave,
  makeBrowserSavesFail,
  makeDownloadsFail,
  openBrowseLocalSaves,
  openEditor,
  openEditorInNewPage,
  openExportSettingsPanel,
  openSaveSettingsPanel,
  recordSaveButtonsDisabledStates,
  redo,
  saveInBrowser,
  selectExportTab,
  setPiskelFromGrid,
  testId,
  undo,
  wait,
  waitForGrid,
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
const PIXEL_AT_1_0 = [
  '.X........',
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

const SAVED_MESSAGE = 'Successfully saved !';

/** Open the editor with an unsaved drawing, so that the title has a * */
const openEditorWithDrawing = async (page: Page) => {
  await openEditor(page);
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 0, 0);
  await assertSpriteTitle(page, 'New Piskel *');
};

test.describe('Saving again', () => {
  test('should overwrite a save with the same title, without asking', { tag: ['@save-and-storage.browser-overwrite'] }, async ({ page }) => {
    // Record any question asked while saving.
    const dialogs: string[] = [];
    const recordDialog = (dialog: Dialog) => {
      dialogs.push(dialog.message());
      dialog.accept();
    };
    page.on('dialog', recordDialog);
    await openEditor(page);

    // Save a first sprite.
    await setPiskelFromGrid(page, gridFromRows(PIXEL_AT_0_0));
    await waitForGrid(page, 10, 10, PIXEL_AT_0_0);
    await saveInBrowser(page, 'my sprite');

    // Save another sprite with the same title.
    await setPiskelFromGrid(page, gridFromRows(PIXEL_AT_1_0));
    await waitForGrid(page, 10, 10, PIXEL_AT_1_0);
    await saveInBrowser(page, 'my sprite');
    expect(dialogs).toEqual([]);
    page.off('dialog', recordDialog);

    // There's one save, with the second sprite.
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await waitForGrid(page, 10, 10, EMPTY);
    await openBrowseLocalSaves(page);
    await assertLocalSaves(page, ['my sprite']);
    await loadLocalSave(page, 'my sprite');
    await waitForGrid(page, 10, 10, PIXEL_AT_1_0);
  });
});

test.describe('Browse local saves', () => {
  test.use({ timezoneId: 'UTC' });

  test('should list the saves with their date, newest first', { tag: ['@save-and-storage.browse-local'] }, async ({ page }) => {
    await openEditor(page);

    // Save three sprites, in another order than their dates and their titles.
    await page.clock.setFixedTime(new Date('2026-03-02T10:20:00Z'));
    await saveInBrowser(page, 'middle');
    await page.clock.setFixedTime(new Date('2026-03-01T09:05:00Z'));
    await saveInBrowser(page, 'oldest');
    await page.clock.setFixedTime(new Date('2026-03-03T11:30:00Z'));
    await saveInBrowser(page, 'newest');

    await openBrowseLocalSaves(page);

    await assertLocalSaves(page, ['newest', 'middle', 'oldest']);
    await assertLocalSaveDates(page, ['2026/03/03 11:30', '2026/03/02 10:20', '2026/03/01 09:05']);
  });

  test('should keep a save when cancelling its deletion', { tag: ['@save-and-storage.browse-local-delete'] }, async ({ page }) => {
    await openEditor(page);
    await saveInBrowser(page, 'my sprite');
    await openBrowseLocalSaves(page);

    await clickDeleteLocalSave(page, 'my sprite', { accept: false });

    // Give the list the time to change, then check it in a new session too.
    await wait(200);
    await assertLocalSaves(page, ['my sprite']);
    const newSession = await openEditorInNewPage(page);
    await openBrowseLocalSaves(newSession);
    await assertLocalSaves(newSession, ['my sprite']);
  });

  test('should delete only the chosen save', { tag: ['@save-and-storage.browse-local-delete'] }, async ({ page }) => {
    await openEditor(page);
    await saveInBrowser(page, 'first');
    await saveInBrowser(page, 'second');
    await openBrowseLocalSaves(page);
    await assertLocalSaves(page, ['second', 'first']);

    await clickDeleteLocalSave(page, 'second', { accept: true });
    await assertLocalSaves(page, ['first']);

    // It's the same in a new session.
    const newSession = await openEditorInNewPage(page);
    await openBrowseLocalSaves(newSession);
    await assertLocalSaves(newSession, ['first']);
  });
});

test.describe('Save feedback', () => {
  test('should confirm a save in the drawer, and close the drawer', { tag: ['@save-and-storage.save-feedback'] }, async ({ page }) => {
    await openEditorWithDrawing(page);

    await openSaveSettingsPanel(page);
    await getSaveInBrowserButton(page).click();

    await assertNotification(page, SAVED_MESSAGE);
    await assertSettingsDrawerOpen(page, false);
    await assertSpriteTitle(page, 'New Piskel');
  });

  test('should confirm a save with the keyboard', { tag: ['@save-and-storage.save-feedback'] }, async ({ page }) => {
    await openEditorWithDrawing(page);

    await page.keyboard.press(`${CMD_OR_CTRL}+s`);

    await assertNotification(page, SAVED_MESSAGE);
    await assertSpriteTitle(page, 'New Piskel');
  });

  test('should show an error when a save in the browser fails', { tag: ['@save-and-storage.save-feedback'] }, async ({ page }) => {
    await openEditorWithDrawing(page);
    await makeBrowserSavesFail(page);

    await openSaveSettingsPanel(page);
    await getSaveInBrowserButton(page).click();

    // The rest of the message isn't checked: see docs/known-issues.md.
    await assertNotification(page, 'Saving failed');

    // The drawer stays open, with its buttons usable, and the sprite stays unsaved.
    await assertSettingsDrawerOpen(page, true);
    await expect(getSaveInBrowserButton(page)).toBeEnabled();
    await assertSpriteTitle(page, 'New Piskel *');
  });

  test('should show an error when downloading a file fails', { tag: ['@save-and-storage.save-feedback'] }, async ({ page }) => {
    await openEditorWithDrawing(page);
    await makeDownloadsFail(page);

    await openSaveSettingsPanel(page);
    await testId(page, 'save-file-download-button').click();

    await assertNotification(page, 'Saving failed : download refused');
    await assertSettingsDrawerOpen(page, true);
    await expect(testId(page, 'save-file-download-button')).toBeEnabled();
    await assertSpriteTitle(page, 'New Piskel *');
  });

  test('should disable the save buttons while saving', { tag: ['@save-and-storage.save-feedback'] }, async ({ page }) => {
    await openEditor(page);
    await openSaveSettingsPanel(page);
    await recordSaveButtonsDisabledStates(page);

    await getSaveInBrowserButton(page).click();
    await assertNotification(page, SAVED_MESSAGE);

    // Both buttons are disabled during the save, then enabled.
    expect(await getSaveButtonsDisabledStates(page)).toEqual([[true, true], [false, false]]);
  });
});

test.describe('Unsaved changes and undo', () => {
  const undoAndAssertTitle = async (page: Page, title: string) => {
    await wait(100);
    await undo(page);
    await assertSpriteTitle(page, title);
  };

  const redoAndAssertTitle = async (page: Page, title: string) => {
    await wait(100);
    await redo(page);
    await assertSpriteTitle(page, title);
  };

  test('should count a new sprite as saved', { tag: ['@save-and-storage.dirty-undo'] }, async ({ page }) => {
    await openEditorWithDrawing(page);

    await undoAndAssertTitle(page, 'New Piskel');
    await redoAndAssertTitle(page, 'New Piskel *');
  });

  test('should follow the saved state when undoing and redoing', { tag: ['@save-and-storage.dirty-undo'] }, async ({ page }) => {
    await openEditorWithDrawing(page);
    await saveInBrowser(page, 'my sprite');
    await assertSpriteTitle(page, 'my sprite');

    // Draw after the save.
    await drawAtPixel(page, 1, 1);
    await assertSpriteTitle(page, 'my sprite *');

    // Undo back to the saved state, then further back.
    await undoAndAssertTitle(page, 'my sprite');
    await undoAndAssertTitle(page, 'my sprite *');

    // Redo back to the saved state, then further on.
    await redoAndAssertTitle(page, 'my sprite');
    await redoAndAssertTitle(page, 'my sprite *');
  });
});

test.describe('File names', () => {
  test.use({ timezoneId: 'UTC' });

  test('should name a .piskel file after the title, the date and the time', { tag: ['@save-and-storage.file-names'] }, async ({ page }) => {
    await openEditor(page);
    await saveInBrowser(page, 'my sprite');
    await page.clock.setFixedTime(new Date('2026-03-04T05:06:07Z'));

    await openSaveSettingsPanel(page);
    const fileName = await getDownloadFileName(page, () => testId(page, 'save-file-download-button').click());

    expect(fileName).toBe('my sprite-20260304-050607.piskel');
  });

  const EXPORTS = [
    { name: 'PNG', tab: 'png', button: 'png', fileName: 'my sprite.png' },
    { name: 'PixiJS', tab: 'png', button: 'pixi', fileName: 'my sprite.zip' },
    { name: 'GIF', tab: 'gif', button: 'gif', fileName: 'my sprite.gif' },
    { name: 'ZIP', tab: 'zip', button: 'zip', fileName: 'my sprite.zip' },
    { name: 'C file', tab: 'misc', button: 'c', fileName: 'my sprite.c' },
  ] as const;

  for (const { name, tab, button, fileName } of EXPORTS) {
    test(`should name a ${name} export after the title`, { tag: ['@save-and-storage.file-names'] }, async ({ page }) => {
      await openEditor(page);
      await saveInBrowser(page, 'my sprite');

      await openExportSettingsPanel(page);
      await selectExportTab(page, tab);

      expect(await getDownloadFileName(page, () => getExportDownloadButton(page, button).click())).toBe(fileName);
    });
  }

  // The selected frame gets a name ending in .png.png, so it isn't tested here: see
  // docs/known-issues.md.
});
