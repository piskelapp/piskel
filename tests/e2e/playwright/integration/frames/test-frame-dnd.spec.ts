import test, { expect, Page } from '../../fixtures';
import {
  openEditor,
  setPiskelFromGrid,
  clickTool,
  drawAtPixel,
  setPrimaryColor,
  getPixelColor,
  colorToInt,
  getFrameTiles,
  getAddFrameButton,
  waitFor,
  wait,
} from "../../testutils";

const RED = colorToInt('#FF0000');
const GREEN = colorToInt('#00FF00');
const BLUE = colorToInt('#0000FF');

/** Set up 3 frames: frame 0 = red, frame 1 = green, frame 2 = blue (pixel at 0,0) */
async function setupThreeFrames(page: Page) {
  await setPiskelFromGrid(page, [['R', 'T'], ['T', 'T']]);

  await getAddFrameButton(page).click();
  await waitFor(async () => (await getFrameTiles(page).count()) === 2);
  await setPrimaryColor(page, '#00FF00');
  await clickTool(page, 'tool-pen');
  await drawAtPixel(page, 0, 0);

  await getAddFrameButton(page).click();
  await waitFor(async () => (await getFrameTiles(page).count()) === 3);
  await setPrimaryColor(page, '#0000FF');
  await drawAtPixel(page, 0, 0);
  await wait(300);
}

/** Drag a frame from sourceIndex to targetIndex using the drag handle.
 *  jQuery sortable (tolerance: 'pointer') inserts at the position where
 *  the pointer crosses another item's midpoint. */
async function dragFrame(page: Page, sourceIndex: number, targetIndex: number) {
  const tiles = getFrameTiles(page);
  const handle = tiles.nth(sourceIndex).locator('.dnd-action');

  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();

  // To land at targetIndex, we need to cross the midpoint of the item
  // currently at that position. Get the target tile's bounding box.
  const targetBox = await tiles.nth(targetIndex).boundingBox();
  expect(targetBox).not.toBeNull();

  const targetX = targetBox!.x + targetBox!.width / 2;
  let targetY: number;

  if (sourceIndex < targetIndex) {
    // Moving down: go just past the bottom edge of the target tile
    targetY = targetBox!.y + targetBox!.height + 5;
  } else if (targetIndex === 0) {
    // Moving up to the very start: go above the first tile
    targetY = targetBox!.y - 10;
  } else {
    // Moving up to a middle position: stop at the center of the target tile
    // This crosses the target's midpoint without crossing the previous item
    targetY = targetBox!.y + targetBox!.height / 2;
  }

  await page.mouse.move(targetX, targetY, { steps: 15 });
  await page.mouse.up();
  await wait(500);
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

  test('drag first frame to end', async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    // Initial: red, green, blue
    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 0 (red) to the end
    await dragFrame(page, 0, 2);

    // Expected: green, blue, red
    expect(await getFrameColors(page, 3)).toEqual([GREEN, BLUE, RED]);
  });

  test('drag last frame to start', async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 2 (blue) to the start
    await dragFrame(page, 2, 0);

    // Expected: blue, red, green
    expect(await getFrameColors(page, 3)).toEqual([BLUE, RED, GREEN]);
  });

  test('drag last frame to middle', async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 2 (blue) to position 1 (middle)
    await dragFrame(page, 2, 1);

    // Expected: red, blue, green
    expect(await getFrameColors(page, 3)).toEqual([RED, BLUE, GREEN]);
  });

  test('drag first frame to middle', async ({ page }) => {
    await openEditor(page);
    await setupThreeFrames(page);

    expect(await getFrameColors(page, 3)).toEqual([RED, GREEN, BLUE]);

    // Drag frame 0 (red) to position 1 (middle)
    await dragFrame(page, 0, 1);

    // Expected: green, red, blue
    expect(await getFrameColors(page, 3)).toEqual([GREEN, RED, BLUE]);
  });
});
