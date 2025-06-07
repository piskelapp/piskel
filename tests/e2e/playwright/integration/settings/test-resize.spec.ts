import test, {  expect } from "@playwright/test";
import { expectResizeValues, getCurrectPiskelHeight, getCurrectPiskelWidth, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel } from "../../testutils";

test('Test resize a canvas from 32x32 to 320x320', async ({ page }) => {
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

    expect(await getCurrectPiskelHeight(page)).toBe(320);
    expect(await getCurrectPiskelWidth(page)).toBe(320);
});