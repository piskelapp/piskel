import test, { expect } from "@playwright/test";
import {
  assertSettingsDrawerOpen,
  expectVisualState,
  gridFromRows,
  moveMouseAway,
  openEditor,
  readZoom,
  resizeSprite,
  setFps,
  setPiskelFromGrid,
  setTileMode,
  testId,
} from "../testutils";

const PIXEL_IN_CORNER = [
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

test.describe("Preview panel", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(PIXEL_IN_CORNER));
  });

  test(
    "hides its actions until hovered",
    { tag: ["@preview.fps"] },
    async ({ page }) => {
      await moveMouseAway(page);

      await expectVisualState(testId(page, "preview-panel"), "preview--default");
    }
  );

  test(
    "shows the actions, active toggles and a custom FPS on hover",
    { tag: ["@preview.toggle-grid", "@preview.onion-skin-toggle", "@preview.fps"] },
    async ({ page }) => {
      await testId(page, "onion-skin-toggle-button").click();
      await setFps(page, 5);

      // Turn on the grid from the actions that show on hover.
      await page.locator(".minimap-container").hover();
      await testId(page, "grid-toggle-button").click();
      await moveMouseAway(page);
      await page.locator(".minimap-container").hover();

      await expectVisualState(testId(page, "preview-panel"), "preview--actions-toggled");
    }
  );

  test(
    "opens the size menu",
    { tag: ["@preview.sizes", "@preview.size-options"] },
    async ({ page }) => {
      await testId(page, "preview-drop-down").hover();

      await expectVisualState(testId(page, "preview-panel"), "preview--size-menu-open");
    }
  );

  test(
    "repeats the sprite in tile mode",
    { tag: ["@preview.tile-mode"] },
    async ({ page }) => {
      await setTileMode(page, true);
      await assertSettingsDrawerOpen(page, false);
      await moveMouseAway(page);

      await expectVisualState(testId(page, "preview-panel"), "preview--tile-mode");
    }
  );
});

test.describe("Preview panel of a large sprite", () => {
  test(
    "disables the size menu when the sprite is larger than the preview",
    { tag: ["@preview.size-options"] },
    async ({ page }) => {
      // An empty sprite: a pixel scaled down would blur differently from run to run.
      await openEditor(page);
      await resizeSprite(page, 300, 300);
      await assertSettingsDrawerOpen(page, false);
      await moveMouseAway(page);
      await page.locator(".minimap-container").hover();

      await expectVisualState(testId(page, "preview-panel"), "preview--size-menu-disabled");
    }
  );

  test(
    "shows the minimap frame when zoomed in",
    { tag: ["@preview.minimap", "@canvas.zoom-shortcuts"] },
    async ({ page }) => {
      await openEditor(page);
      await resizeSprite(page, 64, 64);
      await assertSettingsDrawerOpen(page, false);

      // Zoom one step at a time, stopping as soon as the minimap appears. Wheel
      // events are timing dependent, and would give a different zoom on each run.
      const minimap = page.locator(".minimap-crop-frame");
      while (!(await minimap.isVisible())) {
        const zoomBefore = await readZoom(page);
        await page.keyboard.press("+");
        await expect.poll(() => readZoom(page)).not.toBe(zoomBefore);
      }
      await moveMouseAway(page);

      await expectVisualState(testId(page, "preview-panel"), "preview--minimap");
    }
  );
});
