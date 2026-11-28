import test, { expect } from "@playwright/test";
import { assertSizeFieldInvalid, assertSpriteSize, expectDefaultResizeValues, isSettingsDrawerExpanded, openEditor, openEditorInNewPage, openResizeSettingsPanel, testId } from "../../testutils";

test('Test changing the default canvas size', { tag: ['@settings.default-size'] }, async ({ page }) => {
  // The resize panel shows the default size of 32x32.
  await openEditor(page);
  expect(await isSettingsDrawerExpanded(page)).toBe(false);
  await openResizeSettingsPanel(page);
  await expectDefaultResizeValues(page, "32", "32");

  // Type a digit after each value, and save: the panel closes.
  await page.locator('[name="default-width"]').focus();
  await page.keyboard.type("1");
  await page.locator('[name="default-height"]').focus();
  await page.keyboard.type("2");
  await expectDefaultResizeValues(page, "321", "322");
  await page.click('.default-size-button');
  await expect.poll(() => isSettingsDrawerExpanded(page)).toBe(false);

  // Reopening the panel shows the new default size.
  await openResizeSettingsPanel(page);
  await expectDefaultResizeValues(page, "321", "322");
});

test('Test an invalid default size is shown and disables the Set default button', { tag: ['@settings.default-size'] }, async ({ page }) => {
  await openEditor(page);
  await openResizeSettingsPanel(page);
  const widthInput = page.locator('[name="default-width"]');
  const heightInput = page.locator('[name="default-height"]');
  const setDefaultButton = testId(page, "default-size-button");
  await expect(setDefaultButton).toBeEnabled();

  // Too large, empty, 0 or letters: only the width is invalid.
  for (const value of ["4097", "", "0", "abc"]) {
    await widthInput.fill(value);
    await assertSizeFieldInvalid(page, "default-width", true);
    await assertSizeFieldInvalid(page, "default-height", false);
    await expect(setDefaultButton).toBeDisabled();
  }

  // A valid width, and a height of 0: only the height is invalid.
  await widthInput.fill("64");
  await heightInput.fill("0");
  await assertSizeFieldInvalid(page, "default-width", false);
  await assertSizeFieldInvalid(page, "default-height", true);
  await expect(setDefaultButton).toBeDisabled();

  // Pressing Enter doesn't save the invalid size or close the drawer.
  await heightInput.press("Enter");
  expect(await isSettingsDrawerExpanded(page)).toBe(true);

  // Valid sizes can be saved.
  await heightInput.fill("48");
  await assertSizeFieldInvalid(page, "default-height", false);
  await setDefaultButton.click();
  await expect.poll(() => isSettingsDrawerExpanded(page)).toBe(false);

  // A new session starts on a sprite of that size.
  const secondSession = await openEditorInNewPage(page);
  await assertSpriteSize(secondSession, 64, 48);
});

test('Test the editor starts with an invalid stored default size', { tag: ['@settings.default-size'] }, async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));

  // Simulate a default size saved by a version without any size limit.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "DEFAULT_SIZE",
      JSON.stringify({ width: 99999999999999, height: 99999999999999 })
    );
  });
  await openEditor(page);

  await expect(testId(page, "cursor-coordinates")).toContainText("[4096x4096]");
  expect(errors).toEqual([]);
});
