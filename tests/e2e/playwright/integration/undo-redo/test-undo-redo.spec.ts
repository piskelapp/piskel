import test, { expect } from "@playwright/test";
import fs from "fs/promises";
import nodePath from "path";
import {
  clickTool,
  colorToInt,
  drawAtPixel,
  expectResizeValues,
  getAddFrameButton,
  getAddLayerButton,
  getCurrentPiskelHeight,
  getCurrentPiskelWidth,
  getPixelColor,
  getPrimaryColor,
  getSelectedToolId,
  gridFromRows,
  isCurrentPiskelEmpty,
  isSettingsDrawerExpanded,
  openEditor,
  openImportSettingsPanel,
  openResizeSettingsPanel,
  openSaveSettingsPanel,
  readPixelRows,
  redo,
  setPiskelFromGrid,
  setPrimaryColor,
  testId,
  TRANSPARENT,
  undo,
  wait,
  waitFor,
  waitForEditorReady,
  waitForGrid,
  assertFrameCount,
  assertCurrentFrame,
  assertCurrentLayer,
  selectFrame,
  selectBottomLayer,
  setUndoHistoryLimit,
} from "../../testutils";

const EMPTY = [
  '....',
  '....',
  '....',
  '....',
];

const ONE_PIXEL = [
  'X...',
  '....',
  '....',
  '....',
];

const L_SHAPE = [
  'X...',
  'X...',
  'XXX.',
  '....',
];

