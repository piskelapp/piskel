import test, { expect, Page } from "@playwright/test";
import {
  clickTool,
  colorToInt,
  drawAtPixel,
  getPixelColor,
  openEditor,
  openImportSettingsPanel,
  openSaveSettingsPanel,
  setPiskelFromGrid,
  wait,
  waitFor
} from "../../testutils";

/** Get the header sprite name text (includes " *" when dirty) */
async function getHeaderName(page: Page): Promise<string> {
  return await page.locator('.piskel-name').innerText();
}

/** Save the current piskel to IndexedDB via the Save panel */
async function saveToIndexedDb(page: Page, name?: string, description?: string) {
  await openSaveSettingsPanel(page);

  if (name !== undefined) {
    await page.locator('#save-name').fill(name);
  }
  if (description !== undefined) {
    await page.locator('#save-description').fill(description);
  }

  await page.locator('#save-localstorage-button').click();
  await wait(500);
}

/** Open the Browse Local Saves dialog */
async function openBrowseLocalDialog(page: Page) {
  await openImportSettingsPanel(page);
  await page.locator('.browse-local-button').click();
  await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();
  await expect(page.locator('.local-piskel-list')).toBeAttached();
}

test.describe('Save to browser (IndexedDB)', () => {

  test('should save a piskel to IndexedDB and show it in browse local dialog', async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, [['R', 'T'], ['T', 'B']]);

    // Save with a custom name
    await saveToIndexedDb(page, 'test-save-1', 'a test piskel');

    // Open browse local dialog and verify the saved piskel appears
    await openBrowseLocalDialog(page);

    const items = page.locator('.local-piskel-item');
    await expect(items).not.toHaveCount(0);

    // Find our saved piskel by name
    const nameCell = page.locator('.local-piskel-name', { hasText: 'test-save-1' });
    await expect(nameCell).toBeVisible();
  });

  test('name and description should persist in save panel', async ({ page }) => {
    await openEditor(page);

    // Set name and description, save
    await saveToIndexedDb(page, 'my-sprite', 'pixel art test');

    // Reopen save panel — fields should retain the values
    await openSaveSettingsPanel(page);
    await expect(page.locator('#save-name')).toHaveValue('my-sprite');
    await expect(page.locator('#save-description')).toHaveValue('pixel art test');
  });
});

test.describe('Header dirty indicator', () => {

  test('header should show sprite name without * on fresh load', async ({ page }) => {
    await openEditor(page);

    const name = await getHeaderName(page);
    expect(name).not.toContain('*');
  });

  test('header should show * after drawing (dirty state)', async ({ page }) => {
    await openEditor(page);

    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);

    await waitFor(async () => (await getHeaderName(page)).includes('*'));
    const name = await getHeaderName(page);
    expect(name).toContain('*');
  });

  test('header should remove * after saving to IndexedDB', async ({ page }) => {
    await openEditor(page);

    // Make a change to dirty the state
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await getHeaderName(page)).includes('*'));

    // Save to IndexedDB
    await saveToIndexedDb(page, 'clean-save');

    // Dirty indicator should be gone
    await waitFor(async () => !(await getHeaderName(page)).includes('*'));
    const name = await getHeaderName(page);
    expect(name).not.toContain('*');
  });

  test('header should show the sprite name from save panel', async ({ page }) => {
    await openEditor(page);

    await saveToIndexedDb(page, 'my-custom-name');

    await waitFor(async () => (await getHeaderName(page)).includes('my-custom-name'));
    expect(await getHeaderName(page)).toContain('my-custom-name');
  });
});

