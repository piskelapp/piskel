import test, { Page } from "@playwright/test";
import {
  assertColorRows,
  assertFrameCount,
  clickTool,
  dragFrame,
  drawAtPixel,
  getAddFrameButton,
  gridFromRows,
  openEditor,
  setPiskelFromGrid,
  setPrimaryColor,
} from "../../testutils";

/** 10x10 frames with a single red, green or blue pixel at (0,0) */
const RED_FRAME = [
  'R.........',
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
const GREEN_FRAME = [
  'G.........',
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
const BLUE_FRAME = [
  'B.........',
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

/** Create three frames: a red, a green and a blue one */
async function createRedGreenBlueFrames(page: Page) {
  await setPiskelFromGrid(page, gridFromRows(EMPTY));
  await clickTool(page, 'tool-pen');

  await setPrimaryColor(page, '#FF0000');
  await drawAtPixel(page, 0, 0);
  await assertColorRows(page, RED_FRAME, { frameIndex: 0 });

  await getAddFrameButton(page).click();
  await assertFrameCount(page, 2);
  await setPrimaryColor(page, '#00FF00');
  await drawAtPixel(page, 0, 0);
  await assertColorRows(page, GREEN_FRAME, { frameIndex: 1 });

  await getAddFrameButton(page).click();
  await assertFrameCount(page, 3);
  await setPrimaryColor(page, '#0000FF');
  await drawAtPixel(page, 0, 0);
  await assertColorRows(page, BLUE_FRAME, { frameIndex: 2 });
}

test.describe('Frame drag-and-drop reorder', () => {

  test('drag first frame to end', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await createRedGreenBlueFrames(page);

    // Drag the red frame to the end.
    await dragFrame(page, 0, 2);
    await assertColorRows(page, GREEN_FRAME, { frameIndex: 0 });
    await assertColorRows(page, BLUE_FRAME, { frameIndex: 1 });
    await assertColorRows(page, RED_FRAME, { frameIndex: 2 });
  });

  test('drag last frame to start', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await createRedGreenBlueFrames(page);

    // Drag the blue frame to the start.
    await dragFrame(page, 2, 0);
    await assertColorRows(page, BLUE_FRAME, { frameIndex: 0 });
    await assertColorRows(page, RED_FRAME, { frameIndex: 1 });
    await assertColorRows(page, GREEN_FRAME, { frameIndex: 2 });
  });

  test('drag last frame to middle', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await createRedGreenBlueFrames(page);

    // Drag the blue frame to the middle.
    await dragFrame(page, 2, 1);
    await assertColorRows(page, RED_FRAME, { frameIndex: 0 });
    await assertColorRows(page, BLUE_FRAME, { frameIndex: 1 });
    await assertColorRows(page, GREEN_FRAME, { frameIndex: 2 });
  });

  test('drag first frame to middle', { tag: ['@frames.reorder'] }, async ({ page }) => {
    await openEditor(page);
    await createRedGreenBlueFrames(page);

    // Drag the red frame to the middle.
    await dragFrame(page, 0, 1);
    await assertColorRows(page, GREEN_FRAME, { frameIndex: 0 });
    await assertColorRows(page, RED_FRAME, { frameIndex: 1 });
    await assertColorRows(page, BLUE_FRAME, { frameIndex: 2 });
  });
});
