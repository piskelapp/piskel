import test, {  expect } from "@playwright/test";
import { isSettingsDrawerExpanded, openEditor } from "../../testutils";

test('Test opening/closing all settings drawer tabs', async ({ page }) => {
    await openEditor(page);

    // Collapsed initially.
    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    // Open resize tab.
    await expect(page.locator('.settings-section-resize')).not.toBeAttached();
    await page.click('[data-setting="resize"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(true);
    await expect(page.locator('.settings-section-resize')).toBeAttached();

    // Open preferences tab.
    await expect(page.locator('.settings-section-preferences')).not.toBeAttached();
    await page.click('[data-setting="user"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(true);
    await expect(page.locator('.settings-section-preferences')).toBeAttached();
    
    // Open save tab.
    await expect(page.locator('.settings-section-save')).not.toBeAttached();
    await page.click('[data-setting="save"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(true);
    await expect(page.locator('.settings-section-save')).toBeAttached();

    // Open export tab.
    await expect(page.locator('.settings-section-export')).not.toBeAttached();
    await page.click('[data-setting="export"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(true);
    await expect(page.locator('.settings-section-export')).toBeAttached();

    // Open import tab.
    await expect(page.locator('.settings-section-import')).not.toBeAttached();
    await page.click('[data-setting="import"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(true);
    await expect(page.locator('.settings-section-import')).toBeAttached();

    // Click on import again to close the settings drawer.
    await page.click('[data-setting="import"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    await expect(page.locator('[data-pskl-controller="settings"]:not(.expanded)')).toBeAttached();
});