import test, { expect, Page } from "@playwright/test";
import {
  assertNotification,
  assertShortcutDescription,
  assertShortcutKey,
  clickTool,
  closeCheatsheet,
  CMD_OR_CTRL,
  drawAtPixel,
  getCheatsheetShortcut,
  getSelectedToolId,
  gridFromRows,
  openCheatsheet,
  openEditor,
  openEditorInNewPage,
  openSaveSettingsPanel,
  readPixelRows,
  remapShortcut,
  setPiskelFromGrid,
  testId,
  wait,
  waitForGrid,
} from "../../testutils";

const MAC_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const WINDOWS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const EMPTY = ['....', '....', '....', '....'];
const ONE_PIXEL = ['X...', '....', '....', '....'];

/** Draw one pixel with the pen on an empty 4x4 sprite */
const drawOnePixel = async (page: Page) => {
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 0, 0);
  expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);
};

test.describe('Shortcuts while typing', () => {
  test('should be ignored in a text input', { tag: ['@keyboard-shortcuts.ignore-inputs'] }, async ({ page }) => {
    await openEditor(page);
    await drawOnePixel(page);

    // Rename the layer, typing the key of the eraser and pressing undo.
    await testId(page, 'layer-edit-button').click();
    const input = testId(page, 'layer-name-input');
    await page.keyboard.press('e');
    await expect(input).toHaveValue('e');
    await page.keyboard.press(`${CMD_OR_CTRL}+z`);
    await wait(100);

    // The tool is still the pen, and the drawing is still there.
    expect(await getSelectedToolId(page)).toBe('tool-pen');
    expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);

    // Leave the input: the same key selects the eraser.
    await input.press('Escape');
    await page.keyboard.press('e');
    await expect.poll(() => getSelectedToolId(page)).toBe('tool-eraser');
  });

  test('should be ignored in a text area', { tag: ['@keyboard-shortcuts.ignore-inputs'] }, async ({ page }) => {
    await openEditor(page);
    await clickTool(page, 'tool-pen');

    // Type the key of the eraser in the description of the sprite.
    await openSaveSettingsPanel(page);
    const description = page.locator('#save-description');
    await description.fill('');
    await description.press('e');
    await expect(description).toHaveValue('e');
    await wait(100);
    expect(await getSelectedToolId(page)).toBe('tool-pen');

    // Leave the text area: the same key selects the eraser.
    await description.blur();
    await page.keyboard.press('e');
    await expect.poll(() => getSelectedToolId(page)).toBe('tool-eraser');
  });
});

test.describe('Customized shortcuts', () => {
  test('should be marked with * in the cheatsheet', { tag: ['@keyboard-shortcuts.custom-marker'] }, async ({ page }) => {
    await openEditor(page);
    await openCheatsheet(page);
    await assertShortcutDescription(page, 'tool-pen', 'Pen tool');

    // Remap the pen: only that shortcut is marked.
    await remapShortcut(page, 'tool-pen', 'w');
    await assertShortcutKey(page, 'tool-pen', 'W');
    await assertShortcutDescription(page, 'tool-pen', 'Pen tool *');
    await assertShortcutDescription(page, 'tool-eraser', 'Eraser pen tool');

    // Give it its default key again: it is no longer marked.
    await remapShortcut(page, 'tool-pen', 'p');
    await assertShortcutKey(page, 'tool-pen', 'P');
    await assertShortcutDescription(page, 'tool-pen', 'Pen tool');
  });

  test('should be remembered in this browser only', { tag: ['@keyboard-shortcuts.persist'] }, async ({ page, browser }) => {
    // Remap the pen to W.
    await openEditor(page);
    await openCheatsheet(page);
    await remapShortcut(page, 'tool-pen', 'w');
    await closeCheatsheet(page);

    // A new session shows the new key.
    const secondSession = await openEditorInNewPage(page);
    await openCheatsheet(secondSession);
    await assertShortcutKey(secondSession, 'tool-pen', 'W');
    await closeCheatsheet(secondSession);

    // There W selects the pen, and the old key no longer does.
    await clickTool(secondSession, 'tool-eraser');
    await secondSession.keyboard.press('p');
    await wait(100);
    expect(await getSelectedToolId(secondSession)).toBe('tool-eraser');
    await secondSession.keyboard.press('w');
    await expect.poll(() => getSelectedToolId(secondSession)).toBe('tool-pen');

    // Another browser still has the default key.
    const otherBrowser = await browser.newContext();
    const otherPage = await otherBrowser.newPage();
    await openEditor(otherPage);
    await openCheatsheet(otherPage);
    await assertShortcutKey(otherPage, 'tool-pen', 'P');
    await otherBrowser.close();
  });
});

