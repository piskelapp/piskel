import test from "@playwright/test";
import {
  openEditor,
  getAddFrameButton,
  assertFrameCount,
  assertHiddenFrames,
  downloadPiskelFile,
  duplicateFrame,
  importPiskelFile,
  selectFrame,
  toggleFrameVisibility,
  waitForEditorReady,
} from "../../testutils";

test.describe('Frame visibility toggle', () => {

  test('all frames should be visible by default', { tag: ['@frames.visibility'] }, async ({ page }) => {
    // Add two frames.
    await openEditor(page);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);

    // No frame is hidden.
    await assertHiddenFrames(page, []);
  });

  // The animated preview skipping a hidden frame is checked in test-frame-preview.spec.ts.
  test('clicking toggle should hide a frame from preview', { tag: ['@frames.visibility'] }, async ({ page }) => {
    // Add two frames.
    await openEditor(page);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);

    // Hide the second frame: only that one is hidden.
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);
  });

  test('clicking toggle again should make the frame visible', { tag: ['@frames.visibility'] }, async ({ page }) => {
    // Add a frame.
    await openEditor(page);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);

    // Hide the second frame, then show it again.
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, []);
  });

  // ─── Hidden frames stay in sync ───────────────────────────────

  test('a hidden frame should stay hidden when a frame is inserted before it', { tag: ['@frames.visibility-sync'] }, async ({ page }) => {
    await openEditor(page);

    // Hide the second frame of two.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);

    // Insert a frame after the first one: the hidden frame is now the third.
    await selectFrame(page, 0);
    await page.keyboard.press('n');
    await assertFrameCount(page, 3);
    await assertHiddenFrames(page, [2]);
  });

  test('a hidden frame should stay hidden when a frame before it is duplicated', { tag: ['@frames.visibility-sync'] }, async ({ page }) => {
    await openEditor(page);

    // Hide the second frame of two.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);

    // Duplicate the first frame: the hidden frame is now the third.
    await duplicateFrame(page, 0);
    await assertFrameCount(page, 3);
    await assertHiddenFrames(page, [2]);
  });

  test('a hidden frame should keep its position when a frame is added at the end', { tag: ['@frames.visibility-sync'] }, async ({ page }) => {
    await openEditor(page);

    // Hide the second frame of two.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);

    // Add a frame at the end: the hidden frame doesn't move.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);
    await assertHiddenFrames(page, [1]);
  });

  // ─── Hidden frames in files ───────────────────────────────────

  test('hidden frames should be saved in .piskel files', { tag: ['@frames.visibility-saved'] }, async ({ page }) => {
    await openEditor(page);

    // Hide the second frame of three.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);
    await toggleFrameVisibility(page, 1);
    await assertHiddenFrames(page, [1]);

    // Save the sprite to a file.
    const piskelPath = await downloadPiskelFile(page);

    // Reload to start from a new sprite, with no hidden frame.
    await page.reload();
    await waitForEditorReady(page);
    await assertFrameCount(page, 1);
    await assertHiddenFrames(page, []);

    // Import the file: the second frame is still hidden.
    await importPiskelFile(page, piskelPath);
    await assertFrameCount(page, 3);
    await assertHiddenFrames(page, [1]);
  });
});
