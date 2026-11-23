import test, { expect, Page } from "@playwright/test";
import {
  assertDialogOpen,
  assertNoDialogOpen,
  clickTool,
  openEditor,
  openImportSettingsPanel,
  testId,
  wait,
} from "../../testutils";

/** How to open each dialog: with a shortcut, or from the import drawer */
const dialogOpeners: Record<string, (page: Page) => Promise<void>> = {
  'cheatsheet': (page) => page.keyboard.press('?'),
  'create-palette': (page) => page.keyboard.press('Alt+p'),
  'browse-local': async (page) => {
    await openImportSettingsPanel(page);
    await page.locator('.browse-local-button').click();
  },
  'browse-backups': async (page) => {
    await openImportSettingsPanel(page);
    await testId(page, 'browse-backups-button').click();
  },
};

const dialogsOpenedFromADrawer = ['browse-local', 'browse-backups'];

const openDialog = async (page: Page, dialogId: string) => {
  await dialogOpeners[dialogId](page);
  await assertDialogOpen(page, dialogId);
};

const closeMethods = [
  {
    name: 'its close button',
    close: (page: Page) => page.locator('.dialog-close').click(),
  },
  {
    name: 'Escape',
    close: (page: Page) => page.keyboard.press('Escape'),
  },
  {
    // The corner of the page is outside any dialog.
    name: 'a click outside it',
    close: (page: Page) => page.mouse.click(5, 5),
  },
];

test.describe('Dialogs', () => {
  for (const dialogId of Object.keys(dialogOpeners)) {
    for (const { name, close } of closeMethods) {
      // Escape doesn't close dialogs opened from a drawer: see docs/known-issues.md
      if (name === 'Escape' && dialogsOpenedFromADrawer.includes(dialogId)) {
        continue;
      }

      test(`${dialogId} should close with ${name}`, { tag: ['@editor.dialogs'] }, async ({ page }) => {
        await openEditor(page);
        await openDialog(page, dialogId);

        await close(page);
        await assertNoDialogOpen(page);

        // The editor can be used again, and the dialog can be opened again.
        await clickTool(page, 'tool-eraser');
        await openDialog(page, dialogId);
      });
    }
  }

  test('should stay open when clicking inside it', { tag: ['@editor.dialogs'] }, async ({ page }) => {
    await openEditor(page);
    await openDialog(page, 'cheatsheet');

    await page.locator('.dialog-title').click();
    await wait(100);

    await assertDialogOpen(page, 'cheatsheet');
  });

  test('should only have one open at a time', { tag: ['@editor.dialogs'] }, async ({ page }) => {
    await openEditor(page);
    await openDialog(page, 'cheatsheet');

    // Try to open another dialog: the first one stays, and it is the only one.
    await page.keyboard.press('Alt+p');
    await wait(100);
    await assertDialogOpen(page, 'cheatsheet');
    await expect(page.locator('.dialog-title')).toHaveCount(1);
    await expect(page.locator('.dialog-title')).toHaveText('Keyboard shortcuts');

    // Once it is closed, the other dialog can open.
    await page.keyboard.press('Escape');
    await assertNoDialogOpen(page);
    await openDialog(page, 'create-palette');
  });
});
