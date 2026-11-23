import test, { expect, Page } from "@playwright/test";
import {
  answerNextConfirm,
  assertColorRows,
  waitForEditorReady,
  clickDeleteLocalSave,
  clickTool,
  drawAtPixel,
  gridFromColorRows,
  loadLocalSave,
  openBrowseLocalSaves,
  openEditor,
  openSaveSettingsPanel,
  saveInBrowser,
  setPiskelFromGrid,
  wait,
} from "../../testutils";

/** 10x10 sprites */
const SAVED_SPRITE = [
  'RG........',
  'B.........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
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

/** Check whether the header shows the sprite as changed since its last save, with a * */
const assertUnsavedChanges = async (page: Page, unsaved: boolean) => {
  const header = page.locator('.piskel-name');
  if (unsaved) {
    await expect(header).toContainText('*');
  } else {
    await expect(header).not.toContainText('*');
  }
};

/** Draw a black pixel at (0,0) with the pen, which leaves unsaved changes */
const drawUnsavedPixel = async (page: Page) => {
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 0, 0);
  await assertUnsavedChanges(page, true);
};

/** Record whether the page asks for a confirmation before unloading, and dismiss it */
const recordUnloadPrompt = (page: Page) => {
  const prompt = { shown: false, type: '' };
  page.on('dialog', async dialog => {
    prompt.shown = true;
    prompt.type = dialog.type();
    await dialog.dismiss();
  });
  return prompt;
};

test.describe('Save to browser (IndexedDB)', () => {

  test('should save a piskel to IndexedDB and show it in browse local dialog', { tag: ['@save-and-storage.browser-save', '@save-and-storage.browse-local', '@import.browse-local'] }, async ({ page }) => {
    // Save a sprite with a name.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(SAVED_SPRITE));
    await saveInBrowser(page, 'test-save-1', 'a test piskel');

    // The browse dialog lists it.
    await openBrowseLocalSaves(page);
    await expect(page.locator('.local-piskel-name', { hasText: 'test-save-1' })).toBeVisible();
  });

  test('name and description should persist in save panel', { tag: ['@save-and-storage.descriptor'] }, async ({ page }) => {
    // Save with a name and a description.
    await openEditor(page);
    await saveInBrowser(page, 'my-sprite', 'pixel art test');

    // The save panel shows them again.
    await openSaveSettingsPanel(page);
    await expect(page.locator('#save-name')).toHaveValue('my-sprite');
    await expect(page.locator('#save-description')).toHaveValue('pixel art test');
  });
});

test.describe('Header dirty indicator', () => {

  test('header should show sprite name without * on fresh load', { tag: ['@save-and-storage.dirty-indicator'] }, async ({ page }) => {
    await openEditor(page);
    await assertUnsavedChanges(page, false);
  });

  test('header should show * after drawing (dirty state)', { tag: ['@save-and-storage.dirty-indicator'] }, async ({ page }) => {
    await openEditor(page);
    await drawUnsavedPixel(page);
  });

  test('header should remove * after saving to IndexedDB', { tag: ['@save-and-storage.dirty-indicator'] }, async ({ page }) => {
    await openEditor(page);
    await drawUnsavedPixel(page);

    await saveInBrowser(page, 'clean-save');
    await assertUnsavedChanges(page, false);
  });

  test('header should show the sprite name from save panel', { tag: ['@save-and-storage.header-name'] }, async ({ page }) => {
    await openEditor(page);

    await saveInBrowser(page, 'my-custom-name');
    await expect(page.locator('.piskel-name')).toContainText('my-custom-name');
  });
});

