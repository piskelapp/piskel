import test, { expect } from "@playwright/test";
import {
  assertColorRows,
  assertCurrentFrame,
  assertCurrentLayer,
  assertFrameCount,
  assertSpriteSize,
  clickTool,
  countDrawnPixels,
  downloadPiskelFile,
  drawAtPixel,
  enableVisibleGrid,
  getAddFrameButton,
  getAddLayerButton,
  getPrimaryColor,
  getSelectedToolId,
  gridFromRows,
  importPiskelFile,
  isCurrentPiskelEmpty,
  isSettingsDrawerExpanded,
  openEditor,
  openImportSettingsPanel,
  readPixelRows,
  redo,
  resizeSprite,
  restoreSnapshot,
  selectBottomLayer,
  selectFrame,
  setPiskelFromGrid,
  setPrimaryColor,
  setUndoHistoryLimit,
  testId,
  undo,
  viewBackupSession,
  wait,
  waitForEditorReady,
  waitForGrid,
} from "../../testutils";

/** 10x10 frames */
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
const PIXEL_AT_0_0 = [
  'X.........',
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
const PIXEL_AT_1_1 = [
  '..........',
  '.X........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const PIXELS_AT_0_0_AND_1_1 = [
  'X.........',
  '.X........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];
const L_SHAPE = [
  '..........',
  '..........',
  '...X......',
  '...X......',
  '...X......',
  '...X......',
  '...XXXXX..',
  '..........',
  '..........',
  '..........',
];

test.describe('Undo and Redo', () => {

  test('should undo a pixel change', { tag: ['@undo-redo.shortcuts', '@undo-redo.recorded'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Draw a red pixel.
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 2, 2);
    await assertColorRows(page, [
      '..........',
      '..........',
      '..R.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Undo removes it.
    await undo(page);
    await assertColorRows(page, EMPTY);
  });

  test('should redo after undo', { tag: ['@undo-redo.shortcuts'] }, async ({ page }) => {
    const greenPixel = [
      '..........',
      '..........',
      '..........',
      '...G......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ];

    // Draw a green pixel on an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 3, 3);
    await assertColorRows(page, greenPixel);

    // Undo removes it.
    await undo(page);
    await assertColorRows(page, EMPTY);

    // Redo brings it back.
    // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
    await wait(100);
    await redo(page);
    await assertColorRows(page, greenPixel);
  });

  test('should undo multiple steps', { tag: ['@undo-redo.shortcuts'] }, async ({ page }) => {
    const redPixel = [
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

    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');

    // Step 1: draw a red pixel.
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);
    await assertColorRows(page, redPixel);

    // Step 2: draw a green pixel.
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);
    await assertColorRows(page, [
      'R.........',
      '.G........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Undo step 2: the red pixel is still there.
    await undo(page);
    await assertColorRows(page, redPixel);

    // Undo step 1.
    // Undo and redo are ignored within 50ms of the previous one (undo-redo.throttle)
    await wait(100);
    await undo(page);
    await assertColorRows(page, EMPTY);
  });

  // ─── Redo history ─────────────────────────────────────────────

  test('a new change should discard the redo history', { tag: ['@undo-redo.discard-redo'] }, async ({ page }) => {
    // Start from an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));

    // Draw a first pixel.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_0_0);

    // Undo it.
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY);

    // Draw another pixel, which discards the redo history.
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_1_1);

    // Redo: there is nothing left to redo, so the first pixel doesn't come back.
    await wait(100);
    await redo(page);
    await wait(200);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_1_1);
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
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(PIXEL_AT_0_0);

    // Go back to first frame and undo.
    await selectFrame(page, 0);
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY, { frameIndex: 1 });

    // Undoing is happening in the second frame, so it gets selected
    await assertCurrentFrame(page, 1);

    // Go back to first frame and redo.
    await selectFrame(page, 0);
    await wait(100);
    await redo(page);

    // Redo in the second frame, active frame is changed to the second frame.
    await waitForGrid(page, 10, 10, PIXEL_AT_0_0, { frameIndex: 1 });
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
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual(PIXEL_AT_0_0);

    // Go back to first layer and undo.
    await selectBottomLayer(page);
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY, { layerIndex: 1 });

    // Undoing is happening in the second layer, so it gets selected.
    await assertCurrentLayer(page, 1);

    // Go back to first layer and redo.
    await selectBottomLayer(page);
    await wait(100);
    await redo(page);

    // Redo in the second layer, active layer is changed to the second layer.
    await waitForGrid(page, 10, 10, PIXEL_AT_0_0, { layerIndex: 1 });
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
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual(PIXEL_AT_0_0);

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
    await enableVisibleGrid(page);
    await page.click('[data-setting="user"]');
    expect(await isSettingsDrawerExpanded(page)).toBe(false);

    // Undo: a single undo goes past all of these and removes the pixel.
    await undo(page);
    await waitForGrid(page, 10, 10, EMPTY, { layerIndex: 1, frameIndex: 1 });

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
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_0_0);
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXELS_AT_0_0_AND_1_1);
    await drawAtPixel(page, 2, 2);
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'X.........',
      '.X........',
      '..X.......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
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
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXELS_AT_0_0_AND_1_1);

    // Once the throttle is over, undo works again.
    await undo(page);
    await waitForGrid(page, 10, 10, PIXEL_AT_0_0);
  });

  // ─── Page load ────────────────────────────────────────────────

  test('history should start fresh after a page load', { tag: ['@undo-redo.memory-only'] }, async ({ page }) => {
    // Draw two pixels on an empty sprite.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_0_0);
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXELS_AT_0_0_AND_1_1);

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
    // Start from an L shape.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // Shrink the sprite to 5x5, which cuts the L shape.
    await resizeSprite(page, 5, 5);
    await waitForGrid(page, 5, 5, [
      '.....',
      '.....',
      '...X.',
      '...X.',
      '...X.',
    ]);

    // A single undo restores the size and the pixels that were cut.
    await undo(page);
    await assertSpriteSize(page, 10, 10);
    await waitForGrid(page, 10, 10, L_SHAPE);
  });

  test('importing a .piskel file should be a single undo step', { tag: ['@undo-redo.load-step'] }, async ({ page }) => {
    await openEditor(page);

    // Save a 2x2 sprite to a file. It's smaller than the sprite it replaces, so the
    // undo is seen to restore the size too.
    await setPiskelFromGrid(page, gridFromRows([
      'X.',
      '.X',
    ]));
    const piskelPath = await downloadPiskelFile(page);

    // Replace an L shape with the file.
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));
    await importPiskelFile(page, piskelPath);
    await assertSpriteSize(page, 2, 2);
    await waitForGrid(page, 2, 2, [
      'X.',
      '.X',
    ]);

    // A single undo brings back the L shape.
    await undo(page);
    await assertSpriteSize(page, 10, 10);
    await waitForGrid(page, 10, 10, L_SHAPE);
  });

  test('restoring a backup should be a single undo step', { tag: ['@undo-redo.load-step'] }, async ({ page }) => {
    // Draw a pixel at (0,0) and back it up. Backups otherwise only run every minute,
    // and the one made when the page closes can be cut short by the reload.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_0_0);
    await page.evaluate(() => window.pskl.app.backupService.backup());

    // In a new session, draw a pixel at (1,1) on an empty sprite.
    await page.reload();
    await waitForEditorReady(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10)).toEqual(PIXEL_AT_1_1);

    // Restore the backup of the first session.
    await openImportSettingsPanel(page);
    await testId(page, 'browse-backups-button').click();
    await viewBackupSession(page, 0, 1);
    await restoreSnapshot(page, 0);
    await waitForGrid(page, 10, 10, PIXEL_AT_0_0);

    // A single undo brings back the drawing of the new session.
    await undo(page);
    await waitForGrid(page, 10, 10, PIXEL_AT_1_1);
  });

  // ─── Cap ──────────────────────────────────────────────────────

  test('the oldest states should be dropped when the history is full', { tag: ['@undo-redo.cap'] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await clickTool(page, 'tool-pen');

    // Use a history of 20 states (instead of 500 by default, to make the test faster),
    // with a snapshot every 5 states (instead of 50, as states are dropped up to a snapshot).
    await setUndoHistoryLimit(page, 20, 5);

    // Fill the history with 21 draws, one pixel each, row by row. Loading the sprite
    // was the first state, so the 4th draw is the first snapshot after it. The 21st
    // draw drops the states before that snapshot: the loading and the first 3 draws.
    for (let draws = 1; draws <= 21; draws++) {
      await drawAtPixel(page, (draws - 1) % 10, Math.floor((draws - 1) / 10));
      expect(await countDrawnPixels(page)).toBe(draws);
    }
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'XXXXXXXXXX',
      'XXXXXXXXXX',
      'X.........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);

    // Undo every draw that is still in the history, newest first.
    // TODO: use a single undo per draw once the system clock issue is fixed. Undo is
    // ignored while the clock is behind the previous undo (see docs/known-issues.md).
    for (let draws = 20; draws >= 4; draws--) {
      await expect(async () => {
        await undo(page);
        await wait(100);
        expect(await countDrawnPixels(page)).toBe(draws);
      }).toPass({ timeout: 10_000 });
    }

    // The first 4 draws can't be undone: the 4th is the oldest state left.
    await undo(page);
    await wait(200);
    expect(await readPixelRows(page, 10, 10)).toEqual([
      'XXXX......',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]);
  });
});
