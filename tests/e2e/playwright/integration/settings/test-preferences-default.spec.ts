import test, {  expect } from "@playwright/test";
import { isSettingsDrawerExpanded, openEditor } from "../../testutils";

test('Test default user preferences', async ({ page }) => {
    await openEditor(page);

    expect(await isSettingsDrawerExpanded(page)).toBe(false);
    
    await page.locator('[data-setting="user"]').click();
    await expect(page.locator('.expanded .settings-section-preferences')).toBeAttached();
    
    expect(await isSettingsDrawerExpanded(page)).toBe(true);

    await expect(page.locator('.preferences-panel-misc')).toBeAttached();
    await expect(page.locator('.preferences-panel-grid')).not.toBeAttached();
    await expect(page.locator('.preferences-panel-tile')).not.toBeAttached();        

    await page.locator('[data-tab-id="grid"]').click();
    await expect(page.locator('.preferences-panel-misc')).not.toBeAttached();
    await expect(page.locator('.preferences-panel-grid')).toBeAttached(); 
    await expect(page.locator('.preferences-panel-tile')).not.toBeAttached();

    await page.locator('[data-tab-id="tile"]').click();
    await expect(page.locator('.preferences-panel-misc')).not.toBeAttached();
    await expect(page.locator('.preferences-panel-grid')).not.toBeAttached(); 
    await expect(page.locator('.preferences-panel-tile')).toBeAttached();

    await page.locator('[data-setting="user"]').click();
    await expect(page.locator('.expanded .settings-section-preferences')).not.toBeAttached();
    expect(await isSettingsDrawerExpanded(page)).toBe(false);
});