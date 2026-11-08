import test, { expect, Page } from "@playwright/test";
import {
  assertFrameCount,
  assertSettingsDrawerOpen,
  expectVisualState,
  getAddFrameButton,
  getFrameTiles,
  moveMouseAway,
  openEditor,
  resizeSprite,
  selectFrame,
  testId,
  toggleFrameVisibility,
} from "../testutils";

const FRAME_COUNT_TO_OVERFLOW = 12;

const addFrames = async (page: Page, frameCount: number) => {
  for (let existing = 1; existing < frameCount; existing++) {
    await getAddFrameButton(page).click();
  }
  await assertFrameCount(page, frameCount);
};

test.describe("Frames column", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "offers fewer actions on the only frame",
    { tag: ["@frames.at-least-one", "@frames.tiles"] },
    async ({ page }) => {
      await getFrameTiles(page).first().hover();

      await expectVisualState(testId(page, "frame-list"), "frames--single-hover");
    }
  );

  test(
    "shows all the looks of a tile at once",
    { tag: ["@frames.select", "@frames.tiles", "@frames.visibility"] },
    async ({ page }) => {
      await addFrames(page, 4);

      // The second tile is current, the third is hidden from the preview.
      await selectFrame(page, 1);
      await toggleFrameVisibility(page, 2);

      // Hover the last tile, to reveal its actions.
      await moveMouseAway(page);
      await getFrameTiles(page).nth(3).hover();

      await expectVisualState(testId(page, "frame-list"), "frames--tiles-packed");
    }
  );

  test(
    "shows both overflow hints in the middle of a long list",
    { tag: ["@frames.overflow"] },
    async ({ page }) => {
      await addFrames(page, FRAME_COUNT_TO_OVERFLOW);

      // Scroll to the middle of the list.
      await page.locator("#preview-list-scroller").evaluate((scroller) => {
        scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
      });
      await expect(page.locator(".top-overflow-visible.bottom-overflow-visible")).toBeAttached();
      await moveMouseAway(page);

      await expectVisualState(testId(page, "frame-list"), "frames--overflow-both");
    }
  );

  test(
    "shows the placeholder while dragging a tile",
    { tag: ["@frames.reorder"] },
    async ({ page }) => {
      await addFrames(page, 3);

      // Hold a tile over the next one, without dropping it.
      const handle = getFrameTiles(page).nth(0).locator(".dnd-action");
      await handle.hover();
      const handleBox = (await handle.boundingBox())!;
      const targetBox = (await getFrameTiles(page).nth(1).boundingBox())!;
      await page.mouse.down();
      await page.mouse.move(handleBox.x, targetBox.y + targetBox.height / 2, { steps: 10 });
      await expect(page.locator(".preview-tile-drop-proxy")).toBeAttached();

      await expectVisualState(testId(page, "frame-list"), "frames--drag-placeholder");
      await page.mouse.up();
    }
  );

  for (const { name, width, height } of [
    { name: "wide", width: 64, height: 16 },
    { name: "tall", width: 16, height: 64 },
  ]) {
    test(
      `centers the thumbnail of a ${name} sprite`,
      { tag: ["@frames.tiles"] },
      async ({ page }) => {
        await resizeSprite(page, width, height);
        await assertSettingsDrawerOpen(page, false);
        await moveMouseAway(page);

        await expectVisualState(testId(page, "frame-list"), `frames--sprite-${name}`);
      }
    );
  }
});
