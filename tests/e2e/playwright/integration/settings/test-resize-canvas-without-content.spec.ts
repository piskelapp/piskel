import test, {  expect } from "@playwright/test";
import { expectGrid, expectResizeValues, getCurrectPiskelHeight, getCurrectPiskelWidth, isSettingsDrawerExpanded, openEditor, openResizeSettingsPanel, setPiskelFromGrid } from "../../testutils";

test('Test resize the canvas without resizing the content', async ({ page }) => {
    await openEditor(page);
  
    await setPiskelFromGrid(page, [["B", "T"],["T", "B"]]);
    
    await openResizeSettingsPanel(page);
    await expectResizeValues(page, "2", "2");

    const ratioCheckbox = page.locator('.resize-ratio-checkbox');
    await expect(ratioCheckbox).toBeChecked();
    const widthInputLocator = page.locator('[name="resize-width"]');
    await widthInputLocator.fill("4");
    await expectResizeValues(page, "4", "4");
    await page.click('.resize-button');

    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    expect(await getCurrectPiskelHeight(page)).toBe(4);
    expect(await getCurrectPiskelWidth(page)).toBe(4);

    expect(await expectGrid(page, 
        [["B", "T", "T", "T"],
         ["T", "B", "T", "T"],
         ["T", "T", "T", "T"],
         ["T", "T", "T", "T"]] , 0, 0)).toBe(true);
});