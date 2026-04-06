import test, { expect, Page } from '../../fixtures';
import {
  openEditor,
  getFrameTiles,
  getAddFrameButton,
  waitFor,
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

  test('all frames should be visible by default', async ({ page }) => {
    await openEditor(page);

    // Add 2 more frames (3 total)
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 3);

    // All frames should be visible in the model
    expect(await isFrameVisible(page, 0)).toBe(true);
    expect(await isFrameVisible(page, 1)).toBe(true);
    expect(await isFrameVisible(page, 2)).toBe(true);
  });

  test('clicking toggle should hide a frame from preview', async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 3);

    // Hide frame 1
    await getFrameToggle(page, 1).click();
    await waitFor(async () => !(await isFrameVisible(page, 1)));

    expect(await isFrameVisible(page, 0)).toBe(true);
    expect(await isFrameVisible(page, 1)).toBe(false);
    expect(await isFrameVisible(page, 2)).toBe(true);
  });

  test('clicking toggle again should make the frame visible', async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);

    // Hide then show frame 1
    await getFrameToggle(page, 1).click();
    await waitFor(async () => !(await isFrameVisible(page, 1)));

    await getFrameToggle(page, 1).click();
    await waitFor(async () => (await isFrameVisible(page, 1)));
  });

  test('hidden frame should be excluded from visible frame indexes', async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 2);
    await getAddFrameButton(page).click();
    await waitFor(async () => (await getFrameTiles(page).count()) === 3);

    // Hide frame 1
    await getFrameToggle(page, 1).click();
    await waitFor(async () => !(await isFrameVisible(page, 1)));

    // Check visible frame indexes via the model
    const visibleIndexes = await page.evaluate(() =>
      window.pskl.app.piskelController.getVisibleFrameIndexes()
    );
    expect(visibleIndexes).toEqual([0, 2]);
  });
});

