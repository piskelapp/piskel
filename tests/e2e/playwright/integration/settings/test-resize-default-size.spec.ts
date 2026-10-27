import test, { expect } from "@playwright/test";
import { expectDefaultResizeValues, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel, testId } from "../../testutils";

test('Test changing the default canvas size', async ({ page }) => {
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

test('Test the default canvas size is capped to the maximum', async ({ page }) => {
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

test('Test the editor starts with an invalid stored default size', async ({ page }) => {
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
