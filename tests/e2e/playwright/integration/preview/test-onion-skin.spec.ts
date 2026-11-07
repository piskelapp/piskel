import test, { Page, expect } from "@playwright/test";
import {
  assertColorRows,
  assertFrameCount,
  clickTool,
  drawAtPixel,
  expectHasClass,
  expectHasNotClass,
  getAddFrameButton,
  getOnionSkinPixel,
  gridFromRows,
  openEditor,
  selectFrame,
  setPiskelFromGrid,
  setPrimaryColor,
  testId,
} from "../../testutils";

const ONION_SKIN_SELECTOR = '.preview-toggle-onion-skin';
const ENABLED_CLASS = 'preview-toggle-onion-skin-enabled';

/** 10x10 frames */
const EMPTY = [
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const RED_PIXEL_AT_1_1 = [
  '..........',
  '.R........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

/** A red pixel in the first frame, and an empty second frame, which is current */
const openEditorWithPixelInPreviousFrame = async (page: Page) => {
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await setPrimaryColor(page, '#FF0000');
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 1, 1);
  await assertColorRows(page, RED_PIXEL_AT_1_1, { frameIndex: 0 });
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 2);
};

/** Check whether the onion skin shows the pixel of the previous frame */
const assertOnionSkinShown = async (page: Page, shown: boolean) => {
  if (shown) {
    await expectHasClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);
    await expect.poll(async () => (await getOnionSkinPixel(page, 1, 1)).a).toBeGreaterThan(0);
  } else {
    await expectHasNotClass(page, ONION_SKIN_SELECTOR, ENABLED_CLASS);
    await expect.poll(async () => (await getOnionSkinPixel(page, 1, 1)).a).toBe(0);
  }
};

test.describe('Onion skin', () => {

  test('should be disabled by default', { tag: ['@preview.onion-skin-toggle'] }, async ({ page }) => {
    await openEditorWithPixelInPreviousFrame(page);
    await assertOnionSkinShown(page, false);
  });

  test('should toggle on when clicking the onion skin button', { tag: ['@preview.onion-skin-toggle'] }, async ({ page }) => {
    await openEditorWithPixelInPreviousFrame(page);

    await testId(page, 'onion-skin-toggle-button').click();
    await assertOnionSkinShown(page, true);
  });

  test('should toggle off when clicking again', { tag: ['@preview.onion-skin-toggle', '@preview.onion-skin'] }, async ({ page }) => {
    await openEditorWithPixelInPreviousFrame(page);
    await testId(page, 'onion-skin-toggle-button').click();
    await assertOnionSkinShown(page, true);

    // Click again: the onion skin goes away.
    await testId(page, 'onion-skin-toggle-button').click();
    await assertOnionSkinShown(page, false);
  });

  test('should toggle onion skin with Alt+O shortcut', { tag: ['@preview.onion-skin-toggle'] }, async ({ page }) => {
    await openEditorWithPixelInPreviousFrame(page);

    await page.keyboard.press('Alt+o');
    await assertOnionSkinShown(page, true);
    await page.keyboard.press('Alt+o');
    await assertOnionSkinShown(page, false);
  });

  test('onion skin canvas should render previous and next frame content', { tag: ['@preview.onion-skin'] }, async ({ page }) => {
    // A red pixel in the first frame, and an empty second frame.
    await openEditorWithPixelInPreviousFrame(page);

    // Add a third frame, with a green pixel.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 5, 5);

    // Go to the middle frame, and turn the onion skin on.
    await selectFrame(page, 1);
    await testId(page, 'onion-skin-toggle-button').click();
    await assertOnionSkinShown(page, true);

    // It shows the red pixel of the previous frame and the green one of the next frame.
    const previousPixel = await getOnionSkinPixel(page, 1, 1);
    expect([previousPixel.r, previousPixel.g, previousPixel.b]).toEqual([255, 0, 0]);
    await expect.poll(async () => (await getOnionSkinPixel(page, 5, 5)).a).toBeGreaterThan(0);
    const nextPixel = await getOnionSkinPixel(page, 5, 5);
    expect([nextPixel.r, nextPixel.g, nextPixel.b]).toEqual([0, 255, 0]);

    // Nothing shows where neither frame has a pixel.
    expect((await getOnionSkinPixel(page, 8, 8)).a).toBe(0);
  });
});