test.describe('Undo and Redo', () => {

  test('should undo a pixel change', { tag: ['@undo-redo.shortcuts', '@undo-redo.recorded'] }, async ({ page }) => {
    await openEditor(page);

    // Verify pixel is initially transparent
    expect(await getPixelColor(page, 2, 2)).toBe(TRANSPARENT);

    // Draw a red pixel via real mouse click
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 2, 2);

    // Verify pixel is now red
    expect(await getPixelColor(page, 2, 2)).toBe(colorToInt('#FF0000'));

    // Undo and wait for pixel to become transparent
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 2, 2)) === TRANSPARENT);
  });

  test('should redo after undo', { tag: ['@undo-redo.shortcuts'] }, async ({ page }) => {
    await openEditor(page);

    // Draw a pixel
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 3, 3);
    expect(await getPixelColor(page, 3, 3)).toBe(colorToInt('#00FF00'));

    // Undo
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 3, 3)) === TRANSPARENT);

    // Redo — small gap needed for HistoryService LOAD_STATE_INTERVAL throttle (50ms)
    await wait(100);
    await redo(page);
    await waitFor(async () => (await getPixelColor(page, 3, 3)) === colorToInt('#00FF00'));
  });

  test('should undo multiple steps', { tag: ['@undo-redo.shortcuts'] }, async ({ page }) => {
    await openEditor(page);
    await clickTool(page, 'tool-pen');

    // Step 1: draw red pixel at (0,0)
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);
    await waitFor(async () => (await getPixelColor(page, 0, 0)) === colorToInt('#FF0000'));

    // Step 2: draw green pixel at (1,1)
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);
    await waitFor(async () => (await getPixelColor(page, 1, 1)) === colorToInt('#00FF00'));

    // Undo step 2
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 1, 1)) === TRANSPARENT);
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#FF0000')); // red still there

    // Undo step 1 — gap for HistoryService LOAD_STATE_INTERVAL throttle
    await wait(100);
    await undo(page);
    await waitFor(async () => (await getPixelColor(page, 0, 0)) === TRANSPARENT);
  });

  // ─── Redo history ─────────────────────────────────────────────

  test('a new change should discard the redo history', { tag: ['@undo-redo.discard-redo'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Draw a first pixel.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      'X...',
      '....',
      '....',
      '....',
    ]);

    // Undo it.
    await undo(page);
    await waitForGrid(page, 4, 4, EMPTY);

    // Draw another pixel, which discards the redo history.
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      '....',
      '.X..',
      '....',
      '....',
    ]);

    // Redo: there is nothing left to redo, so the first pixel doesn't come back.
    await wait(100);
    await redo(page);
    await wait(200);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      '....',
      '.X..',
      '....',
      '....',
    ]);
  });

  // ─── Position ─────────────────────────────────────────────────

  test('undo and redo should restore the frame of the change', { tag: ['@undo-redo.restore-position'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Create a second frame.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    
    // Go to second frame.
    await selectFrame(page, 1);

    // Draw in second frame.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual(ONE_PIXEL);

    // Go back to first frame and undo.
    await selectFrame(page, 0);
    await undo(page);
    await waitForGrid(page, 4, 4, EMPTY, { frameIndex: 1 });

    // Undoing is happening in the second frame, so it gets selected
    await assertCurrentFrame(page, 1);

    // Go back to first frame and redo.
    await selectFrame(page, 0);
    await wait(100);
    await redo(page);

    // Redo in the second frame, active frame is changed to the second frame.
    await waitForGrid(page, 4, 4, ONE_PIXEL, { frameIndex: 1 });
    await assertCurrentFrame(page, 1);
  });

  test('undo and redo should restore the layer of the change', { tag: ['@undo-redo.restore-position'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Create a second layer, which becomes the current one.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    // Draw in second layer.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 1, 0)).toEqual(ONE_PIXEL);

    // Go back to first layer and undo.
    await selectBottomLayer(page);
    await undo(page);
    await waitForGrid(page, 4, 4, EMPTY, { layerIndex: 1 });

    // Undoing is happening in the second layer, so it gets selected.
    await assertCurrentLayer(page, 1);

    // Go back to first layer and redo.
    await selectBottomLayer(page);
    await wait(100);
    await redo(page);

    // Redo in the second layer, active layer is changed to the second layer.
    await waitForGrid(page, 4, 4, ONE_PIXEL, { layerIndex: 1 });
    await assertCurrentLayer(page, 1);
  });

  // ─── Not recorded ─────────────────────────────────────────────

  test('selections, view changes and preferences should not be recorded', { tag: ['@undo-redo.not-recorded'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Create a second frame and go to it.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 1);

    // Create a second layer, which becomes the current one.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);

    // Draw in the second frame of the second layer.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 1, 1)).toEqual(ONE_PIXEL);

    // Select another frame, layer, color and tool.
    await selectFrame(page, 0);
    await selectBottomLayer(page);
    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-eraser');

    // Zoom and pan.
    await page.keyboard.press('+');
    await wait(300);
    const zoom = await page.locator('.cursor-coordinates .drawing-zoom').innerText();
    const box = await page.locator('#drawing-canvas-container').boundingBox();
    if (!box) throw new Error('Canvas not found');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(box.x + box.width / 2 - 50, box.y + box.height / 2 - 50, { steps: 5 });
    await page.mouse.up({ button: 'middle' });

    // Turn on onion skin in the preview.
    const onionSkin = page.locator('.preview-toggle-onion-skin');
    await onionSkin.click();
    await expect(onionSkin).toHaveClass(/preview-toggle-onion-skin-enabled/);

    // Turn on the grid in the preferences.
    await page.click('[data-setting="user"]');
    await page.locator('[data-tab-id="grid"]').click();
    await page.locator('.enable-grid-checkbox').check();
    await page.click('[data-setting="user"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    // Undo: a single undo goes past all of these and removes the pixel.
    await undo(page);
    await waitForGrid(page, 4, 4, EMPTY, { layerIndex: 1, frameIndex: 1 });

    // The undo leaves all of these unchanged.
    expect(await getPrimaryColor(page)).toBe('#00ff00');
    expect(await getSelectedToolId(page)).toBe('tool-eraser');
    await expect(page.locator('.cursor-coordinates .drawing-zoom')).toHaveText(zoom);
    await expect(onionSkin).toHaveClass(/preview-toggle-onion-skin-enabled/);
    await page.click('[data-setting="user"]');
    await page.locator('[data-tab-id="grid"]').click();
    await expect(page.locator('.enable-grid-checkbox')).toBeChecked();
  });

  // ─── Throttle ─────────────────────────────────────────────────

  test('undo presses in quick succession should only undo one step', { tag: ['@undo-redo.throttle'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Draw three pixels, one step each.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      'X...',
      '.X..',
      '....',
      '....',
    ]);
    await drawAtPixel(page, 2, 2);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      'X...',
      '.X..',
      '..X.',
      '....',
    ]);

    // Repeat undo for 40ms, like a key held down. The presses are sent from the
    // page, so that they all land within the 50ms throttle whatever the test speed.
    await page.evaluate(async () => {
      const start = Date.now();
      while (Date.now() - start < 40) {
        document.body.dispatchEvent(new KeyboardEvent('keydown', {
          keyCode: 90,
          which: 90,
          ctrlKey: true,
          metaKey: true,
          bubbles: true,
        } as KeyboardEventInit));
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    });

    // Only the last pixel is removed.
    await wait(200);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      'X...',
      '.X..',
      '....',
      '....',
    ]);

    // Once the throttle is over, undo works again.
    await undo(page);
    await waitForGrid(page, 4, 4, [
      'X...',
      '....',
      '....',
      '....',
    ]);
  });

  // ─── Page load ────────────────────────────────────────────────

  test('history should start fresh after a page load', { tag: ['@undo-redo.memory-only'] }, async ({ page }) => {
    await openEditor(page);
    // Draw two pixels.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 4, 4)).toEqual([
      'X...',
      '.X..',
      '....',
      '....',
    ]);

    // Reload the page: the sprite is empty again.
    await page.reload();
    await waitForEditorReady(page);
    expect(await isCurrentPiskelEmpty(page)).toBe(true);

    // Undo: with a history kept across loads, this would bring back the first pixel.
    await undo(page);
    await wait(200);
    expect(await isCurrentPiskelEmpty(page)).toBe(true);

    // Redo: there is nothing to redo either.
    await redo(page);
    await wait(200);
    expect(await isCurrentPiskelEmpty(page)).toBe(true);
  });

  // ─── Loading and resizing ─────────────────────────────────────

  test('resizing should be a single undo step', { tag: ['@undo-redo.load-step'] }, async ({ page }) => {
    await openEditor(page);
    // Start from a 4x4 sprite.
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Resize it to 6x6.
    await openResizeSettingsPanel(page);
    await page.locator('[name="resize-width"]').fill('6');
    await expectResizeValues(page, '6', '6');
    await page.click('.resize-button');
    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 6);
    expect(await readPixelRows(page, 6, 6)).toEqual([
      'X.....',
      'X.....',
      'XXX...',
      '......',
      '......',
      '......',
    ]);

    // A single undo restores the size and the pixels.
    await undo(page);
    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 4);
    expect(await getCurrentPiskelHeight(page)).toBe(4);
    await waitForGrid(page, 4, 4, L_SHAPE);
  });

  test('importing a .piskel file should be a single undo step', { tag: ['@undo-redo.load-step'] }, async ({ page }) => {
    await openEditor(page);

    // Save a 2x2 sprite to a file.
    await setPiskelFromGrid(page, gridFromRows([
      'X.',
      '.X',
    ]));
    await openSaveSettingsPanel(page);
    const downloadPromise = page.waitForEvent('download');
    await testId(page, 'save-file-download-button').click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    const piskelPath = nodePath.join(nodePath.dirname(downloadPath), 'undo.piskel');
    await fs.copyFile(downloadPath, piskelPath);
    await waitFor(async () => !(await isSettingsDrawerExpanded(page)));

    // Replace a 4x4 sprite with the file.
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));
    await openImportSettingsPanel(page);
    const fileChooserPromise = page.waitForEvent('filechooser');
    await testId(page, 'import-piskel-button').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(piskelPath);
    await page.waitForSelector('.current-step .import-mode', { state: 'attached' });
    page.once('dialog', dialog => dialog.accept());
    await page.click('.import-mode-replace-button');
    await page.waitForSelector('#dialog-container-wrapper:not(.show)', { state: 'attached' });

    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 2);
    expect(await readPixelRows(page, 2, 2)).toEqual([
      'X.',
      '.X',
    ]);

    // A single undo brings back the 4x4 sprite.
    await undo(page);
    await waitFor(async () => (await getCurrentPiskelWidth(page)) === 4);
    expect(await getCurrentPiskelHeight(page)).toBe(4);
    await waitForGrid(page, 4, 4, L_SHAPE);
  });

  test('restoring a backup should be a single undo step', { tag: ['@undo-redo.load-step'] }, async ({ page }) => {
    await openEditor(page);

    // Back up a sprite with a pixel at (0,0). Backups otherwise only run on a timer.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4)).toEqual(ONE_PIXEL);
    await page.evaluate(() => window.pskl.app.backupService.backup());

    // In a new session, draw a pixel at (1,1).
    await page.reload();
    await waitForEditorReady(page);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    const drawnInNewSession = [
      '....',
      '.X..',
      '....',
      '....',
    ];
    expect(await readPixelRows(page, 4, 4)).toEqual(drawnInNewSession);

    // Restore the backup.
    await openImportSettingsPanel(page);
    await testId(page, 'browse-backups-button').click();
    await page.locator('.session-item [data-action="view"]').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="load"]').click();
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached();
    await waitForGrid(page, 4, 4, ONE_PIXEL);

    // A single undo brings back the drawing of the new session.
    await undo(page);
    await waitForGrid(page, 4, 4, drawnInNewSession);
  });

  // ─── Cap ──────────────────────────────────────────────────────

  test('the oldest states should be dropped when the history is full', { tag: ['@undo-redo.cap'] }, async ({ page }) => {
    await openEditor(page);
    await clickTool(page, 'tool-pen');

    // Rows of the 32x32 sprite after coloring its first pixels, from left to right.
    const firstPixels = (count: number) => [
      'X'.repeat(count) + '.'.repeat(32 - count),
      '.'.repeat(32),
    ];

    // Use a history of 20 states (instead of 500 by default, to make the test faster),
    // with a snapshot every 5 states (instead of 50, as states are dropped up to a snapshot).
    await setUndoHistoryLimit(page, 20, 5);

    // Fill the history: the 21st draw drops the 5 oldest states.
    for (let draws = 1; draws <= 21; draws++) {
      await drawAtPixel(page, draws - 1, 0);
      expect(await readPixelRows(page, 32, 2)).toEqual(firstPixels(draws));
    }

    // Undo every draw that is still in the history, newest first.
    // TODO: use a single undo per draw once the system clock issue is fixed. Undo is
    // ignored while the clock is behind the previous undo (see docs/known-issues.md).
    for (let draws = 20; draws >= 5; draws--) {
      await expect(async () => {
        await undo(page);
        await wait(100);
        expect(await readPixelRows(page, 32, 2)).toEqual(firstPixels(draws));
      }).toPass({ timeout: 10_000 });
    }

    // The 5 oldest draws are out of the history, so undo can't remove them.
    await undo(page);
    await wait(200);
    expect(await readPixelRows(page, 32, 2)).toEqual(firstPixels(5));
  });
});
