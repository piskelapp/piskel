import test from "@playwright/test";
import {
  expectVisualState,
  moveMouseAway,
  openEditor,
  openResizeSettingsPanel,
  testId,
} from "../testutils";

test.describe("Preferences and resize drawers", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "shows the preferences tabs",
    { tag: ["@settings.drawers", "@settings.grid-enabled", "@settings.tile-mode", "@settings.background"] },
    async ({ page }) => {
      const drawer = testId(page, "settings-drawer");

      // The drawer opens on the Misc tab.
      await page.locator('[data-setting="user"]').click();
      await moveMouseAway(page);
      await expectVisualState(drawer, "settings--preferences-misc");

      // The whole page once, for the selected icon and the drawer over the canvas.
      await expectVisualState(page.locator("body"), "settings--drawer-open-page");

      // The Grid tab, enabled with a color selected.
      await page.locator('[data-tab-id="grid"]').click();
      await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
      await page.locator(".enable-grid-checkbox").check();
      await moveMouseAway(page);
      await expectVisualState(drawer, "settings--preferences-grid");

      // The Tile tab, enabled.
      await page.locator('[data-tab-id="tile"]').click();
      await page.locator(".tile-mode-checkbox").check();
      await moveMouseAway(page);
      await expectVisualState(drawer, "settings--preferences-tile");
    }
  );

  test(
    "shows the resize drawer, with its anchor disabled when resizing the content",
    { tag: ["@settings.resize", "@settings.resize-anchor", "@settings.resize-content", "@settings.resize-ratio"] },
    async ({ page }) => {
      const drawer = testId(page, "settings-drawer");

      await openResizeSettingsPanel(page);
      await moveMouseAway(page);
      await expectVisualState(drawer, "settings--resize-default");

      // Resizing the content makes the anchor pointless, so it gets disabled.
      await page.locator(".resize-ratio-checkbox").setChecked(true);
      await page.locator(".resize-content-checkbox").setChecked(true);
      await moveMouseAway(page);
      await expectVisualState(drawer, "settings--resize-content");
    }
  );
});
