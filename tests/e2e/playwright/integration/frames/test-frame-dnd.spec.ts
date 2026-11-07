import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  setPiskelFromGrid,
  clickTool,
  drawAtPixel,
  setPrimaryColor,
  getPixelColor,
  colorToInt,
  dragFrame,
  getAddFrameButton,
  wait,
  assertFrameCount,
} from "../../testutils";

const RED = colorToInt('#FF0000');
const GREEN = colorToInt('#00FF00');
const BLUE = colorToInt('#0000FF');

/** Set up 3 frames: frame 0 = red, frame 1 = green, frame 2 = blue (pixel at 0,0) */
async function setupThreeFrames(page: Page) {
  await setPiskelFromGrid(page, [['R', 'T'], ['T', 'T']]);

  await getAddFrameButton(page).click();
  await assertFrameCount(page, 2);
  await setPrimaryColor(page, '#00FF00');
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 0, 0);

  await getAddFrameButton(page).click();
  await assertFrameCount(page, 3);
  await setPrimaryColor(page, '#0000FF');
  await drawAtPixel(page, 0, 0);
  await wait(300);
}

/** Get the color of pixel (0,0) for each frame as an array */
async function getFrameColors(page: Page, count: number): Promise<number[]> {
  const colors: number[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(await getPixelColor(page, 0, 0, 0, i));
  }
  return colors;
}

test.describe('Frame drag-and-drop reorder', () => {

  test('drag first frame to end', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    // Initial: red, green, blue
    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 0 (red) to the end
    await dragFrame(page, 0, 2);

    // Expected: green, blue, red
    expect(await getFrameColors(page, 3)).toEqual([GREEN, BLUE, RED]);
  });

  test('drag last frame to start', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 2 (blue) to the start
    await dragFrame(page, 2, 0);

    // Expected: blue, red, green
    expect(await getFrameColors(page, 3)).toEqual([BLUE, RED, GREEN]);
  });

  test('drag last frame to middle', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 2 (blue) to position 1 (middle)
    await dragFrame(page, 2, 1);

    // Expected: red, blue, green
    expect(await getFrameColors(page, 3)).toEqual([RED, BLUE, GREEN]);
  });

  test('drag first frame to middle', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 0 (red) to position 1 (middle)
    await dragFrame(page, 0, 1);

    // Expected: green, red, blue
    expect(await getFrameColors(page, 3)).toEqual([GREEN, RED, BLUE]);
  });
});
