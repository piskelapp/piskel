import test, {  expect } from "@playwright/test";
import { assertSpriteSize, expectResizeValues, getCurrentPiskelHeight, getCurrentPiskelWidth, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel } from "../../testutils";

test('Test resize a canvas from 32x32 to 320x320', { tag: ['@settings.resize'] }, async ({ page }) => {
  await openEditor(page);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    await openResizeSettingsPanel(page);

    await expectResizeValues(page, "32", "32");
    
    const ratioCheckbox = page.locator('.resize-ratio-checkbox');
    await expect(ratioCheckbox).toBeChecked();

    const widthInputLocator = page.locator('[name="resize-width"]');
    await widthInputLocator.focus();
    await page.keyboard.type("0");

    await expectResizeValues(page, "320", "320");

    await page.click('.resize-button');

    await expect(page.locator('[data-pskl-controller="settings"]:not(.expanded)')).toBeAttached();
    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    expect(await getCurrentPiskelHeight(page)).toBe(320);
    expect(await getCurrentPiskelWidth(page)).toBe(320);
});

test('Resize does nothing with an empty, 0 or non numeric size', { tag: ['@settings.resize-invalid'] }, async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));

  await openEditor(page);
  await openResizeSettingsPanel(page);
  await page.locator('.resize-ratio-checkbox').uncheck();
  const widthInput = page.locator('[name="resize-width"]');
  const heightInput = page.locator('[name="resize-height"]');

  // Without resizing the content: a height of 0.
  await page.locator('.resize-content-checkbox').uncheck();
  await heightInput.fill("0");
  await page.click('.resize-button');
  await assertSpriteSize(page, 32, 32);
  expect(errors).toEqual([]);
  expect(await isSettingsDrawerExpanded(page)).toBe(true);

  // Resizing the content: an empty width, then letters.
  await heightInput.fill("32");
  await page.locator('.resize-content-checkbox').check();
  await widthInput.fill("");
  await page.click('.resize-button');
  await assertSpriteSize(page, 32, 32);
  expect(errors).toEqual([]);
  await widthInput.fill("abc");
  await page.click('.resize-button');
  await assertSpriteSize(page, 32, 32);
  expect(errors).toEqual([]);
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
});
