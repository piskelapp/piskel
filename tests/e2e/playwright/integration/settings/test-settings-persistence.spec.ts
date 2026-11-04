import test, { expect, Page } from "@playwright/test";
import {
  isSettingsDrawerExpanded,
  openEditor,
  openImportSettingsPanel,
  openResizeSettingsPanel,
  openSaveSettingsPanel,
  testId,
} from "../../testutils";

const GRID_COLOR = "#FF004D";
const DEFAULT_GRID_COLOR = "rgba(0, 0, 0, 0)";

async function openPreferences(page: Page) {
  await page.click('[data-setting="user"]');
  await expect(page.locator(".settings-section-preferences")).toBeAttached();
}

async function closeDrawer(page: Page, setting: string) {
  await page.click(`[data-setting="${setting}"]`);
  expect(await isSettingsDrawerExpanded(page)).toBe(false);
}

async function expectPreferencesTab(page: Page, tab: string) {
  await expect(page.locator(".tab-item.selected")).toHaveAttribute("data-tab-id", tab);
  await expect(page.locator(`.preferences-panel-${tab}`)).toBeAttached();
}

async function expectGridPreferences(page: Page, color: string, enabled: boolean) {
  await openPreferences(page);
  await page.locator('[data-tab-id="grid"]').click();
  await expect(page.locator(".grid-colors-item.selected")).toHaveAttribute("data-color", color);
  if (enabled) {
    await expect(page.locator(".enable-grid-checkbox")).toBeChecked();
  } else {
    await expect(page.locator(".enable-grid-checkbox")).not.toBeChecked();
  }
}

test.describe("Preferences storage", () => {
  test("preferences are shared by the pages of this browser", { tag: ["@settings.storage"] }, async ({ page, context }) => {
    await openEditor(page);
    await openPreferences(page);
    await page.locator('[data-tab-id="grid"]').click();
    await page.locator(`.grid-colors-item[data-color="${GRID_COLOR}"]`).click();
    await page.locator(".enable-grid-checkbox").check();

    const otherPage = await context.newPage();
    await openEditor(otherPage);
    await expectGridPreferences(otherPage, GRID_COLOR, true);
  });

  test("preferences do not reach another browser, even through a .piskel file", { tag: ["@settings.storage"] }, async ({ page, browser }) => {
    await openEditor(page);
    await openPreferences(page);
    await page.locator('[data-tab-id="grid"]').click();
    await page.locator(`.grid-colors-item[data-color="${GRID_COLOR}"]`).click();
    await page.locator(".enable-grid-checkbox").check();
    await closeDrawer(page, "user");

    await openSaveSettingsPanel(page);
    const downloadPromise = page.waitForEvent("download");
    await testId(page, "save-file-download-button").click();
    const download = await downloadPromise;
    const downloadPath = await download.path();

    const fs = await import("fs/promises");
    const path = await import("path");
    const piskelFilePath = path.join(path.dirname(downloadPath), "preferences.piskel");
    await fs.copyFile(downloadPath, piskelFilePath);

    // A new browser context has its own storage.
    const otherContext = await browser.newContext();
    const otherPage = await otherContext.newPage();
    await openEditor(otherPage);
    await openImportSettingsPanel(otherPage);

    const fileChooserPromise = otherPage.waitForEvent("filechooser");
    await testId(otherPage, "import-piskel-button").click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(piskelFilePath);

    await otherPage.waitForSelector(".current-step .import-mode", { state: "attached" });
    otherPage.once("dialog", (dialog) => dialog.accept());
    await otherPage.click(".import-mode-replace-button");
    await otherPage.waitForSelector("#dialog-container-wrapper:not(.show)", { state: "attached" });

    await expectGridPreferences(otherPage, DEFAULT_GRID_COLOR, false);
    await otherContext.close();
  });
});

test.describe("Preferences last tab", () => {
  test("the drawer opens on the Misc tab by default", { tag: ["@settings.last-tab"] }, async ({ page }) => {
    await openEditor(page);
    await openPreferences(page);
    await expectPreferencesTab(page, "misc");
  });

  test("the drawer reopens on the last tab used", { tag: ["@settings.last-tab"] }, async ({ page }) => {
    await openEditor(page);
    await openPreferences(page);

    await page.locator('[data-tab-id="grid"]').click();
    await expectPreferencesTab(page, "grid");
    await closeDrawer(page, "user");
    await openPreferences(page);
    await expectPreferencesTab(page, "grid");

    await page.locator('[data-tab-id="tile"]').click();
    await expectPreferencesTab(page, "tile");
    await closeDrawer(page, "user");
    await openPreferences(page);
    await expectPreferencesTab(page, "tile");
  });

  test("the last tab used is remembered after a reload", { tag: ["@settings.last-tab"] }, async ({ page }) => {
    await openEditor(page);
    await openPreferences(page);
    await page.locator('[data-tab-id="tile"]').click();
    await expectPreferencesTab(page, "tile");

    await page.reload();
    await openPreferences(page);
    await expectPreferencesTab(page, "tile");
  });
});

test.describe("Resize options", () => {
  test("the resize options have the expected defaults", { tag: ["@settings.resize-saved"] }, async ({ page }) => {
    await openEditor(page);
    await openResizeSettingsPanel(page);

    await expect(page.locator(".resize-ratio-checkbox")).toBeChecked();
    await expect(page.locator(".resize-content-checkbox")).not.toBeChecked();
    await expect(page.locator('[data-origin="TOPLEFT"]')).toHaveClass(/selected/);
    await expect(page.locator(".anchor-wrapper")).not.toHaveClass(/disabled/);
  });

  test("the anchor and an unlinked ratio are remembered after a reload", { tag: ["@settings.resize-saved"] }, async ({ page }) => {
    await openEditor(page);
    await openResizeSettingsPanel(page);

    await page.locator('[data-origin="BOTTOMRIGHT"]').click();
    await page.locator(".resize-ratio-checkbox").uncheck();
    await closeDrawer(page, "resize");

    await page.reload();
    await openResizeSettingsPanel(page);

    await expect(page.locator(".resize-ratio-checkbox")).not.toBeChecked();
    await expect(page.locator(".resize-content-checkbox")).not.toBeChecked();
    await expect(page.locator('[data-origin="BOTTOMRIGHT"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-origin="TOPLEFT"]')).not.toHaveClass(/selected/);

    // The restored option is effective: width and height are not linked.
    await page.locator('[name="resize-width"]').fill("10");
    await expect(page.locator('[name="resize-height"]')).toHaveValue("32");
  });

  test("resize content is remembered after a reload and keeps the anchor disabled", { tag: ["@settings.resize-saved"] }, async ({ page }) => {
    await openEditor(page);
    await openResizeSettingsPanel(page);

    await page.locator(".resize-content-checkbox").check();
    await closeDrawer(page, "resize");

    await page.reload();
    await openResizeSettingsPanel(page);

    await expect(page.locator(".resize-content-checkbox")).toBeChecked();
    await expect(page.locator(".resize-ratio-checkbox")).toBeChecked();
    await expect(page.locator(".anchor-wrapper")).toHaveClass(/disabled/);
  });
});
