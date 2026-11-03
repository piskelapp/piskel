import test, { expect } from "@playwright/test";
import { expectDefaultResizeValues, isSettingsDrawerExpanded, openEditor, openEditorInNewPage, openResizeSettingsPanel, setDefaultSize, testId, waitFor } from "../../testutils";

test('Test changing the default canvas size', { tag: ['@settings.default-size'] }, async ({ page }) => {
  await openEditor(page);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    await openResizeSettingsPanel(page);


    await expectDefaultResizeValues(page, "32", "32");

    const defaultWidthInputLocator = page.locator('[name="default-width"]');
    await defaultWidthInputLocator.focus();
    await page.keyboard.type("1");

    const defaultHeightInputLocator = page.locator('[name="default-height"]');
    await defaultHeightInputLocator.focus();
    await page.keyboard.type("2");

    await expectDefaultResizeValues(page, "321", "322");
    await page.click('.default-size-button');

    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    const systemDefaultWidth = await page.evaluate(() => {
        return window.pskl.UserSettings.get("DEFAULT_SIZE").width;
    });
    expect(systemDefaultWidth).toBe(321);
    const systemDefaultHeight = await page.evaluate(() => {
        return window.pskl.UserSettings.get("DEFAULT_SIZE").height;
    });
    expect(systemDefaultHeight).toBe(322);
});

test('Test the default canvas size is capped to the maximum', { tag: ['@settings.default-size'] }, async ({ page }) => {
  await openEditor(page);
  await openResizeSettingsPanel(page);

  await page.locator('[name="default-width"]').fill("99999999999999");
  await page.locator('[name="default-height"]').fill("99999999999999");
  await page.click('.default-size-button');

  const storedDefaultSize = await page.evaluate(() => {
    return window.pskl.UserSettings.get("DEFAULT_SIZE");
  });
  expect(storedDefaultSize).toEqual( {
      width: 4096,
      height: 4096
    });
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

test('Test an empty or 0 default size keeps the previous value', { tag: ['@settings.default-size'] }, async ({ page }) => {
  // Set a default size of 64x48.
  await openEditor(page);
  await setDefaultSize(page, "64", "48");

  // Set an empty width and a height of 0: both keep their value.
  await setDefaultSize(page, "", "0");
  await openResizeSettingsPanel(page);
  await expectDefaultResizeValues(page, "64", "48");
  await page.click('[data-setting="resize"]');
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));

  // Each side is checked on its own: a valid width still applies.
  await setDefaultSize(page, "20", "");

  // A new session starts on a sprite of that size.
  const secondSession = await openEditorInNewPage(page);
  await expect(testId(secondSession, "cursor-coordinates")).toContainText("[20x48]");
});
