import test, { expect } from "@playwright/test";
import {
  clickTool,
  drawAtPixel,
  expectVisualState,
  getLoadingScreen,
  getSaveInBrowserButton,
  hoverPixel,
  makeBrowserSavesHang,
  moveMouseAway,
  openEditor,
  openSaveSettingsPanel,
  saveInBrowser,
  startOpeningEditorWithoutItsScript,
  testId,
  waitForCanvasRelayout,
} from "../testutils";

const LONG_TITLE = "A sprite with a really long title that keeps going and going";

test.describe("Application chrome", () => {
  test(
    "shows the loading screen",
    { tag: ["@editor.loading"] },
    async ({ page }) => {
      const finishLoading = await startOpeningEditorWithoutItsScript(page);
      await expect(getLoadingScreen(page)).toBeVisible();

      await expectVisualState(getLoadingScreen(page), "chrome--loading");
      await finishLoading();
    }
  );

  test(
    "shows the title of a new sprite",
    { tag: ["@save-and-storage.header-name"] },
    async ({ page }) => {
      await openEditor(page);
      await moveMouseAway(page);

      await expectVisualState(testId(page, "app-header"), "chrome--header-new");
    }
  );

  test(
    "shows a long title with unsaved changes",
    { tag: ["@save-and-storage.header-name", "@save-and-storage.dirty-indicator"] },
    async ({ page }) => {
      await openEditor(page);
      await saveInBrowser(page, LONG_TITLE);

      // Draw something, so that the title gets the unsaved marker.
      await clickTool(page, "tool-pen");
      await drawAtPixel(page, 0, 0);
      await expect(page.locator(".piskel-name")).toContainText("*");
      await moveMouseAway(page);

      await expectVisualState(testId(page, "app-header"), "chrome--header-long-title-dirty");
    }
  );

  test(
    "shows the title in red during a save",
    { tag: ["@save-and-storage.browser-save"] },
    async ({ page }) => {
      await openEditor(page);
      await makeBrowserSavesHang(page);

      // Start a save that never ends.
      await openSaveSettingsPanel(page);
      await page.locator("#save-name").fill("Saving");
      await getSaveInBrowserButton(page).click();
      await expect(page.locator(".piskel-name-saving")).toBeVisible();
      await moveMouseAway(page);

      await expectVisualState(testId(page, "app-header"), "chrome--header-saving");
    }
  );

  test(
    "shows the coordinates of a drag",
    { tag: ["@canvas.coords-drag"] },
    async ({ page }) => {
      await openEditor(page);
      await clickTool(page, "tool-rectangle-select");
      await waitForCanvasRelayout(page);

      // The coordinates only show the drag while the button is held.
      await hoverPixel(page, 1, 1);
      await page.mouse.down();
      // The app throttles cursor updates, so a single move can be dropped.
      await expect(async () => {
        await hoverPixel(page, 4, 3);
        await hoverPixel(page, 5, 4);
        await expect(testId(page, "cursor-coordinates")).toContainText("(5x4)", { timeout: 500 });
      }).toPass();

      await expectVisualState(testId(page, "cursor-coordinates"), "chrome--cursor-coordinates");
      await page.mouse.up();
    }
  );

  test(
    "lights up the keyboard shortcuts link on hover",
    { tag: ["@keyboard-shortcuts.cheatsheet-open"] },
    async ({ page }) => {
      await openEditor(page);
      await page.locator(".cheatsheet-link").hover();

      await expectVisualState(page.locator(".cheatsheet-link"), "chrome--cheatsheet-link-hover");
    }
  );
});