test.describe('Browse local saves dialog', () => {

  test('should load a saved piskel and verify pixel content', async ({ page }) => {
    await openEditor(page);

    // Draw a known pattern and save
    await setPiskelFromGrid(page, [['R', 'G'], ['B', 'T']]);
    await saveToIndexedDb(page, 'load-test');

    // Clear canvas
    await setPiskelFromGrid(page, [['T', 'T'], ['T', 'T']]);

    // Open browse local and load
    await openBrowseLocalDialog(page);

    // Accept the confirm dialog that appears on load
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="load"][data-name="load-test"]').click();
    await wait(1000);

    // Verify pixel content was restored
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 1, 0)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 1)).toBe(colorToInt('#0000FF'));
    expect(await getPixelColor(page, 1, 1)).toBe(0); // transparent
  });

  test('should delete a saved piskel', async ({ page }) => {
    await openEditor(page);

    // Save a piskel
    await saveToIndexedDb(page, 'delete-me');

    // Open browse local dialog
    await openBrowseLocalDialog(page);

    // Verify it exists
    await expect(page.locator('.local-piskel-name', { hasText: 'delete-me' })).toBeVisible();

    // Delete it (accept confirm dialog)
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="delete"][data-name="delete-me"]').click();
    await wait(500);

    // Verify it's gone from the list
    await expect(page.locator('.local-piskel-name', { hasText: 'delete-me' })).not.toBeAttached();
  });

  test('should list multiple saved piskels', async ({ page }) => {
    await openEditor(page);

    // Save two piskels with different names
    await saveToIndexedDb(page, 'piskel-alpha');
    await saveToIndexedDb(page, 'piskel-beta');

    // Open browse local dialog
    await openBrowseLocalDialog(page);

    // Both should appear
    await expect(page.locator('.local-piskel-name', { hasText: 'piskel-alpha' })).toBeVisible();
    await expect(page.locator('.local-piskel-name', { hasText: 'piskel-beta' })).toBeVisible();
  });

  test('loading while dirty should prompt confirm — accept loads the piskel', async ({ page }) => {
    await openEditor(page);

    // Save a piskel first
    await setPiskelFromGrid(page, [['R', 'G'], ['B', 'T']]);
    await saveToIndexedDb(page, 'confirm-test');

    // Make the canvas dirty by drawing
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    await waitFor(async () => (await getHeaderName(page)).includes('*'));

    // Open browse local and click load
    await openBrowseLocalDialog(page);

    // Capture dialog message and accept
    let dialogMessage = '';
    page.once('dialog', dialog => {
      dialogMessage = dialog.message();
      dialog.accept();
    });
    await page.locator('[data-action="load"][data-name="confirm-test"]').click();

    // Wait for load to complete
    await waitFor(async () => (await getPixelColor(page, 0, 0)) === colorToInt('#FF0000'));

    expect(dialogMessage).toContain('erase');
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000'));
  });

  test('loading while dirty should prompt confirm — dismiss keeps current piskel', async ({ page }) => {
    await openEditor(page);

    // Save a clean piskel
    await setPiskelFromGrid(page, [['R', 'G'], ['B', 'T']]);
    await saveToIndexedDb(page, 'dismiss-test');

    // Replace with a different pattern and make it dirty
    await setPiskelFromGrid(page, [['T', 'T'], ['T', 'T']]);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0); // draws black at (0,0)
    await waitFor(async () => (await getHeaderName(page)).includes('*'));

    const blackPixel = await getPixelColor(page, 0, 0);

    // Open browse local and click load
    await openBrowseLocalDialog(page);

    // Dismiss the confirm dialog — should NOT load
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('[data-action="load"][data-name="dismiss-test"]').click();
    await wait(500);

    // Current pixel should still be the black we drew, not the saved red
    expect(await getPixelColor(page, 0, 0)).toBe(blackPixel);
    expect(await getPixelColor(page, 0, 0)).not.toBe(colorToInt('#FF0000'));
  });
});

test.describe('Beforeunload prompt', () => {

  test('dirty piskel should trigger beforeunload dialog on reload', async ({ page }) => {
    await openEditor(page);

    // Make canvas dirty
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await getHeaderName(page)).includes('*'));

    // Attempt reload — should trigger beforeunload dialog
    let dialogFired = false;
    let dialogMessage = '';
    let dialogType = '';
    page.on('dialog', async dialog => {
      dialogFired = true;
      dialogMessage = dialog.message();
      dialogType = dialog.type();
      await dialog.dismiss(); // stay on page
    });

    // page.reload() will throw if dismissed, so catch it
    try {
      await page.reload({ timeout: 3000 });
    } catch {
      // Expected — dialog was dismissed, reload aborted
    }

    expect(dialogFired).toBe(true);
    expect(dialogType).toBe('beforeunload');
  });

  test('clean piskel should NOT trigger beforeunload dialog on reload', async ({ page }) => {
    await openEditor(page);

    // No changes — reload should go through without a dialog
    let dialogFired = false;
    page.on('dialog', async dialog => {
      dialogFired = true;
      await dialog.accept();
    });

    await page.reload();
    await page.waitForSelector('#drawing-canvas-container canvas', { state: 'attached' });

    expect(dialogFired).toBe(false);
  });

  test('saved piskel should NOT trigger beforeunload dialog on reload', async ({ page }) => {
    await openEditor(page);

    // Draw then save
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await getHeaderName(page)).includes('*'));

    await saveToIndexedDb(page, 'beforeunload-test');
    await waitFor(async () => !(await getHeaderName(page)).includes('*'));

    // Reload — should NOT trigger dialog
    let dialogFired = false;
    page.on('dialog', async dialog => {
      dialogFired = true;
      await dialog.accept();
    });

    await page.reload();
    await page.waitForSelector('#drawing-canvas-container canvas', { state: 'attached' });

    expect(dialogFired).toBe(false);
  });
});
