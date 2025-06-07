import test, {  expect } from "@playwright/test";
import { expectResizeValues, getCurrectPiskelHeight, getCurrectPiskelWidth, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel } from "../../testutils";

test('Test resize a canvas from 32x32 to 320x320', async ({ page }) => {
  await openEditor(page);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    await expect(page.locator('.settings-section-resize')).not.toBeAttached();   
    await openResizeSettingsPanel(page);

    await expectResizeValues(page, "32", "32");
    
    const ratioCheckbox = page.locator('.resize-ratio-checkbox');
    await expect(ratioCheckbox).toBeChecked();

    const widthInputLocator = page.locator('[name="resize-width"]');
    await widthInputLocator.focus();
    await page.keyboard.press('Backspace');
    await expectResizeValues(page, "3", "3");

    await page.keyboard.type('0');
    await expectResizeValues(page, "30", "30");

    const heightInputLocator = page.locator('[name="resize-height"]');
    await heightInputLocator.focus();
    await page.keyboard.type('0');
    await expectResizeValues(page, "300", "300");
    await page.keyboard.press('Backspace');
    await expectResizeValues(page, "30", "30");

    await ratioCheckbox.click();
    await expect(ratioCheckbox).not.toBeChecked();

    await widthInputLocator.focus();
    await page.keyboard.press('Backspace');
    await expectResizeValues(page, "3", "30");
    await page.keyboard.type('2');
    await expectResizeValues(page, "32", "30");

    await heightInputLocator.focus();
    await page.keyboard.press('Backspace');
    await expectResizeValues(page, "32", "3");
    await page.keyboard.type('2');
    await expectResizeValues(page, "32", "32");
});