test.describe('Keys that cannot be remapped', () => {
  const forbiddenKeys = [
    { press: '1', shown: '1' },
    { press: '9', shown: '9' },
    // Shift+Slash is the ? key of a US keyboard.
    { press: 'Shift+Slash', shown: 'shift+?' },
    { press: 'Delete', shown: 'DEL' },
    { press: 'Backspace', shown: 'BACK' },
    { press: 'Enter', shown: 'ENTER' },
    { press: `${CMD_OR_CTRL}+y`, shown: 'ctrl+Y' },
    { press: `${CMD_OR_CTRL}+Shift+z`, shown: 'ctrl+shift+Z' },
  ];

  for (const { press, shown } of forbiddenKeys) {
    test(`should refuse ${shown}`, { tag: ['@keyboard-shortcuts.forbidden-keys'] }, async ({ page }) => {
      await openEditor(page);
      await openCheatsheet(page);

      // Try to give this key to the pen.
      await remapShortcut(page, 'tool-pen', press);

      // A notification says no, and the pen keeps its key.
      await assertNotification(page, `Key cannot be remapped (${shown})`);
      await assertShortcutKey(page, 'tool-pen', 'P');
      await assertShortcutDescription(page, 'tool-pen', 'Pen tool');
    });
  }

  test('should not let shortcuts with several keys be edited', { tag: ['@keyboard-shortcuts.forbidden-keys'] }, async ({ page }) => {
    await openEditor(page);
    await openCheatsheet(page);

    // Redo and delete each have two keys.
    for (const shortcutId of ['redo', 'selection-delete']) {
      const shortcut = getCheatsheetShortcut(page, shortcutId);
      await expect(shortcut).not.toHaveClass(/cheatsheet-shortcut-editable/);

      // Clicking them doesn't start editing.
      await shortcut.click();
      await expect(shortcut).not.toHaveClass(/cheatsheet-shortcut-editing/);
    }

    // An ordinary shortcut does start editing.
    const pen = getCheatsheetShortcut(page, 'tool-pen');
    await expect(pen).toHaveClass(/cheatsheet-shortcut-editable/);
    await pen.click();
    await expect(pen).toHaveClass(/cheatsheet-shortcut-editing/);
  });
});

test.describe('On macOS', () => {
  test.use({ userAgent: MAC_USER_AGENT });

  test('ctrl shortcuts should use Cmd', { tag: ['@keyboard-shortcuts.ctrl-cmd'] }, async ({ page }) => {
    await openEditor(page);
    await drawOnePixel(page);

    // Control+Z does nothing.
    await page.keyboard.press('Control+z');
    await wait(100);
    expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);

    // Cmd+Z undoes.
    await page.keyboard.press('Meta+z');
    await waitForGrid(page, 4, 4, EMPTY);
  });

  test('should show cmd and option in the cheatsheet and in tooltips', { tag: ['@keyboard-shortcuts.mac-labels'] }, async ({ page }) => {
    await openEditor(page);

    // The tooltip of a transformation lists its modifier keys.
    await page.locator('[data-tool-id="tool-flip"]').hover();
    await expect(page.locator('.tooltip')).toContainText('OPTION');
    await expect(page.locator('.tooltip')).toContainText('CMD');
    await expect(page.locator('.tooltip')).not.toContainText('ALT');
    await expect(page.locator('.tooltip')).not.toContainText('CTRL');

    // The cheatsheet shows them for its shortcuts.
    await page.mouse.move(0, 0);
    await openCheatsheet(page);
    await assertShortcutKey(page, 'undo', 'cmd + Z');
    await assertShortcutKey(page, 'x1-preview', 'option + 1');
  });
});

test.describe('On other systems', () => {
  test.use({ userAgent: WINDOWS_USER_AGENT });

  test('ctrl shortcuts should use Ctrl', { tag: ['@keyboard-shortcuts.ctrl-cmd'] }, async ({ page }) => {
    await openEditor(page);
    await drawOnePixel(page);

    // The Windows key does nothing.
    await page.keyboard.press('Meta+z');
    await wait(100);
    expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);

    // Ctrl+Z undoes.
    await page.keyboard.press('Control+z');
    await waitForGrid(page, 4, 4, EMPTY);
  });

  test('should show ctrl and alt in the cheatsheet and in tooltips', { tag: ['@keyboard-shortcuts.mac-labels'] }, async ({ page }) => {
    await openEditor(page);

    await page.locator('[data-tool-id="tool-flip"]').hover();
    await expect(page.locator('.tooltip')).toContainText('ALT');
    await expect(page.locator('.tooltip')).toContainText('CTRL');

    await page.mouse.move(0, 0);
    await openCheatsheet(page);
    await assertShortcutKey(page, 'undo', 'ctrl + Z');
    await assertShortcutKey(page, 'x1-preview', 'alt + 1');
  });
});
