import test from "@playwright/test";
import {
  clickTool,
  expectVisualState,
  moveMouseAway,
  openEditor,
  setPenSize,
  setPrimaryColor,
  testId,
} from "../testutils";

test.describe("Tool column", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "shows every tool with the pen selected",
    { tag: ["@drawing-tools.pen"] },
    async ({ page }) => {
      await moveMouseAway(page);

      await expectVisualState(testId(page, "tools-container"), "tools--default");
    }
  );

  test(
    "shows another tool selected and a hovered tool",
    { tag: ["@drawing-tools.paint-bucket", "@drawing-tools.tooltips"] },
    async ({ page }) => {
      await clickTool(page, "tool-paint-bucket");
      await moveMouseAway(page);
      await page.locator('[data-tool-id="tool-eraser"]').hover();

      await expectVisualState(testId(page, "tools-container"), "tools--selected-and-hover");
    }
  );

  test(
    "shows the real size above the largest pen size",
    { tag: ["@drawing-tools.pen-size-picker"] },
    async ({ page }) => {
      await setPenSize(page, 6);
      await moveMouseAway(page);

      await expectVisualState(testId(page, "pen-size-picker"), "tools--pen-size-labeled");
    }
  );

  test(
    "shows custom colors after a swap",
    { tag: ["@colors-and-palettes.swap"] },
    async ({ page }) => {
      await setPrimaryColor(page, "#ff0000");
      await testId(page, "swap-colors-button").click();
      await moveMouseAway(page);

      await expectVisualState(testId(page, "current-colors"), "tools--colors-swapped");
    }
  );
});
