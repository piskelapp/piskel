import test, {  expect } from "@playwright/test";
import { getCurrectPiskelHeight, getCurrectPiskelWidth, isSettingsDrawerExpanded, openEditor } from "../../testutils";

test('Test resize a canvas from 32x32 to 320x320', async ({ page }) => {
  await openEditor(page);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    await expect(page.locator('.settings-section-resize')).not.toBeAttached();
    
    await page.click('[data-setting="resize"]');

    await expect(page.locator('.settings-section-resize')).toBeAttached();
    expect(await isSettingsDrawerExpanded(page)).toBe(true);
    await expect(page.locator('.settings-section-resize')).toBeAttached();

    const widthInputLocator = page.locator('[name="resize-width"]');
    const heightInputLocator = page.locator('[name="resize-height"]');
    await expect(widthInputLocator).toBeAttached();
    await expect(heightInputLocator).toBeAttached();

    await expect(widthInputLocator).toHaveValue("32");
    await expect(heightInputLocator).toHaveValue("32");

    const ratioCheckbox = page.locator('.resize-ratio-checkbox');
    await expect(ratioCheckbox).toBeChecked();

    await widthInputLocator.focus();
    await page.keyboard.type("0");

    await expect(widthInputLocator).toHaveValue("320");
    await expect(heightInputLocator).toHaveValue("320");

    await page.click('.resize-button');

    await expect(page.locator('[data-pskl-controller="settings"]:not(.expanded)')).toBeAttached();
    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    expect(await getCurrectPiskelHeight(page)).toBe(320);
    expect(await getCurrectPiskelWidth(page)).toBe(320);
});