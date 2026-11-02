import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  getAddFrameButton,
  waitFor,
  assertFrameCount,
  assertHiddenFrames,
  downloadPiskelFile,
  getFrameTiles,
  importPiskelFile,
  selectFrame,
  testId,
  toggleFrameVisibility,
  waitForEditorReady,
} from "../../testutils";

/** Get the toggle button for a frame at the given index */
function getFrameToggle(page: Page, index: number) {
  return page.locator(`.toggle-frame-action[data-tile-number="${index}"]`);
}

/** Check if a frame is visible (toggled class = visible in preview) */
async function isFrameVisible(page: Page, index: number): Promise<boolean> {
  // Wait for one animation frame so the render loop updates the DOM
  await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
  const toggle = getFrameToggle(page, index);
  const cls = await toggle.getAttribute('class') ?? '';
  return cls.includes('toggled');
}

test.describe('Frame visibility toggle', () => {

  test('all frames should be visible by default', { tag: ['@frames.visibility'] }, async ({ page }) => {
    await openEditor(page);

    // Add 2 more frames (3 total)
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);

    // All frames should be visible in the model
    expect(await isFrameVisible(page, 0)).toBe(true);
    expect(await isFrameVisible(page, 1)).toBe(true);
    expect(await isFrameVisible(page, 2)).toBe(true);
  });

  test('clicking toggle should hide a frame from preview', { tag: ['@frames.visibility'] }, async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 3);

    // Hide frame 1
    await getFrameToggle(page, 1).click();
    await waitFor(async () => !(await isFrameVisible(page, 1)));

    expect(await isFrameVisible(page, 0)).toBe(true);
    expect(await isFrameVisible(page, 1)).toBe(false);
    expect(await isFrameVisible(page, 2)).toBe(true);
  });

  test('clicking toggle again should make the frame visible', { tag: ['@frames.visibility'] }, async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);

    // Hide then show frame 1
    await getFrameToggle(page, 1).click();
    await waitFor(async () => !(await isFrameVisible(page, 1)));

    await getFrameToggle(page, 1).click();
    await waitFor(async () => (await isFrameVisible(page, 1)));
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
    await getFrameTiles(page).nth(0).hover();
    await testId(page, 'duplicate-frame-button').nth(0).click();
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