test.describe('Browse local saves dialog', () => {

  test('should load a saved piskel and verify pixel content', { tag: ['@save-and-storage.browse-local-load'] }, async ({ page }) => {
    // Save a sprite, then replace it with an empty one.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(SAVED_SPRITE));
    await saveInBrowser(page, 'load-test');
    await setPiskelFromGrid(page, gridFromColorRows(EMPTY));

    // Load the save: its pixels are back.
    await openBrowseLocalSaves(page);
    await loadLocalSave(page, 'load-test');
    await assertColorRows(page, SAVED_SPRITE);
  });

  test('should delete a saved piskel', { tag: ['@save-and-storage.browse-local-delete'] }, async ({ page }) => {
    // Save a sprite: the browse dialog lists it.
    await openEditor(page);
    await saveInBrowser(page, 'delete-me');
    await openBrowseLocalSaves(page);
    const savedName = page.locator('.local-piskel-name', { hasText: 'delete-me' });
    await expect(savedName).toBeVisible();

    // Delete it, accepting the confirmation: it's no longer listed.
    await clickDeleteLocalSave(page, 'delete-me', { accept: true });
    await expect(savedName).not.toBeAttached();
  });

  test('should list multiple saved piskels', { tag: ['@save-and-storage.browse-local'] }, async ({ page }) => {
    // Save two sprites with different names: both are listed.
    await openEditor(page);
    await saveInBrowser(page, 'piskel-alpha');
    await saveInBrowser(page, 'piskel-beta');

    await openBrowseLocalSaves(page);
    await expect(page.locator('.local-piskel-name', { hasText: 'piskel-alpha' })).toBeVisible();
    await expect(page.locator('.local-piskel-name', { hasText: 'piskel-beta' })).toBeVisible();
  });

  test('loading while dirty should prompt confirm — accept loads the piskel', { tag: ['@save-and-storage.browse-local-load'] }, async ({ page }) => {
    // Save a sprite, then draw on it without saving.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(SAVED_SPRITE));
    await saveInBrowser(page, 'confirm-test');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await assertUnsavedChanges(page, true);

    // Load the save: a confirmation warns about erasing the changes. Accept it.
    await openBrowseLocalSaves(page);
    const confirmation = answerNextConfirm(page, 'accept');
    await page.locator('[data-action="load"][data-name="confirm-test"]').click();
    expect(await confirmation).toContain('erase');

    // The saved pixels are back, without the drawing.
    await assertColorRows(page, SAVED_SPRITE);
  });

  test('loading while dirty should prompt confirm — dismiss keeps current piskel', { tag: ['@save-and-storage.browse-local-load'] }, async ({ page }) => {
    // Save a sprite, then replace it with an empty one and draw a black pixel.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows(SAVED_SPRITE));
    await saveInBrowser(page, 'dismiss-test');
    await setPiskelFromGrid(page, gridFromColorRows(EMPTY));
    await drawUnsavedPixel(page);
    const drawing = [
      'K.........',
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
    await assertColorRows(page, drawing);

    // Load the save, and dismiss the confirmation: nothing is loaded.
    await openBrowseLocalSaves(page);
    const confirmation = answerNextConfirm(page, 'dismiss');
    await page.locator('[data-action="load"][data-name="dismiss-test"]').click();
    await confirmation;
    // Give the load the time to happen, if it wrongly did.
    await wait(500);
    await assertColorRows(page, drawing);
  });
});

test.describe('Beforeunload prompt', () => {

  test('dirty piskel should trigger beforeunload dialog on reload', { tag: ['@save-and-storage.unload-confirm'] }, async ({ page }) => {
    await openEditor(page);
    await drawUnsavedPixel(page);

    // Reload: the page asks to confirm. Dismissing it cancels the reload.
    const prompt = recordUnloadPrompt(page);
    await page.reload({ timeout: 3000 }).catch(() => {});
    expect(prompt.shown).toBe(true);
    expect(prompt.type).toBe('beforeunload');
  });

  test('clean piskel should NOT trigger beforeunload dialog on reload', { tag: ['@save-and-storage.unload-confirm'] }, async ({ page }) => {
    // Without changes, the reload goes through without a confirmation.
    await openEditor(page);
    const prompt = recordUnloadPrompt(page);
    await page.reload();
    await waitForEditorReady(page);
    expect(prompt.shown).toBe(false);
  });

  test('saved piskel should NOT trigger beforeunload dialog on reload', { tag: ['@save-and-storage.unload-confirm'] }, async ({ page }) => {
    // Draw, then save.
    await openEditor(page);
    await drawUnsavedPixel(page);
    await saveInBrowser(page, 'beforeunload-test');
    await assertUnsavedChanges(page, false);

    // The reload goes through without a confirmation.
    const prompt = recordUnloadPrompt(page);
    await page.reload();
    await waitForEditorReady(page);
    expect(prompt.shown).toBe(false);
  });
});
