import test, { expect } from "@playwright/test";
import {
  createThreeFrames,
  expectVisualState,
  getCurrentPiskelColorCount,
  getSaveInBrowserButton,
  gridFromRows,
  importPiskelFile,
  makeBrowserSavesHang,
  moveMouseAway,
  openEditor,
  openExportSettingsPanel,
  openImportSettingsPanel,
  openSaveSettingsPanel,
  selectExportTab,
  setPiskelFromGrid,
  testId,
  waitFor,
} from "../testutils";

const TOO_MANY_COLORS = "misc/gif-tests/too-many-colors-with-transparency.piskel";
const LONG_TEXT = "A title and a description much too long to fit in the fields of the drawer";
const SMALL_SPRITE = [
  "XX........",
  "XX........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
  "..........",
];

test.describe("Save, import and export drawers", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "shows the save drawer",
    { tag: ["@settings.drawers", "@save-and-storage.browser-save"] },
    async ({ page }) => {
      await openSaveSettingsPanel(page);
      await moveMouseAway(page);

      await expectVisualState(testId(page, "settings-drawer"), "drawers--save-default");
    }
  );

  test(
    "disables the save buttons during a save, with long texts",
    { tag: ["@save-and-storage.save-feedback"] },
    async ({ page }) => {
      await makeBrowserSavesHang(page);
      await openSaveSettingsPanel(page);
      await page.locator("#save-name").fill(LONG_TEXT);
      await page.locator("#save-description").fill(LONG_TEXT);

      // Start a save that never ends.
      await getSaveInBrowserButton(page).click();
      await expect(getSaveInBrowserButton(page)).toBeDisabled();
      await moveMouseAway(page);

      await expectVisualState(testId(page, "settings-drawer"), "drawers--save-in-progress");
    }
  );

  test(
    "shows the import drawer",
    { tag: ["@settings.drawers", "@import.browse-images"] },
    async ({ page }) => {
      await openImportSettingsPanel(page);
      await moveMouseAway(page);

      await expectVisualState(testId(page, "settings-drawer"), "drawers--import");
    }
  );

  test(
    "shows the export tabs that don't depend on the sprite",
    { tag: ["@export.gif", "@export.zip-split-layers", "@export.c-file"] },
    async ({ page }) => {
      const drawer = testId(page, "settings-drawer");
      await setPiskelFromGrid(page, gridFromRows(SMALL_SPRITE));
      await openExportSettingsPanel(page);

      // The GIF tab.
      await selectExportTab(page, "gif");
      await moveMouseAway(page);
      await expectVisualState(drawer, "drawers--export-gif");

      // The Zip tab, where splitting by layers shows one more option.
      await selectExportTab(page, "zip");
      await page.locator(".zip-split-layers-checkbox").check();
      await moveMouseAway(page);
      await expectVisualState(drawer, "drawers--export-zip-split");

      // The Others tab.
      await selectExportTab(page, "misc");
      await moveMouseAway(page);
      await expectVisualState(drawer, "drawers--export-others");
    }
  );

  test(
    "warns about too many colors for a GIF",
    { tag: ["@export.gif-warning"] },
    async ({ page }) => {
      await importPiskelFile(page, TOO_MANY_COLORS);
      await waitFor(async () => (await getCurrentPiskelColorCount(page)) >= 256);

      await openExportSettingsPanel(page);
      await selectExportTab(page, "gif");
      await expect(testId(page, "gif-colors-warning")).toBeVisible();
      await moveMouseAway(page);

      await expectVisualState(testId(page, "settings-drawer"), "drawers--export-gif-warning");
    }
  );

  test(
    "hides the spritesheet layout of the PNG tab for a single frame",
    { tag: ["@export.png-spritesheet"] },
    async ({ page }) => {
      await setPiskelFromGrid(page, gridFromRows(SMALL_SPRITE));
      await openExportSettingsPanel(page);
      await selectExportTab(page, "png");
      await moveMouseAway(page);

      await expectVisualState(testId(page, "settings-drawer"), "drawers--export-png-single-frame");
    }
  );

  test(
    "shows the spritesheet layout of the PNG tab for several frames",
    { tag: ["@export.png-spritesheet"] },
    async ({ page }) => {
      await createThreeFrames(page);
      await openExportSettingsPanel(page);
      await selectExportTab(page, "png");
      await moveMouseAway(page);

      await expectVisualState(testId(page, "settings-drawer"), "drawers--export-png-several-frames");
    }
  );

  test(
    "opens the data URI of a PNG in a popup",
    { tag: ["@export.png-data-uri"] },
    async ({ page }) => {
      await setPiskelFromGrid(page, gridFromRows(SMALL_SPRITE));
      await openExportSettingsPanel(page);
      await selectExportTab(page, "png");

      const popupOpening = page.waitForEvent("popup");
      await page.locator(".datauri-open-button").click();
      const popup = await popupOpening;
      await expect.poll(() => popup.title()).toMatch(/^data:image\/png;base64,/);

      await expectVisualState(popup.locator("body"), "drawers--export-data-uri-popup");
      await popup.close();
    }
  );
});
