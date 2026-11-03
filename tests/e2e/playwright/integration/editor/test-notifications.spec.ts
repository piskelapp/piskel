import test, { Page } from "@playwright/test";
import {
  assertNoNotification,
  assertOnlyNotification,
  closeNotification,
  CMD_OR_CTRL,
  importBrokenPiskelFile,
  openCheatsheet,
  openEditor,
  openEditorWithFakeClock,
  remapShortcut,
} from "../../testutils";

/** Try to give the pen a key that can't be remapped, which shows a warning */
const tryToRemapPenTo = async (page: Page, key: string) => {
  await openCheatsheet(page);
  await remapShortcut(page, 'tool-pen', key);
};

const notifications = [
  {
    kind: 'save result',
    trigger: (page: Page) => page.keyboard.press(`${CMD_OR_CTRL}+s`),
    message: 'Successfully saved !',
    hidesAfterSeconds: 3,
  },
  {
    kind: 'import error',
    trigger: importBrokenPiskelFile,
    message: 'Piskel file import failed',
    hidesAfterSeconds: 10,
  },
  {
    kind: 'warning',
    trigger: (page: Page) => tryToRemapPenTo(page, '1'),
    message: 'Key cannot be remapped (1)',
    hidesAfterSeconds: 5,
  },
];

test.describe('Notifications', () => {
  for (const { kind, trigger, message, hidesAfterSeconds } of notifications) {
    test(`should hide the ${kind} after a few seconds`, { tag: ['@editor.notifications'] }, async ({ page }) => {
      await openEditorWithFakeClock(page);

      // Trigger the message.
      await trigger(page);
      await assertOnlyNotification(page, message);

      // It's still there a second later.
      await page.clock.runFor(1000);
      await assertOnlyNotification(page, message);

      // It's gone after its delay.
      await page.clock.runFor(hidesAfterSeconds * 1000);
      await assertNoNotification(page);
    });

    test(`should close the ${kind} with the close button`, { tag: ['@editor.notifications'] }, async ({ page }) => {
      await openEditor(page);

      // Trigger the message.
      await trigger(page);
      await assertOnlyNotification(page, message);

      // Close it: it goes right away, long before it would hide by itself.
      await closeNotification(page);
      await assertNoNotification(page, { timeout: 1000 });
    });
  }

  test('should replace the current message with the new one', { tag: ['@editor.notifications'] }, async ({ page }) => {
    await openEditor(page);

    // Show a first message.
    await tryToRemapPenTo(page, '1');
    await assertOnlyNotification(page, 'Key cannot be remapped (1)');

    // Show a second message: it takes the place of the first.
    await remapShortcut(page, 'tool-pen', '2');
    await assertOnlyNotification(page, 'Key cannot be remapped (2)');
  });
});
