import test, { expect } from "@playwright/test";
import { MODIFIER_LABEL, openEditor } from "../../testutils";

/** Open the cheatsheet dialog and wait for it to be visible */
async function openCheatsheet(page: import('@playwright/test').Page) {
  // Retry pressing ? in case the page isn't ready to receive the shortcut yet
  // (e.g. under coverage collection overhead or after dialog close animations)
  await expect(async () => {
    await page.keyboard.press('?');
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 1000 });
  }).toPass({ timeout: 5000 });
  await expect(page.locator('.cheatsheet-container')).toBeAttached();
}

test.describe('Cheatsheet dialog', () => {

  test('should open and close with ? key', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });
  });

  test('should close with X button', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    await page.locator('.dialog-close').click();
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });
  });

  test('should display all shortcut categories', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // All 5 shortcut sections should be present
    await expect(page.locator('.cheatsheet-tool-shortcuts')).toBeAttached();
    await expect(page.locator('.cheatsheet-misc-shortcuts')).toBeAttached();
    await expect(page.locator('.cheatsheet-selection-shortcuts')).toBeAttached();
    await expect(page.locator('.cheatsheet-color-shortcuts')).toBeAttached();
    await expect(page.locator('.cheatsheet-storage-shortcuts')).toBeAttached();
  });

  test('should display default tool shortcuts', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // Verify a few well-known default tool shortcuts are shown
    const penShortcut = page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key');
    await expect(penShortcut).toHaveText('P');

    const eraserShortcut = page.locator('[data-shortcut-id="tool-eraser"] .cheatsheet-key');
    await expect(eraserShortcut).toHaveText('E');

    const bucketShortcut = page.locator('[data-shortcut-id="tool-paint-bucket"] .cheatsheet-key');
    await expect(bucketShortcut).toHaveText('B');
  });

  test('should display misc and selection shortcuts', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    const undoShortcut = page.locator('[data-shortcut-id="undo"] .cheatsheet-key');
    await expect(undoShortcut).toContainText(MODIFIER_LABEL);
    await expect(undoShortcut).toContainText('Z');

    const redoShortcut = page.locator('[data-shortcut-id="redo"] .cheatsheet-key');
    await expect(redoShortcut).toContainText(MODIFIER_LABEL);
    await expect(redoShortcut).toContainText('Y');
  });

  test('should mark editable shortcuts as editable', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // The pen shortcut should be editable (not in the forbidden keys list)
    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await expect(penItem).toHaveClass(/cheatsheet-shortcut-editable/);
  });

  test('should enter editing mode when clicking an editable shortcut', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await penItem.click();

    // Should have editing class (key blinks)
    await expect(penItem).toHaveClass(/cheatsheet-shortcut-editing/);
  });

  test('should customize a shortcut by pressing a new key', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // Click the pen shortcut to enter editing mode
    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await penItem.click();
    await expect(penItem).toHaveClass(/cheatsheet-shortcut-editing/);

    // The hidden event trap should have focus
    await expect(page.locator('#cheatsheetEventTrap')).toBeFocused();

    // Press a new key to remap
    await page.keyboard.press('w');

    // Editing mode should end and the key should update
    await expect(penItem).not.toHaveClass(/cheatsheet-shortcut-editing/);
    const penKey = page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key');
    await expect(penKey).toHaveText('W');

    // Close cheatsheet and verify the shortcut actually works
    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });

    // Press W — should select pen tool
    await page.click('[data-tool-id="tool-eraser"]'); // select something else first
    await page.keyboard.press('w');
    await expect(page.locator('[data-tool-id="tool-pen"]')).toHaveClass(/selected/);
  });

  test('should restore default shortcuts', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // First customize a shortcut
    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await penItem.click();
    await page.keyboard.press('w');
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('W');

    // Click "Restore default shortcuts" and accept the confirm dialog
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.cheatsheet-restore-defaults').click();

    // Pen shortcut should be back to P
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('P');
  });

  test('should cancel restore defaults when declining confirm', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // Customize pen to W
    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await penItem.click();
    await page.keyboard.press('w');
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('W');

    // Click restore but dismiss the confirm
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('.cheatsheet-restore-defaults').click();

    // Pen shortcut should remain W
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('W');

    // Restore for real to clean up (so other tests aren't affected)
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.cheatsheet-restore-defaults').click();
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('P');
  });

  test('should steal key from conflicting shortcut', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // Verify eraser starts with E
    await expect(page.locator('[data-shortcut-id="tool-eraser"] .cheatsheet-key')).toHaveText('E');

    // Remap pen to E (conflicts with eraser)
    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await penItem.click();
    await page.keyboard.press('e');

    // Pen should now show E
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('E');

    // Eraser should lose its key — displayed as "???" and marked as undefined
    const eraserItem = page.locator('[data-shortcut-id="tool-eraser"]');
    await expect(eraserItem).toHaveClass(/cheatsheet-shortcut-undefined/);
    await expect(page.locator('[data-shortcut-id="tool-eraser"] .cheatsheet-key')).toHaveText('???');

    // Close cheatsheet and verify on canvas
    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });

    // Select bucket first so we can test both remapped shortcuts
    await page.click('[data-tool-id="tool-paint-bucket"]');
    await expect(page.locator('[data-tool-id="tool-paint-bucket"]')).toHaveClass(/selected/);

    // Press E — should now select pen (not eraser)
    await page.keyboard.press('e');
    await expect(page.locator('[data-tool-id="tool-pen"]')).toHaveClass(/selected/);

    // Restore defaults via cheatsheet
    await openCheatsheet(page);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.cheatsheet-restore-defaults').click();
    await expect(page.locator('[data-shortcut-id="tool-pen"] .cheatsheet-key')).toHaveText('P');
    await expect(page.locator('[data-shortcut-id="tool-eraser"] .cheatsheet-key')).toHaveText('E');
  });

  test('should cancel editing mode when clicking outside shortcut', async ({ page }) => {
    await openEditor(page);

    await openCheatsheet(page);

    // Enter editing mode
    const penItem = page.locator('[data-shortcut-id="tool-pen"]');
    await penItem.click();
    await expect(penItem).toHaveClass(/cheatsheet-shortcut-editing/);

    // Click on the dialog title (outside any shortcut)
    await page.locator('.cheatsheet-container').click({ position: { x: 5, y: 5 } });

    // Editing mode should be cancelled
    await expect(penItem).not.toHaveClass(/cheatsheet-shortcut-editing/);
  });
});
