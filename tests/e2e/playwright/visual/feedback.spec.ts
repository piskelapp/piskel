import test, { expect, Page } from "@playwright/test";
import {
  assertNotification,
  assertOnlyNotification,
  assertProgressBar,
  createThreeFrames,
  expectVisualState,
  getExportDownloadButton,
  getSaveInBrowserButton,
  holdBackgroundWork,
  letTimePass,
  makeBrowserSavesFail,
  moveMouseAway,
  openEditor,
  openEditorWithFakeClock,
  openExportSettingsPanel,
  openSaveSettingsPanel,
  pauseClock,
  resizeSprite,
  runClock,
  saveInBrowser,
  selectExportTab,
  testId,
} from "../testutils";

const notification = (page: Page) => page.locator("#user-message");
const visibleTooltip = (page: Page) => page.locator(".tooltip.in");

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "confirms a save",
    { tag: ["@editor.notifications", "@save-and-storage.save-feedback"] },
    async ({ page }) => {
      await saveInBrowser(page, "Saved sprite");
      await expect(notification(page)).toBeVisible();
      await moveMouseAway(page);

      await expectVisualState(notification(page), "feedback--notification-success");
    }
  );

  test(
    "reports a failed save",
    { tag: ["@editor.notifications", "@save-and-storage.save-feedback"] },
    async ({ page }) => {
      await makeBrowserSavesFail(page);
      await openSaveSettingsPanel(page);
      await getSaveInBrowserButton(page).click();
      await assertNotification(page, "Saving failed");
      await moveMouseAway(page);

      await expectVisualState(notification(page), "feedback--notification-error");
    }
  );

  test(
    "links to the details of a performance problem",
    { tag: ["@editor.notifications", "@canvas.performance-notification"] },
    async ({ page }) => {
      await resizeSprite(page, 600, 600);
      await assertOnlyNotification(page, "Performance problem detected");
      await moveMouseAway(page);

      await expectVisualState(notification(page), "feedback--notification-link");
    }
  );
});

test.describe("Progress bar", () => {
  test(
    "shows the progress of a long task",
    { tag: ["@editor.progress-bar"] },
    async ({ page }) => {
      // Stop the clock and the workers, so that the export stays at 0%.
      await openEditorWithFakeClock(page);
      await createThreeFrames(page);
      await openExportSettingsPanel(page);
      await selectExportTab(page, "gif");
      await letTimePass(page, 2000);
      await pauseClock(page);
      await holdBackgroundWork(page);

      // The bar shows after 300 ms.
      await getExportDownloadButton(page, "gif").click();
      await runClock(page, 301);
      await assertProgressBar(page, "Building animated GIF ...", "0%");
      await moveMouseAway(page);

      await expectVisualState(page.locator(".progress-bar-container"), "feedback--progress-bar");
    }
  );
});

test.describe("Tooltips", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "shows the shortcut of a tool, on the right",
    { tag: ["@drawing-tools.tooltips"] },
    async ({ page }) => {
      await page.locator('[data-tool-id="tool-pen"]').hover();
      await expect(visibleTooltip(page)).toBeVisible();

      await expectVisualState(visibleTooltip(page), "feedback--tooltip-tool-right");
    }
  );

  test(
    "shows formatted text on a drawer icon, on the left",
    { tag: ["@settings.drawers"] },
    async ({ page }) => {
      await page.locator('[data-setting="export"]').hover();
      await expect(visibleTooltip(page)).toBeVisible();

      await expectVisualState(visibleTooltip(page), "feedback--tooltip-html-left");
    }
  );

  test(
    "shows a simple tooltip on top of a button",
    { tag: ["@layers.add"] },
    async ({ page }) => {
      await testId(page, "layer-delete-button").hover();
      await expect(visibleTooltip(page)).toBeVisible();

      await expectVisualState(visibleTooltip(page), "feedback--tooltip-top");
    }
  );
});

test.describe("Popup preview", () => {
  test(
    "opens the preview in its own window",
    { tag: ["@preview.popup"] },
    async ({ page }) => {
      await openEditor(page);

      const popupOpening = page.waitForEvent("popup");
      await page.locator(".minimap-container").hover();
      await testId(page, "open-popup-preview-button").click();
      const popup = await popupOpening;
      await expect(popup.locator(".preview-container, .popup-container").first()).toBeVisible();

      await expectVisualState(popup.locator("body"), "feedback--popup-preview");
      await popup.close();
    }
  );
});
