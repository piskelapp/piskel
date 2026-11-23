import test, { expect, Page } from "@playwright/test";
import {
  assertLocalSaves,
  assertNoBackupSession,
  assertOnlyNotification,
  assertUnsupportedBrowserWarning,
  clickNotificationLink,
  clickTool,
  createDistinctColors,
  createPaletteWithColors,
  drawAtPixel,
  expectVisualState,
  letTimePass,
  moveMouseAway,
  openBackupsInNewTab,
  openBrowseLocalSaves,
  openCheatsheet,
  openCreatePaletteDialog,
  openEditPaletteDialog,
  openEditor,
  openEditorInNewPage,
  openEditorWithFakeClock,
  remapShortcut,
  resizeSprite,
  saveInBrowser,
  selectPaletteDialogColor,
  testId,
  viewBackupSession,
  waitForCanvasRelayout,
} from "../testutils";

const FOUR_COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffffff"];
const COLOR_COUNT_TO_SCROLL = 120;
const LONG_NAME = "A saved sprite with a name much too long to fit on one line of the dialog";
const ONE_MINUTE = 60 * 1000;
const SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

const dialog = (page: Page) => testId(page, "dialog");

test.describe("Palette dialog", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "starts with an empty list when creating a palette",
    { tag: ["@colors-and-palettes.create", "@colors-and-palettes.palette-dialog-buttons"] },
    async ({ page }) => {
      await openCreatePaletteDialog(page);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--palette-create");
    }
  );

  test(
    "offers other buttons and shows a selected color when editing",
    { tag: ["@colors-and-palettes.edit", "@colors-and-palettes.palette-dialog-buttons"] },
    async ({ page }) => {
      await createPaletteWithColors(page, "Four colors", FOUR_COLORS);
      await openEditPaletteDialog(page);
      await selectPaletteDialogColor(page, 1);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--palette-edit");
    }
  );

  test(
    "scrolls a long list of colors",
    { tag: ["@colors-and-palettes.edit"] },
    async ({ page }) => {
      await createPaletteWithColors(page, "Many colors", createDistinctColors(COLOR_COUNT_TO_SCROLL));
      await openEditPaletteDialog(page);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--palette-scrolling");
    }
  );
});

test.describe("Browse local saves dialog", () => {
  test(
    "is empty without any save",
    { tag: ["@save-and-storage.browse-local"] },
    async ({ page }) => {
      await openEditor(page);
      await openBrowseLocalSaves(page);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--local-saves-empty");
    }
  );

  test(
    "lists the saves, with long names",
    { tag: ["@save-and-storage.browse-local"] },
    async ({ page }) => {
      // A fixed start time, as the dates are shown and change the width of their column.
      await page.clock.install({ time: new Date("2026-01-01T12:00:00Z") });
      await openEditor(page);
      await saveInBrowser(page, "Short name");

      // The list is sorted by date, so the saves can't happen at the same moment.
      await letTimePass(page, 2 * ONE_MINUTE);
      await saveInBrowser(page, LONG_NAME);

      await openBrowseLocalSaves(page);
      await assertLocalSaves(page, [LONG_NAME, "Short name"]);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--local-saves-list");
    }
  );
});

test.describe("Browse backups dialog", () => {
  test(
    "shows a message without any backup",
    { tag: ["@save-and-storage.browse-backups"] },
    async ({ page }) => {
      await openEditor(page);
      const backups = await openBackupsInNewTab(page);
      await assertNoBackupSession(backups);
      await moveMouseAway(backups);

      await expectVisualState(dialog(backups), "dialogs--backups-empty");
    }
  );

  test(
    "lists the sessions, then the snapshots of a session",
    { tag: ["@save-and-storage.browse-backups"] },
    async ({ page }) => {
      // Create a backup: it's taken a minute after a change.
      await openEditorWithFakeClock(page);
      await saveInBrowser(page, "Backed up sprite");
      await clickTool(page, "tool-pen");
      await drawAtPixel(page, 0, 0);
      await letTimePass(page, ONE_MINUTE);

      // Backups of the current session aren't listed, so start another one.
      const nextSession = await openEditorInNewPage(page);
      await page.close();
      const backups = await openBackupsInNewTab(nextSession);
      await expect(backups.locator(".session-item")).toHaveCount(1);
      await moveMouseAway(backups);

      // The dates are the time of the test run.
      const dates = [backups.locator(".session-details-info"), backups.locator(".snapshot-details-info")];
      await expectVisualState(dialog(backups), "dialogs--backups-sessions", { mask: dates });

      await viewBackupSession(backups, 0, 1);
      await moveMouseAway(backups);
      await expectVisualState(dialog(backups), "dialogs--backups-snapshots", { mask: dates });
    }
  );
});

test.describe("Keyboard shortcuts dialog", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "wraps its columns in a narrow window",
    { tag: ["@keyboard-shortcuts.cheatsheet-content"] },
    async ({ page }) => {
      await openCheatsheet(page);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--cheatsheet-narrow");
    }
  );

  test(
    "marks custom, missing and edited shortcuts",
    {
      tag: [
        "@keyboard-shortcuts.custom-marker",
        "@keyboard-shortcuts.missing-key",
        "@keyboard-shortcuts.remap",
      ],
    },
    async ({ page }) => {
      await openCheatsheet(page);

      // Giving the eraser's key to the pen marks the pen as custom, and the eraser as missing.
      await remapShortcut(page, "tool-pen", "e");

      // Leave another shortcut waiting for its new key.
      await page.locator('[data-shortcut-id="tool-paint-bucket"]').click();
      await expect(page.locator(".cheatsheet-shortcut-editing")).toHaveCount(1);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--cheatsheet-remapped");
    }
  );
});

test.describe("Keyboard shortcuts dialog in a wide window", () => {
  // Set before loading: resizing right after the load races the layout.
  test.use({ viewport: { width: 1400, height: 800 } });

  test(
    "shows three columns",
    { tag: ["@keyboard-shortcuts.cheatsheet-content"] },
    async ({ page }) => {
      await openEditor(page);
      await waitForCanvasRelayout(page);
      await openCheatsheet(page);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--cheatsheet-wide");
    }
  );
});

test.describe("Performance dialog", () => {
  test(
    "explains the performance problem",
    { tag: ["@canvas.performance-dialog"] },
    async ({ page }) => {
      await openEditor(page);
      await resizeSprite(page, 600, 600);
      await assertOnlyNotification(page, "Performance problem detected");
      await clickNotificationLink(page);
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--performance");
    }
  );
});

test.describe("Unsupported browser dialog", () => {
  test.use({ userAgent: SAFARI });

  test(
    "warns at startup",
    { tag: ["@editor.unsupported-browser"] },
    async ({ page }) => {
      await openEditor(page);
      await assertUnsupportedBrowserWarning(page, "Safari");
      await moveMouseAway(page);

      await expectVisualState(dialog(page), "dialogs--unsupported-browser");
    }
  );
});
