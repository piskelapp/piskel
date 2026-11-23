import test from "@playwright/test";
import {
  assertSettingsDrawerOpen,
  clickTool,
  closeNotification,
  dragBetweenPixels,
  enableVisibleGrid,
  expectVisualState,
  gridFromRows,
  moveMouseAway,
  openEditor,
  resizeSprite,
  waitForCanvasRelayout,
  setPiskelFromGrid,
  testId,
} from "../testutils";

const DRAWN_SPRITE = [
  "..........",
  ".XXXXXXXX.",
  ".X......X.",
  ".X.XXXX.X.",
  ".X.X..X.X.",
  ".X.X..X.X.",
  ".X.XXXX.X.",
  ".X......X.",
  ".XXXXXXXX.",
  "..........",
];

const WINDOW_SIZES = [
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 800, height: 600 },
  { width: 1280, height: 450 },
];

test.describe("Application layout", () => {
  for (const { width, height } of WINDOW_SIZES) {
    test.describe(`in a window of ${width}x${height}`, () => {
      // Set before loading: resizing right after the load races the first canvas fit.
      test.use({ viewport: { width, height } });

      test("fits the window", { tag: ["@canvas.fit-on-resize"] }, async ({ page }) => {
        await openEditor(page);
        await waitForCanvasRelayout(page);
        await moveMouseAway(page);

        await expectVisualState(page.locator("body"), `layout--window-${width}x${height}`);
      });
    });
  }

  test.describe("on a high density screen", () => {
    test.use({ deviceScaleFactor: 2 });

    test(
      "uses the sharper icons",
      { tag: ["@canvas.fit-on-resize"] },
      async ({ page }) => {
        await openEditor(page);
        await waitForCanvasRelayout(page);
        await moveMouseAway(page);

        await expectVisualState(page.locator("body"), "layout--high-density");
      }
    );
  });

  for (const { name, width, height } of [
    { name: "wide", width: 64, height: 16 },
    { name: "tall", width: 16, height: 64 },
  ]) {
    test(
      `shows a ${name} sprite`,
      { tag: ["@canvas.fit-on-resize", "@settings.resize"] },
      async ({ page }) => {
        // These shapes exercise the centering margins of each column.
        await openEditor(page);
        await resizeSprite(page, width, height);
        await assertSettingsDrawerOpen(page, false);
        await waitForCanvasRelayout(page);
        await moveMouseAway(page);

        await expectVisualState(page.locator("body"), `layout--sprite-${name}`);
      }
    );
  }

  test(
    "shows the performance warning for a huge sprite",
    { tag: ["@canvas.performance-warning"] },
    async ({ page }) => {
      await openEditor(page);
      await resizeSprite(page, 600, 600);
      await closeNotification(page);
      await assertSettingsDrawerOpen(page, false);
      await waitForCanvasRelayout(page);
      await moveMouseAway(page);

      await expectVisualState(page.locator("body"), "layout--performance-warning");
    }
  );

  test(
    "shows a drawing with its grid and a selection",
    { tag: ["@canvas.grid", "@selection.rectangle"] },
    async ({ page }) => {
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(DRAWN_SPRITE));

      // Turn on the grid, then close the preferences drawer.
      await enableVisibleGrid(page);
      await page.locator('[data-setting="user"]').click();
      await assertSettingsDrawerOpen(page, false);

      // Select part of the drawing.
      await clickTool(page, "tool-rectangle-select");
      await dragBetweenPixels(page, 2, 2, 6, 6);
      await moveMouseAway(page);

      await expectVisualState(testId(page, "drawing-canvas"), "layout--canvas-grid-selection");
    }
  );
});
