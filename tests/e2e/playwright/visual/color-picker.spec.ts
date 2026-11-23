import test, { expect, Page } from "@playwright/test";
import {
  expectVisualState,
  openEditor,
  setPrimaryColor,
  waitForCanvasRelayout,
} from "../testutils";

const PRIMARY = 0;
const SECONDARY = 1;

const openPickerPanel = (page: Page) => page.locator(".sp-container:not(.sp-hidden)");

/** Click the color swatch of the tool column that opens the picker */
const openPicker = async (page: Page, swatchIndex: number) => {
  await page.locator(".palette-wrapper .sp-replacer").nth(swatchIndex).click();
  await expect(openPickerPanel(page)).toBeVisible();
};

test.describe("Color picker", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "shows an opaque color in hexadecimal",
    { tag: ["@colors-and-palettes.picker", "@colors-and-palettes.picker-opaque"] },
    async ({ page }) => {
      await setPrimaryColor(page, "#ff0000");
      await openPicker(page, PRIMARY);

      await expectVisualState(openPickerPanel(page), "color-picker--primary-hex");
    }
  );

  test(
    "shows a transparent color",
    { tag: ["@colors-and-palettes.picker"] },
    async ({ page }) => {
      await openPicker(page, SECONDARY);

      await expectVisualState(openPickerPanel(page), "color-picker--secondary-transparent");
    }
  );

  test(
    "shows a color in RGB when set in the preferences",
    { tag: ["@settings.color-format"] },
    async ({ page }) => {
      // Choose RGB, then close the preferences drawer.
      await page.locator('[data-setting="user"]').click();
      await page.locator(".color-format-select").selectOption({ index: 1 });
      await page.locator('[data-setting="user"]').click();

      await setPrimaryColor(page, "#ff0000");
      await openPicker(page, PRIMARY);

      await expectVisualState(openPickerPanel(page), "color-picker--primary-rgb");
    }
  );

});

test.describe("Color picker in a short window", () => {
  // Lower than this, the tool column clips the color swatches.
  test.use({ viewport: { width: 1280, height: 580 } });

  test(
    "stays on screen",
    { tag: ["@colors-and-palettes.picker"] },
    async ({ page }) => {
      await openEditor(page);
      await waitForCanvasRelayout(page);
      await openPicker(page, PRIMARY);

      // The whole page, as the point is where the picker sits.
      await expectVisualState(page.locator("body"), "color-picker--short-window");
    }
  );
});
