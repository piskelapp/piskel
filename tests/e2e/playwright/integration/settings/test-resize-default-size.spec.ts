import test, {  expect } from "@playwright/test";
import { expectDefaultResizeValues, expectResizeValues, getCurrectPiskelHeight, getCurrectPiskelWidth, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel } from "../../testutils";

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