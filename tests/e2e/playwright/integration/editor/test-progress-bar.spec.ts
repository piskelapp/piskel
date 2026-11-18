import test, { Page } from "@playwright/test";
import {
  assertNoProgressBar,
  assertProgressBar,
  createPngFileFromColors,
  createThreeFrames,
  getExportDownloadButton,
  holdBackgroundWork,
  importFileInPaletteDialog,
  letTimePass,
  openCreatePaletteDialog,
  openEditorWithFakeClock,
  openExportSettingsPanel,
  pauseClock,
  releaseBackgroundWorkStep,
  runClock,
  selectExportTab,
  waitForHeldBackgroundWork,
} from "../../testutils";

/** Open the GIF export of a sprite with three frames, with the clock stopped */
const openGifExportWithPausedClock = async (page: Page) => {
  await openEditorWithFakeClock(page);
  await createThreeFrames(page);
  await openExportSettingsPanel(page);
  await selectExportTab(page, 'gif');

  // Let the app finish what the drawing started, such as listing the colors.
  await letTimePass(page, 2000);
  await pauseClock(page);
};

test.describe('Progress bar', () => {

  test('a long task should show the bar after 300 ms, with its percentage', { tag: ['@editor.progress-bar'] }, async ({ page }) => {
    // Start a GIF export that can't finish until the test allows it.
    await openGifExportWithPausedClock(page);
    await holdBackgroundWork(page);
    const download = page.waitForEvent('download');
    await getExportDownloadButton(page, 'gif').click();

    // No bar for the first 300 ms.
    await runClock(page, 299);
    await assertNoProgressBar(page);

    // Then the bar shows, at 0%.
    await runClock(page, 2);
    await assertProgressBar(page, 'Building animated GIF ...', '0%');

    // Each frame that finishes moves it forward.
    await releaseBackgroundWorkStep(page);
    await assertProgressBar(page, 'Building animated GIF ...', '33.3%');
    await releaseBackgroundWorkStep(page);
    await assertProgressBar(page, 'Building animated GIF ...', '66.7%');

    // After the last frame, it goes away and the file downloads.
    await releaseBackgroundWorkStep(page);
    await assertNoProgressBar(page);
    await runClock(page, 1000);
    await download;
  });

  test('a quick task should not show the bar', { tag: ['@editor.progress-bar'] }, async ({ page }) => {
    // Run a whole GIF export while no time passes for the app.
    await openGifExportWithPausedClock(page);
    const download = page.waitForEvent('download');
    await getExportDownloadButton(page, 'gif').click();
    await download;

    // Once time passes, no bar shows for this finished task.
    await runClock(page, 1000);
    await assertNoProgressBar(page);
  });

  test('reading the colors of an image should show the bar', { tag: ['@editor.progress-bar'] }, async ({ page }) => {
    // Start reading an image as a palette, that can't finish until the test allows it.
    await openEditorWithFakeClock(page);
    await openCreatePaletteDialog(page);
    await letTimePass(page, 2000);
    await pauseClock(page);
    await holdBackgroundWork(page);
    await importFileInPaletteDialog(page, await createPngFileFromColors(page, 'hero.png', ['#ff0000', '#00ff00']));
    await waitForHeldBackgroundWork(page);

    // The bar shows after 300 ms.
    await runClock(page, 299);
    await assertNoProgressBar(page);
    await runClock(page, 2);
    await assertProgressBar(page, 'Processing image colors ...', '0%');

    // Once the image is read, it goes away.
    await releaseBackgroundWorkStep(page);
    await assertNoProgressBar(page);
  });
});
