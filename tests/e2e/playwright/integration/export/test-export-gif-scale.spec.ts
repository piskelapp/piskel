import test, { expect } from "@playwright/test";
import {
  downloadGifExport,
  gridFromColorRows,
  openEditor,
  openExportSettingsPanel,
  selectExportTab,
  setPiskelFromGrid,
  testId,
} from "../../testutils";

test('Test export gif with scaling', { tag: ['@export.scale', '@export.gif'] }, async ({ page }) => {
  // A 3x3 sprite with stripes of red, green and blue, small so that the scaled GIF
  // reads at a glance.
  await openEditor(page);
  await setPiskelFromGrid(page, gridFromColorRows([
    'RGB',
    'BRG',
    'GBR',
  ]));

  // Type a width of 6: the height follows, and the scale is 2.
  await openExportSettingsPanel(page);
  await selectExportTab(page, 'gif');
  await testId(page, 'export-width-input').fill("6");
  await expect(testId(page, 'export-width-input')).toHaveValue("6");
  await expect(testId(page, 'export-height-input')).toHaveValue("6");
  await expect(testId(page, 'export-scale-slider')).toHaveValue("2");

  // The GIF has each pixel twice as large.
  const downloadPromise = page.waitForEvent('download');
  const { frames } = await downloadGifExport(page);
  expect((await downloadPromise).suggestedFilename()).toBe("test.gif");
  expect(frames).toEqual([
    [
      'RRGGBB',
      'RRGGBB',
      'BBRRGG',
      'BBRRGG',
      'GGBBRR',
      'GGBBRR',
    ],
  ]);
});
