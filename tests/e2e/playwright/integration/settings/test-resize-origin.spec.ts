import test, {  expect } from "@playwright/test";
import { expectGrid, expectResizeValues, getCurrentPiskelHeight, getCurrentPiskelWidth, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel, setPiskelFromGrid } from "../../testutils";

test('Test resize the canvas and anchor in the right corner', async ({ page }) => {
    await openEditor(page);
  
    await setPiskelFromGrid(page, [["B", "T"],["T", "B"]]);
    
    await openResizeSettingsPanel(page);
    await expectResizeValues(page, "2", "2");

    const ratioCheckbox = page.locator('.resize-ratio-checkbox');
    await expect(ratioCheckbox).toBeChecked();

    const widthInputLocator = page.locator('[name="resize-width"]');
    await widthInputLocator.fill("4");
    await expectResizeValues(page, "4", "4");
    

    await expect(page.locator('[data-origin="TOPLEFT"].selected')).toBeAttached();


    await page.click('[data-origin="BOTTOMRIGHT"]');
    await expect(page.locator('[data-origin="BOTTOMRIGHT"].selected')).toBeAttached();
    
    await page.click('.resize-button');

    expect(await expectGrid(page, 
        [["T", "T", "T", "T"],
         ["T", "T", "T", "T"],
         ["T", "T", "B", "T"],
         ["T", "T", "T", "B"]] , 0, 0)).toBe(true);

    expect(await getCurrentPiskelHeight(page)).toBe(4);
    expect(await getCurrentPiskelWidth(page)).toBe(4);
    expect(await isSettingsDrawerExpanded(page)).toBe(false);
});