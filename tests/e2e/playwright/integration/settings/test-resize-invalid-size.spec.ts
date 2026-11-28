import test, { expect } from "@playwright/test";
import { assertSizeFieldInvalid, assertSpriteSize, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel, testId } from "../../testutils";

test('Test an invalid resize size is shown and disables the Resize button', { tag: ['@settings.resize-invalid'] }, async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));

  await openEditor(page);
  await openResizeSettingsPanel(page);
  const widthInput = page.locator('[name="resize-width"]');
  const heightInput = page.locator('[name="resize-height"]');
  const resizeButton = testId(page, "resize-button");

  // The panel opens with valid sizes: no error, the button is enabled.
  await assertSizeFieldInvalid(page, "resize-width", false);
  await assertSizeFieldInvalid(page, "resize-height", false);
  await expect(resizeButton).toBeEnabled();

  // A width above 4096: with "Maintain aspect ratio" on, the height follows, so both are too large.
  await widthInput.fill("4097");
  await expect(heightInput).toHaveValue("4097");
  await assertSizeFieldInvalid(page, "resize-width", true);
  await assertSizeFieldInvalid(page, "resize-height", true);
  await expect(resizeButton).toBeDisabled();

  // Back to a valid width: both errors go away.
  await widthInput.fill("32");
  await assertSizeFieldInvalid(page, "resize-width", false);
  await assertSizeFieldInvalid(page, "resize-height", false);
  await expect(resizeButton).toBeEnabled();

  // An empty width, 0 or letters: only the width is invalid, the height keeps its value.
  for (const value of ["", "0", "abc"]) {
    await widthInput.fill(value);
    await assertSizeFieldInvalid(page, "resize-width", true);
    await assertSizeFieldInvalid(page, "resize-height", false);
    await expect(resizeButton).toBeDisabled();
  }

  // Pressing Enter in the invalid field doesn't resize the sprite or close the drawer.
  await widthInput.press("Enter");
  await assertSpriteSize(page, 32, 32);
  expect(await isSettingsDrawerExpanded(page)).toBe(true);

  // An invalid height is shown too.
  await page.locator('.resize-ratio-checkbox').uncheck();
  await widthInput.fill("64");
  await heightInput.fill("0");
  await assertSizeFieldInvalid(page, "resize-width", false);
  await assertSizeFieldInvalid(page, "resize-height", true);
  await expect(resizeButton).toBeDisabled();

  // With the ratio off, a too large width leaves the height valid. Turning the ratio
  // back on makes the height follow the width, so it becomes too large too.
  await heightInput.fill("48");
  await widthInput.fill("5000");
  await assertSizeFieldInvalid(page, "resize-height", false);
  await page.locator('.resize-ratio-checkbox').check();
  await expect(heightInput).toHaveValue("5000");
  await assertSizeFieldInvalid(page, "resize-height", true);
  await page.locator('.resize-ratio-checkbox').uncheck();

  // Valid sizes again: the sprite can be resized.
  await widthInput.fill("64");
  await heightInput.fill("48");
  await expect(resizeButton).toBeEnabled();
  await resizeButton.click();
  await assertSpriteSize(page, 64, 48);
  expect(errors).toEqual([]);
});
