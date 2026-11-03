import test, { expect, Page } from "@playwright/test";
import {
  assertFps,
  assertHiddenFrames,
  assertLayerFrames,
  assertLayerNames,
  assertLocalSaves,
  assertNoDialogOpen,
  assertNotification,
  assertSavePanelFields,
  assertSettingsDrawerOpen,
  assertSpriteTitle,
  assertTopLayerOpacity,
  clickTool,
  closeSaveDrawer,
  CMD_OR_CTRL,
  downloadPiskelFile,
  drawAtPixel,
  dropFilesOnPixel,
  fillSpriteTitleAndDescription,
  getAddFrameButton,
  getAddLayerButton,
  getDownloadFileName,
  gridFromRows,
  letTimePass,
  loadLocalSave,
  openBackupsInNewTab,
  openBrowseLocalSaves,
  openEditor,
  openEditorInNewPage,
  openEditorWithFakeClock,
  pressEnterInSaveForm,
  readPiskelFile,
  renameCurrentLayer,
  restoreSnapshot,
  saveInBrowser,
  setFps,
  setPiskelFromGrid,
  setTopLayerOpacity,
  testId,
  toggleFrameVisibility,
  viewBackupSession,
  waitForGrid,
} from "../../testutils";

const TITLE = 'my sprite';
const DESCRIPTION = 'my description';

/** Make a sprite with something to lose in each part of a save */
const makeSpriteWithEverything = async (page: Page) => {
  // Two frames on a first layer.
  await setPiskelFromGrid(page, gridFromRows(['X.', '..']));
  await waitForGrid(page, 2, 2, ['X.', '..']);
  await getAddFrameButton(page).click();
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 1, 1);
  await waitForGrid(page, 2, 2, ['..', '.X'], { frameIndex: 1 });

  // A second layer, with a name and an opacity.
  await getAddLayerButton(page).click();
  await renameCurrentLayer(page, 'top layer');
  await drawAtPixel(page, 0, 1);
  await waitForGrid(page, 2, 2, ['..', 'X.'], { layerIndex: 1, frameIndex: 1 });
  await setTopLayerOpacity(page, 0.5);

  // A hidden frame and another FPS.
  await toggleFrameVisibility(page, 0);
  await assertHiddenFrames(page, [0]);
  await setFps(page, 7);

  await saveInBrowser(page, TITLE, DESCRIPTION);
};

const assertSpriteHasEverything = async (page: Page) => {
  await assertLayerFrames(page, 0, [['X.', '..'], ['..', '.X']]);
  await assertLayerFrames(page, 1, [['..', '..'], ['..', 'X.']]);
  await assertLayerNames(page, ['top layer', 'Base layer']);
  await assertTopLayerOpacity(page, 0.5);
  await assertHiddenFrames(page, [0]);
  await assertFps(page, 7);
  await assertSavePanelFields(page, TITLE, DESCRIPTION);
};

test.describe('What a save contains', () => {
  test('should keep the whole sprite in a browser save', { tag: ['@save-and-storage.saved-content'] }, async ({ page }) => {
    await openEditor(page);
    await makeSpriteWithEverything(page);

    // Load it in a new session.
    const newSession = await openEditorInNewPage(page);
    await openBrowseLocalSaves(newSession);
    await loadLocalSave(newSession, TITLE);

    await assertSpriteHasEverything(newSession);
  });

  test('should keep the whole sprite in a .piskel file', { tag: ['@save-and-storage.saved-content', '@save-and-storage.piskel-file'] }, async ({ page }) => {
    await openEditor(page);
    await makeSpriteWithEverything(page);
    const file = await readPiskelFile(await downloadPiskelFile(page));

    // Open the file in a new session.
    const newSession = await openEditorInNewPage(page);
    newSession.once('dialog', (dialog) => dialog.accept());
    await dropFilesOnPixel(newSession, [file]);

    await assertSpriteHasEverything(newSession);
  });

  test('should keep the whole sprite in a backup', { tag: ['@save-and-storage.saved-content'] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    await makeSpriteWithEverything(page);
    await letTimePass(page, 60 * 1000);

    // Restore it in a new session.
    const tab = await openBackupsInNewTab(page);
    await viewBackupSession(tab, 0, 1);
    await restoreSnapshot(tab, 0);
    await assertNoDialogOpen(tab);

    await assertSpriteHasEverything(tab);
  });
});

test.describe('Title and description', () => {
  const EDITED_TITLE = 'edited title';
  const EDITED_DESCRIPTION = 'edited description';

  test('should apply the edits when pressing Enter in the form', { tag: ['@save-and-storage.descriptor'] }, async ({ page }) => {
    await openEditor(page);
    await fillSpriteTitleAndDescription(page, EDITED_TITLE, EDITED_DESCRIPTION);

    await pressEnterInSaveForm(page);

    await assertSettingsDrawerOpen(page, false);
    await assertSpriteTitle(page, EDITED_TITLE);
    await assertSavePanelFields(page, EDITED_TITLE, EDITED_DESCRIPTION);

    // Enter saves in the browser.
    await openBrowseLocalSaves(page);
    await assertLocalSaves(page, [EDITED_TITLE]);
  });

  test('should apply the edits when saving as a .piskel file', { tag: ['@save-and-storage.descriptor'] }, async ({ page }) => {
    await openEditor(page);
    await fillSpriteTitleAndDescription(page, EDITED_TITLE, EDITED_DESCRIPTION);

    const fileName = await getDownloadFileName(page, () => testId(page, 'save-file-download-button').click());

    expect(fileName).toContain(EDITED_TITLE);
    await assertSettingsDrawerOpen(page, false);
    await assertSpriteTitle(page, EDITED_TITLE);
    await assertSavePanelFields(page, EDITED_TITLE, EDITED_DESCRIPTION);
  });

  test('should discard the edits when closing the drawer without saving', { tag: ['@save-and-storage.descriptor'] }, async ({ page }) => {
    await openEditor(page);
    await fillSpriteTitleAndDescription(page, EDITED_TITLE, EDITED_DESCRIPTION);

    await closeSaveDrawer(page);

    await assertSpriteTitle(page, 'New Piskel');
    await assertSavePanelFields(page, 'New Piskel', '');
  });
});

test.describe('Saving with the keyboard', () => {
  test('should save the sprite in the browser under its title', { tag: ['@save-and-storage.browser-save'] }, async ({ page }) => {
    await openEditor(page);

    // setPiskelFromGrid gives the sprite the title "test".
    await setPiskelFromGrid(page, gridFromRows(['X.', '..']));
    await waitForGrid(page, 2, 2, ['X.', '..']);

    await page.keyboard.press(`${CMD_OR_CTRL}+s`);
    await assertNotification(page, 'Successfully saved !');

    // Load it in a new session.
    const newSession = await openEditorInNewPage(page);
    await openBrowseLocalSaves(newSession);
    await loadLocalSave(newSession, 'test');
    await waitForGrid(newSession, 2, 2, ['X.', '..']);
  });
});

// The title isn't checked for characters like a double quote or for being empty, because
// of two bugs: see docs/known-issues.md. The * right after opening a sprite isn't tested
// either, for the same reason.
