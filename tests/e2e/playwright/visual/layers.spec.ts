import test from "@playwright/test";
import {
  expectVisualState,
  getAddLayerButton,
  getLayerItems,
  moveMouseAway,
  openEditor,
  renameCurrentLayer,
  setTopLayerOpacity,
  testId,
  toggleLayerPreview,
} from "../testutils";

const LONG_LAYER_NAME = "A layer name much too long to fit in the layers list";
const LAYER_COUNT_TO_SCROLL = 12;

test.describe("Layers panel", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "disables the buttons that don't apply to a single layer",
    { tag: ["@layers.at-least-one", "@layers.move-disabled", "@layers.delete-disabled"] },
    async ({ page }) => {
      await moveMouseAway(page);
      await expectVisualState(testId(page, "layer-list"), "layers--single-layer");
    }
  );

  test(
    "shows all the looks of a layer item at once",
    {
      tag: [
        "@layers.select",
        "@layers.long-names",
        "@layers.opacity-indicator",
        "@layers.preview",
      ],
    },
    async ({ page }) => {
      // The α button of a fully transparent layer is gray. Only the top layer
      // can be set up, so each layer is prepared before adding the next above.
      await setTopLayerOpacity(page, 0);

      // The α button of a partially transparent layer is white.
      await getAddLayerButton(page).click();
      await setTopLayerOpacity(page, 0.5);

      // A long name is truncated.
      await getAddLayerButton(page).click();
      await renameCurrentLayer(page, LONG_LAYER_NAME);

      // Two more layers: the top one for the hover, the next one to be current.
      await getAddLayerButton(page).click();
      await getAddLayerButton(page).click();

      // A current layer in the middle of the list enables every button.
      await getLayerItems(page).nth(1).click();

      // The eye icon shows that layer preview is off.
      await toggleLayerPreview(page);

      // Hover the top layer, which isn't the current one.
      await moveMouseAway(page);
      await getLayerItems(page).nth(0).hover();

      await expectVisualState(testId(page, "layer-list"), "layers--items-packed");
    }
  );

  test(
    "shows the inline input when renaming",
    { tag: ["@layers.rename"] },
    async ({ page }) => {
      await testId(page, "layer-edit-button").click();
      await moveMouseAway(page);

      await expectVisualState(testId(page, "layer-list"), "layers--renaming");
    }
  );

  test(
    "scrolls when there are too many layers",
    { tag: ["@layers.long-names"] },
    async ({ page }) => {
      for (let added = 1; added < LAYER_COUNT_TO_SCROLL; added++) {
        await getAddLayerButton(page).click();
      }

      await moveMouseAway(page);
      await expectVisualState(testId(page, "layer-list"), "layers--scrolling");
    }
  );
});
