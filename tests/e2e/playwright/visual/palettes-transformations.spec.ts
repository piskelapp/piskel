import test, { expect } from "@playwright/test";
import {
  createDistinctColors,
  createPaletteWithColors,
  expectVisualState,
  getPaletteSwatch,
  moveMouseAway,
  openEditor,
  testId,
} from "../testutils";

const FOUR_COLORS = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];
const COLOR_COUNT_TO_SCROLL = 90;

test.describe("Palettes panel", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "shows a message for an empty palette",
    { tag: ["@colors-and-palettes.empty-palette"] },
    async ({ page }) => {
      await moveMouseAway(page);

      await expectVisualState(testId(page, "palettes-panel"), "palettes--empty");
    }
  );

  test(
    "marks the primary and secondary colors on large swatches",
    {
      tag: [
        "@colors-and-palettes.swatches",
        "@colors-and-palettes.swatch-highlight",
        "@colors-and-palettes.swatch-right-click",
      ],
    },
    async ({ page }) => {
      await createPaletteWithColors(page, "Four colors", FOUR_COLORS);

      // Left click sets the primary color, right click the secondary one.
      await getPaletteSwatch(page, FOUR_COLORS[0]).click();
      await getPaletteSwatch(page, FOUR_COLORS[2]).click({ button: "right" });
      await moveMouseAway(page);

      await expectVisualState(testId(page, "palettes-panel"), "palettes--large-swatches");
    }
  );

  test(
    "uses tiny swatches and scrolls with many colors",
    { tag: ["@colors-and-palettes.tiny"] },
    async ({ page }) => {
      await createPaletteWithColors(page, "Many colors", createDistinctColors(COLOR_COUNT_TO_SCROLL));
      await moveMouseAway(page);

      await expectVisualState(testId(page, "palettes-panel"), "palettes--tiny-scrolling");
    }
  );
});

test.describe("Transformations panel", () => {
  test(
    "expands to show more tools",
    { tag: ["@transformations.show-more"] },
    async ({ page }) => {
      await openEditor(page);
      const panel = testId(page, "transformations-panel");

      await moveMouseAway(page);
      await expectVisualState(panel, "transformations--collapsed");

      await page.locator(".transformations-show-more-link").click();
      await expect(panel).toHaveClass(/show-more/);
      await moveMouseAway(page);
      await expectVisualState(panel, "transformations--expanded");
    }
  );
});
