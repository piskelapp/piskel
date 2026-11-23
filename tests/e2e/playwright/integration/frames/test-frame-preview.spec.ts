import test from "@playwright/test";
import {
  assertFrameCount,
  assertHiddenFrames,
  assertPreviewPlays,
  createThreeFrames,
  deleteFrame,
  openEditorWithFakeClock,
  PIXEL_IN_FIRST_COLUMN,
  PIXEL_IN_SECOND_COLUMN,
  PIXEL_IN_THIRD_COLUMN,
  toggleFrameVisibility,
} from "../../testutils";

test.describe('Frames in the animated preview', () => {

  test('the preview should skip a hidden frame until it is shown again', { tag: ['@frames.visibility'] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    await createThreeFrames(page);

    // All the frames are played by default.
    await assertPreviewPlays(page, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, PIXEL_IN_THIRD_COLUMN]);

    // Hide the second frame: the preview skips it.
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);
    await assertPreviewPlays(page, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_THIRD_COLUMN]);

    // Show it again: the preview plays it again.
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, []);
    await assertPreviewPlays(page, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_SECOND_COLUMN, PIXEL_IN_THIRD_COLUMN]);
  });

  test('the preview should not play a deleted frame', { tag: ['@frames.delete'] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    await createThreeFrames(page);

    // Delete the second frame: the preview plays the two others.
    await deleteFrame(page, 1);
    await assertFrameCount(page, 2);
    await assertPreviewPlays(page, [PIXEL_IN_FIRST_COLUMN, PIXEL_IN_THIRD_COLUMN]);
  });
});
