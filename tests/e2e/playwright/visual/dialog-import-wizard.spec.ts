import test, { Page } from "@playwright/test";
import {
  assertCropWarning,
  assertWizardStep,
  browseImageFile,
  browsePiskelFile,
  clickWizardCombine,
  clickWizardNext,
  createPngFile,
  downloadPiskelFile,
  expectVisualState,
  gridFromRows,
  moveMouseAway,
  openEditor,
  readPiskelFile,
  selectImportType,
  selectInsertMode,
  selectResizeOption,
  setPiskelFromGrid,
  testId,
  waitForColorsToBeListed,
} from "../testutils";

const LONG_FILE_NAME = "an-image-with-a-file-name-much-too-long-to-fit-in-the-dialog.png";

const SPRITE_10X10 = [
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

const IMAGE_12X12 = [
  "XXXXXXXXXXXX",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "X..........X",
  "XXXXXXXXXXXX",
];

const IMAGE_5X5 = [
  "XXXXX",
  "X...X",
  "X...X",
  "X...X",
  "XXXXX",
];

const wizard = (page: Page) => testId(page, "dialog");

/** Open the wizard on an image, over a sprite that isn't empty */
const openWizardOverSprite = async (page: Page, imageRows: string[]) => {
  await setPiskelFromGrid(page, gridFromRows(SPRITE_10X10));
  await waitForColorsToBeListed(page);
  await browseImageFile(page, await createPngFile(page, "image.png", imageRows));
};

/** Go from the first step to the step that follows choosing to combine */
const combineWithSprite = async (page: Page) => {
  await clickWizardNext(page);
  await assertWizardStep(page, "select mode");
  await clickWizardCombine(page);
};

test.describe("Import wizard", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test(
    "offers to import directly over an empty sprite, with a long file name",
    { tag: ["@import.single-image", "@import.empty-sprite"] },
    async ({ page }) => {
      await browseImageFile(page, await createPngFile(page, LONG_FILE_NAME, IMAGE_5X5));
      await moveMouseAway(page);

      await expectVisualState(wizard(page), "wizard--image-empty-sprite-long-name");
    }
  );

  test(
    "shows the spritesheet grid and the mode choice",
    { tag: ["@import.spritesheet", "@import.select-mode", "@import.back"] },
    async ({ page }) => {
      await openWizardOverSprite(page, SPRITE_10X10);

      // A sprite exists, so the button says "next". The preview shows a grid.
      await selectImportType(page, "sheet");
      await moveMouseAway(page);
      await expectVisualState(wizard(page), "wizard--image-spritesheet");

      // The next step can go back to the image.
      await clickWizardNext(page);
      await assertWizardStep(page, "select mode");
      await moveMouseAway(page);
      await expectVisualState(wizard(page), "wizard--select-mode-from-image");
    }
  );

  test(
    "starts on the mode choice for a piskel file",
    { tag: ["@import.browse-piskel", "@import.select-mode"] },
    async ({ page }) => {
      await setPiskelFromGrid(page, gridFromRows(SPRITE_10X10));
      await waitForColorsToBeListed(page);
      const piskelPath = await downloadPiskelFile(page);

      await browsePiskelFile(page, await readPiskelFile(piskelPath));
      await assertWizardStep(page, "select mode");
      await moveMouseAway(page);

      await expectVisualState(wizard(page), "wizard--select-mode-from-piskel");
    }
  );

  test(
    "adjusts a bigger image, warning before a crop",
    { tag: ["@import.adjust-size", "@import.adjust-expand", "@import.adjust-keep"] },
    async ({ page }) => {
      await openWizardOverSprite(page, IMAGE_12X12);
      await combineWithSprite(page);
      await assertWizardStep(page, "adjust size");
      await moveMouseAway(page);
      await expectVisualState(wizard(page), "wizard--adjust-bigger-expand");

      // Keeping the size would crop the image.
      await selectResizeOption(page, "keep");
      await assertCropWarning(page);
      await moveMouseAway(page);
      await expectVisualState(wizard(page), "wizard--adjust-bigger-keep-warning");
    }
  );

  test(
    "adjusts a smaller image",
    { tag: ["@import.adjust-smaller"] },
    async ({ page }) => {
      await openWizardOverSprite(page, IMAGE_5X5);
      await combineWithSprite(page);
      await assertWizardStep(page, "adjust size");
      await moveMouseAway(page);

      await expectVisualState(wizard(page), "wizard--adjust-smaller");
    }
  );

  test(
    "asks where to insert the image",
    { tag: ["@import.insert-location", "@import.insert-existing"] },
    async ({ page }) => {
      await openWizardOverSprite(page, SPRITE_10X10);
      await combineWithSprite(page);
      await assertWizardStep(page, "insert location");
      await selectInsertMode(page, "insert");
      await moveMouseAway(page);

      await expectVisualState(wizard(page), "wizard--insert-location");
    }
  );
});
