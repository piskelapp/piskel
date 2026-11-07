import test, { expect, Page } from "@playwright/test";
import {
  openEditor,
  getCurrentPiskelLayerCount,
  getCurrentLayerIndex,
  getLayerName,
  testId,
  getAddLayerButton,
  getLayerItems,
  getLayerNameLocators,
  getMoveLayerUpButton,
  getMoveLayerDownButton,
  getMergeLayerButton,
  getDeleteLayerButton,
  getAllLayerOpacityButtons,
  getPixelColor,
  drawAtPixel,
  setPrimaryColor,
  clickTool,
  colorToInt,
  assertColorRows,
  assertCurrentLayer,
  assertFrameCount,
  assertLayerNames,
  assertLayerPreviewOpacity,
  assertOtherLayerHiddenOnCanvas,
  assertOtherLayerOpacityOnCanvas,
  assertLayerPreviewEnabled,
  assertPreviewPixelAlpha,
  assertPreviewPlays,
  createEmptyLayerAbovePixel,
  duplicateCurrentLayer,
  getAddFrameButton,
  gridFromRows,
  gridFromColorRows,
  openEditorInNewPage,
  openEditorWithFakeClock,
  readPixelRows,
  renameCurrentLayer,
  screenshotSettledCanvas,
  selectBottomLayer,
  selectFrame,
  setLayerPreviewOpacity,
  setPiskelFromGrid,
  setTopLayerOpacity,
  assertTopLayerOpacity,
  toggleLayerPreview,
  undo,
  waitForGrid,
} from "../../testutils";

const EMPTY = ['....', '....', '....', '....'];
const PIXEL_TOP_LEFT = ['X...', '....', '....', '....'];
const PIXEL_IN_CENTER = ['....', '.X..', '....', '....'];

/** 10x10 sprites: empty, or with a single pixel */
const EMPTY_10X10 = [
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

test.describe('Layer operations', () => {

  test('should start with one layer', { tag: ['@layers.at-least-one'] }, async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);
    const layerItems = getLayerItems(page);
    await expect(layerItems).toHaveCount(1);
  });

  test('should add a new layer', { tag: ['@layers.add'] }, async ({ page }) => {
    await openEditor(page);

    await getAddLayerButton(page).click();

    expect(await getCurrentPiskelLayerCount(page)).toBe(2);
    const layerItems = getLayerItems(page);
    await expect(layerItems).toHaveCount(2);
  });

  test('should select a layer by clicking its name', { tag: ['@layers.select'] }, async ({ page }) => {
    await openEditor(page);

    // Add a second layer
    await getAddLayerButton(page).click();
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Click on the first layer name (layers are rendered in reverse order in DOM -
    // topmost layer is first in DOM). Layer index 0 is at the bottom.
    // After adding a layer, the new layer (index 1) is selected.
    expect(await getCurrentLayerIndex(page)).toBe(1);

    // Click on the bottom layer name (last in DOM = layer index 0)
    const layerNames = getLayerNameLocators(page);
    await layerNames.last().click();
    expect(await getCurrentLayerIndex(page)).toBe(0);
  });

  test('should delete a layer', { tag: ['@layers.delete'] }, async ({ page }) => {
    await openEditor(page);

    // Add a second layer
    await getAddLayerButton(page).click();
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Delete the current layer
    await getDeleteLayerButton(page).click();

    expect(await getCurrentPiskelLayerCount(page)).toBe(1);
  });

  test('should rename a layer via edit button', { tag: ['@layers.rename'] }, async ({ page }) => {
    await openEditor(page);

    // Click the edit/rename button
    await testId(page, 'layer-edit-button').click();

    // The rename input should appear
    const renameInput = testId(page, 'layer-name-input');
    await expect(renameInput).toBeAttached();

    // Clear and type new name
    await renameInput.fill('My Custom Layer');
    await renameInput.press('Enter');

    // Verify the layer was renamed
    const layerName = await getLayerName(page, 0);
    expect(layerName).toBe('My Custom Layer');
  });

  test('should rename a layer via double-click', { tag: ['@layers.rename'] }, async ({ page }) => {
    await openEditor(page);

    // Double-click on the layer name to start renaming
    const layerName = getLayerNameLocators(page).first();
    await layerName.dblclick();

    // The rename input should appear
    const renameInput = testId(page, 'layer-name-input');
    await expect(renameInput).toBeAttached();

    await renameInput.fill('Renamed Layer');
    await renameInput.press('Enter');

    const newName = await getLayerName(page, 0);
    expect(newName).toBe('Renamed Layer');
  });

  test('should cancel rename with Escape', { tag: ['@layers.rename-cancel'] }, async ({ page }) => {
    await openEditor(page);

    const originalName = await getLayerName(page, 0);

    // Start renaming
    await testId(page, 'layer-edit-button').click();
    const renameInput = testId(page, 'layer-name-input');
    await expect(renameInput).toBeAttached();

    await renameInput.fill('Should Not Stick');
    await renameInput.press('Escape');

    // Name should be unchanged
    const currentName = await getLayerName(page, 0);
    expect(currentName).toBe(originalName);
  });

  test('should move layer up', { tag: ['@layers.move'] }, async ({ page }) => {
    await openEditor(page);

    // Create two layers. After adding, layer 1 is selected (the new one on top).
    await getAddLayerButton(page).click();
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Select bottom layer (index 0)
    const layerNames = getLayerNameLocators(page);
    await layerNames.last().click();
    expect(await getCurrentLayerIndex(page)).toBe(0);

    const bottomLayerName = await getLayerName(page, 0);

    // Move it up
    await getMoveLayerUpButton(page).click();

    // The layer that was at index 0 should now be at index 1 (top)
    expect(await getCurrentLayerIndex(page)).toBe(1);
    const movedLayerName = await getLayerName(page, 1);
    expect(movedLayerName).toBe(bottomLayerName);
  });

  test('should move layer down', { tag: ['@layers.move'] }, async ({ page }) => {
    await openEditor(page);

    // Create two layers. After adding, layer 1 is selected (top).
    await getAddLayerButton(page).click();
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    const topLayerName = await getLayerName(page, 1);

    // Current selection is layer 1 (top), move it down
    await getMoveLayerDownButton(page).click();

    // The layer should now be at index 0
    expect(await getCurrentLayerIndex(page)).toBe(0);
    const movedLayerName = await getLayerName(page, 0);
    expect(movedLayerName).toBe(topLayerName);
  });

  test('should move a layer to the bottom or the top with shift', { tag: ['@layers.move'] }, async ({ page }) => {
    // Start with three layers. The new top layer is current.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY_10X10));
    await getAddLayerButton(page).click();
    await getAddLayerButton(page).click();
    await assertLayerNames(page, ['Layer 2', 'Layer 1', 'Base layer']);
    await assertCurrentLayer(page, 2);

    // Shift moves the layer to the bottom, past both other layers.
    await getMoveLayerDownButton(page).click({ modifiers: ['Shift'] });
    await assertLayerNames(page, ['Layer 1', 'Base layer', 'Layer 2']);
    await assertCurrentLayer(page, 0);

    // And back to the top.
    await getMoveLayerUpButton(page).click({ modifiers: ['Shift'] });
    await assertLayerNames(page, ['Layer 2', 'Layer 1', 'Base layer']);
    await assertCurrentLayer(page, 2);
  });

  test('should merge layer down', { tag: ['@layers.merge-down'] }, async ({ page }) => {
    await openEditor(page);

    // Draw on layer 0
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Add layer 1 and draw on it
    await getAddLayerButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);

    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Merge layer 1 down into layer 0
    await getMergeLayerButton(page).click();

    expect(await getCurrentPiskelLayerCount(page)).toBe(1);

    // Both pixels should exist in the merged layer
    const pixel00 = await getPixelColor(page, 0, 0, 0, 0);
    const pixel11 = await getPixelColor(page, 1, 1, 0, 0);
    expect(pixel00).toBe(colorToInt('#FF0000'));
    expect(pixel11).toBe(colorToInt('#00FF00'));
  });

  test('should keep the upper layer on top, and its name, when merging down', { tag: ['@layers.merge-down'] }, async ({ page }) => {
    // Start from two red pixels on the bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromColorRows([
      'RR........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
    ]));

    // Add a layer, with two green pixels: one of them over a red one.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await setPrimaryColor(page, '#00FF00');
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 0);
    await drawAtPixel(page, 2, 0);
    expect(await readPixelRows(page, 10, 10, 1)).toEqual([
      '.XX.......',
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

    // Merge it down: green wins where the pixels overlap, and the name is the upper layer's.
    await getMergeLayerButton(page).click();
    await assertLayerNames(page, ['Layer 1']);
    await assertColorRows(page, [
      'RGG.......',
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

  test('should disable delete button when only one layer', { tag: ['@layers.delete-disabled'] }, async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);

    await expect(getDeleteLayerButton(page)).toBeDisabled();
  });

  test('should disable move-up when layer is at the top', { tag: ['@layers.move-disabled'] }, async ({ page }) => {
    await openEditor(page);

    // Add a second layer - the new layer (top) is selected
    await getAddLayerButton(page).click();
    expect(await getCurrentLayerIndex(page)).toBe(1);

    await expect(getMoveLayerUpButton(page)).toBeDisabled();
  });

  test('should disable move-down when layer is at the bottom', { tag: ['@layers.move-disabled'] }, async ({ page }) => {
    await openEditor(page);

    // Add a second layer
    await getAddLayerButton(page).click();

    // Select bottom layer (index 0)
    const layerNames = getLayerNameLocators(page);
    await layerNames.last().click();
    expect(await getCurrentLayerIndex(page)).toBe(0);

    await expect(getMoveLayerDownButton(page)).toBeDisabled();
  });

  test('should have default opacity of 1 (gold color)', { tag: ['@layers.opacity', '@layers.opacity-indicator'] }, async ({ page }) => {
    await openEditor(page);

    const opacityEl = getAllLayerOpacityButtons(page).first();
    // Bootstrap tooltip may move title to data-original-title
    const titleAttr = await opacityEl.getAttribute('data-original-title')
      ?? await opacityEl.getAttribute('title');
    expect(titleAttr).toBe('Layer opacity (1)');
    // Gold color = #ffd700 for opacity 1
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(255, 215, 0)');
  });

  test('should change layer opacity via prompt', { tag: ['@layers.opacity'] }, async ({ page }) => {
    await openEditor(page);

    // Change the opacity of the layer to 0.5
    await setTopLayerOpacity(page, 0.5);

    // Opacity α symbol should turn white for values between 0 and 1
    const opacityEl = getAllLayerOpacityButtons(page).first();
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(255, 255, 255)');

    // Tooltip attribute reflects the new value
    await expect(opacityEl).toHaveAttribute('data-original-title', 'Layer opacity (0.5)');
  });

  test('should apply the opacity of the current layer to the preview but not to the canvas', { tag: ['@layers.opacity-rendering'] }, async ({ page }) => {
    // Start from a layer with a pixel, fully opaque in the preview.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(PIXEL_TOP_LEFT));
    await assertPreviewPixelAlpha(page, 0, 0, 255);
    const canvasBefore = await screenshotSettledCanvas(page);

    // Set the opacity of the layer to 0.5.
    await setTopLayerOpacity(page, 0.5);

    // The preview shows the pixel half transparent.
    await assertPreviewPixelAlpha(page, 0, 0, 128);

    // The canvas still shows it as before. Hovering the canvas would highlight
    // a pixel, so keep the mouse away from it.
    await page.mouse.move(0, 0);
    expect((await screenshotSettledCanvas(page)).equals(canvasBefore)).toBe(true);
  });

  test('should show gray color for opacity 0', { tag: ['@layers.opacity-indicator'] }, async ({ page }) => {
    await openEditor(page);

    // Set opacity to 0
    page.once('dialog', dialog => dialog.accept('0'));
    await getAllLayerOpacityButtons(page).first().click();

    const opacityEl = getAllLayerOpacityButtons(page).first();
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(150, 150, 150)');
  });

  test('should cancel opacity change when dismissing prompt', { tag: ['@layers.opacity'] }, async ({ page }) => {
    await openEditor(page);

    // Dismiss the prompt
    page.once('dialog', dialog => dialog.dismiss());
    await getAllLayerOpacityButtons(page).first().click();

    // Opacity should remain 1 (gold)
    const opacityEl = getAllLayerOpacityButtons(page).first();
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(255, 215, 0)');
  });

  test('should toggle layer preview with eye icon', { tag: ['@layers.preview'] }, async ({ page }) => {
    await openEditor(page);

    // Draw on layer 0
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Add layer 1 and draw different color
    await getAddLayerButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);

    const toggle = testId(page, 'layer-preview-toggle');
    const drawingCanvas = page.locator('[data-test-id="drawing-canvas"]');

    // Check initial state (LAYER_PREVIEW defaults to true)
    const initiallyEnabled = await toggle.evaluate(
      el => el.classList.contains('layers-toggle-preview-enabled')
    );

    // Screenshot with current state
    const before = await drawingCanvas.screenshot();

    // Click to toggle
    await toggle.click();

    // Class should have changed
    if (initiallyEnabled) {
      await expect(toggle).not.toHaveClass(/layers-toggle-preview-enabled/);
    } else {
      await expect(toggle).toHaveClass(/layers-toggle-preview-enabled/);
    }

    // Canvas should look different (layer preview on vs off)
    const afterToggle = await drawingCanvas.screenshot();
    expect(before.equals(afterToggle)).toBe(false);

    // Click again to toggle back
    await toggle.click();

    // Canvas should return to original appearance
    const afterRestore = await drawingCanvas.screenshot();
    expect(before.equals(afterRestore)).toBe(true);
  });

  test('should toggle layer preview with Alt+L shortcut', { tag: ['@layers.preview'] }, async ({ page }) => {
    // Start with layer preview on, as it is by default.
    await openEditor(page);
    await createEmptyLayerAbovePixel(page);
    await assertLayerPreviewEnabled(page, true);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.2);

    // Alt+L turns it off: the other layer disappears from the canvas.
    await page.keyboard.press('Alt+l');
    await assertLayerPreviewEnabled(page, false);
    await assertOtherLayerHiddenOnCanvas(page, 0, 0);

    // Alt+L turns it back on.
    await page.keyboard.press('Alt+l');
    await assertLayerPreviewEnabled(page, true);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.2);
  });

  test('should combine the opacity of other layers with the layer preview opacity on the canvas', { tag: ['@layers.opacity-rendering', '@layers.preview'] }, async ({ page }) => {
    // Draw a pixel in a top layer, above an empty bottom layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 1)).toEqual(PIXEL_TOP_LEFT);

    // From the bottom layer, the opaque top layer shows at the default 0.2.
    await selectBottomLayer(page);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.2);

    // Give the top layer an opacity of 0.5: it shows at 0.5 x 0.2.
    await setTopLayerOpacity(page, 0.5);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.1);

    // Raise the layer preview opacity to 0.5: it shows at 0.5 x 0.5.
    await setLayerPreviewOpacity(page, 0.5);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.25);
  });

  test('should list the top layer first and draw on the current layer', { tag: ['@layers.list-order'] }, async ({ page }) => {
    // Start from a sprite with one empty layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(EMPTY));
    await assertLayerNames(page, ['Base layer']);

    // Add a layer: it goes above the first one, so it comes first in the list.
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await assertLayerNames(page, ['Layer 1', 'Base layer']);
    await expect(getLayerItems(page).first()).toHaveClass(/current-layer-item/);

    // Draw: only the highlighted top layer changes.
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 4, 4, 1)).toEqual(PIXEL_IN_CENTER);
    expect(await readPixelRows(page, 4, 4, 0)).toEqual(EMPTY);

    // Select the bottom layer and draw: only that layer changes.
    await selectBottomLayer(page);
    await expect(getLayerItems(page).last()).toHaveClass(/current-layer-item/);
    await drawAtPixel(page, 0, 0);
    expect(await readPixelRows(page, 4, 4, 0)).toEqual(PIXEL_TOP_LEFT);
    expect(await readPixelRows(page, 4, 4, 1)).toEqual(PIXEL_IN_CENTER);
  });

  test('should duplicate the current layer above it', { tag: ['@layers.duplicate'] }, async ({ page }) => {
    // Start from a layer with a pixel, below an empty layer.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(PIXEL_TOP_LEFT));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await assertLayerNames(page, ['Layer 1', 'Base layer']);

    // Select the bottom layer and duplicate it.
    await selectBottomLayer(page);
    await duplicateCurrentLayer(page);

    // The copy sits between the bottom layer and the top layer, and is selected.
    await assertLayerNames(page, ['Layer 1', 'Base layer (clone)', 'Base layer']);
    await assertCurrentLayer(page, 1);

    // It has the pixels of the original, and the other layers didn't change.
    expect(await readPixelRows(page, 4, 4, 2)).toEqual(EMPTY);
    expect(await readPixelRows(page, 4, 4, 1)).toEqual(PIXEL_TOP_LEFT);
    expect(await readPixelRows(page, 4, 4, 0)).toEqual(PIXEL_TOP_LEFT);
  });

  test('should duplicate every frame of the layer, as an independent copy', { tag: ['@layers.duplicate'] }, async ({ page }) => {
    // Start from a layer with a different pixel in each of its two frames.
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(PIXEL_AT_0_0));
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);
    await selectFrame(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(PIXEL_AT_1_1);

    // Duplicate it: the copy has both frames.
    await duplicateCurrentLayer(page);
    await assertLayerNames(page, ['Base layer (clone)', 'Base layer']);
    await assertCurrentLayer(page, 1);
    expect(await readPixelRows(page, 10, 10, 1, 0)).toEqual(PIXEL_AT_0_0);
    expect(await readPixelRows(page, 10, 10, 1, 1)).toEqual(PIXEL_AT_1_1);

    // Draw on the copy: the original doesn't change.
    await drawAtPixel(page, 9, 9);
    await waitForGrid(page, 10, 10, [
      '..........',
      '.X........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '..........',
      '.........X',
    ], { layerIndex: 1, frameIndex: 1 });
    expect(await readPixelRows(page, 10, 10, 0, 1)).toEqual(PIXEL_AT_1_1);
    expect(await readPixelRows(page, 10, 10, 0, 0)).toEqual(PIXEL_AT_0_0);
  });

  test('should remember layer preview across sessions', { tag: ['@layers.preview-saved'] }, async ({ page }) => {
    await openEditor(page);
    await createEmptyLayerAbovePixel(page);
    await assertLayerPreviewEnabled(page, true);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.2);

    // Turn layer preview off and come back: it stays off.
    await toggleLayerPreview(page);
    await assertLayerPreviewEnabled(page, false);
    await assertOtherLayerHiddenOnCanvas(page, 0, 0);
    const secondSession = await openEditorInNewPage(page);
    await createEmptyLayerAbovePixel(secondSession);
    await assertLayerPreviewEnabled(secondSession, false);
    await assertOtherLayerHiddenOnCanvas(secondSession, 0, 0);

    // Turn it back on and come back: it stays on.
    await toggleLayerPreview(secondSession);
    await assertLayerPreviewEnabled(secondSession, true);
    await assertOtherLayerOpacityOnCanvas(secondSession, 0, 0, 0.2);
    const thirdSession = await openEditorInNewPage(secondSession);
    await createEmptyLayerAbovePixel(thirdSession);
    await assertLayerPreviewEnabled(thirdSession, true);
    await assertOtherLayerOpacityOnCanvas(thirdSession, 0, 0, 0.2);
  });

  test('should turn layer preview off when the layer preview opacity is 0, and on at any other value', { tag: ['@layers.preview-opacity', '@layers.preview'] }, async ({ page }) => {
    const BOTH_LAYERS = ['X...', '.X..', '....', '....'];

    // Start from two layers with a pixel each.
    await openEditorWithFakeClock(page);
    await setPiskelFromGrid(page, gridFromRows(PIXEL_TOP_LEFT));
    await getAddLayerButton(page).click();
    await assertCurrentLayer(page, 1);
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);
    expect(await readPixelRows(page, 4, 4, 1)).toEqual(PIXEL_IN_CENTER);

    // Add an empty frame, so that the animated preview keeps rendering.
    await getAddFrameButton(page).click();
    await assertFrameCount(page, 2);

    // Go back to the first frame, where the bottom layer shows on the canvas.
    await selectFrame(page, 0);
    await assertLayerPreviewEnabled(page, true);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.2);
    await assertPreviewPlays(page, [BOTH_LAYERS, EMPTY]);

    // A layer preview opacity of 0 turns layer preview off. It only concerns the
    // canvas: the animated preview still shows all the layers.
    await setLayerPreviewOpacity(page, 0);
    await assertLayerPreviewEnabled(page, false);
    await assertOtherLayerHiddenOnCanvas(page, 0, 0);
    await assertPreviewPlays(page, [BOTH_LAYERS, EMPTY]);

    // Any other value turns it back on.
    await setLayerPreviewOpacity(page, 0.5);
    await assertLayerPreviewEnabled(page, true);
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.5);
    await assertPreviewPlays(page, [BOTH_LAYERS, EMPTY]);
  });

  test('should reset the layer preview opacity to 0.2 when turning layer preview on at 0', { tag: ['@layers.preview-opacity'] }, async ({ page }) => {
    // Set the layer preview opacity to 0, which turns layer preview off.
    await openEditor(page);
    await createEmptyLayerAbovePixel(page);
    await setLayerPreviewOpacity(page, 0);
    await assertLayerPreviewEnabled(page, false);
    await assertLayerPreviewOpacity(page, '0.00');
    await assertOtherLayerHiddenOnCanvas(page, 0, 0);

    // Turn layer preview on: the layer preview opacity goes back to 0.2.
    await toggleLayerPreview(page);
    await assertLayerPreviewEnabled(page, true);
    await assertLayerPreviewOpacity(page, '0.20');
    await assertOtherLayerOpacityOnCanvas(page, 0, 0, 0.2);
  });

  test('should truncate long layer names and show them in a tooltip', { tag: ['@layers.long-names'] }, async ({ page }) => {
    const longName = 'A very long layer name that cannot fit in the layers list at all';
    await openEditor(page);

    // Give the layer a long name.
    await renameCurrentLayer(page, longName);
    await assertLayerNames(page, [longName]);

    // The name is cut with an ellipsis, inside the width of the list.
    const name = getLayerNameLocators(page).first();
    await expect(name).toHaveCSS('text-overflow', 'ellipsis');
    expect(await name.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

    // Hovering it shows the full name.
    await name.hover();
    await expect(page.locator('.tooltip')).toHaveText(longName);
  });

  test('should not truncate short layer names', { tag: ['@layers.long-names'] }, async ({ page }) => {
    await openEditor(page);

    await renameCurrentLayer(page, 'Short');
    await assertLayerNames(page, ['Short']);

    const name = getLayerNameLocators(page).first();
    await expect(name).not.toHaveCSS('text-overflow', 'ellipsis');
    await name.hover();
    await expect(page.locator('.tooltip')).toHaveCount(0);
  });

  test('should scroll the list to keep the current layer visible', { tag: ['@layers.long-names'] }, async ({ page }) => {
    // Add more layers than the list can show. The new top layer is current.
    await openEditor(page);
    for (let layerCount = 2; layerCount <= 40; layerCount++) {
      await getAddLayerButton(page).click();
      await expect(getLayerItems(page)).toHaveCount(layerCount);
    }
    await assertCurrentLayer(page, 39);
    await expect(getLayerItems(page).first()).toBeInViewport();
    await expect(getLayerItems(page).last()).not.toBeInViewport();

    // Shift moves the current layer all the way to the bottom of the list.
    await getMoveLayerDownButton(page).click({ modifiers: ['Shift'] });
    await assertCurrentLayer(page, 0);

    // The list followed it.
    await expect(getLayerItems(page).last()).toBeInViewport();
    await expect(getLayerItems(page).first()).not.toBeInViewport();
  });

  // Each operation applies to "Layer 1", the current layer, which is above "Base layer".
  const layerOperations: Array<{
    name: string;
    change: (page: Page) => Promise<void>;
    assertChanged: (page: Page) => Promise<void>;
  }> = [
    {
      name: 'adding a layer',
      change: (page) => getAddLayerButton(page).click(),
      assertChanged: (page) => assertLayerNames(page, ['Layer 2', 'Layer 1', 'Base layer']),
    },
    {
      name: 'duplicating a layer',
      change: duplicateCurrentLayer,
      assertChanged: (page) => assertLayerNames(page, ['Layer 1 (clone)', 'Layer 1', 'Base layer']),
    },
    {
      name: 'renaming a layer',
      change: (page) => renameCurrentLayer(page, 'Renamed'),
      assertChanged: (page) => assertLayerNames(page, ['Renamed', 'Base layer']),
    },
    {
      name: 'moving a layer',
      change: (page) => getMoveLayerDownButton(page).click(),
      assertChanged: (page) => assertLayerNames(page, ['Base layer', 'Layer 1']),
    },
    {
      name: 'merging a layer down',
      change: (page) => getMergeLayerButton(page).click(),
      assertChanged: (page) => assertLayerNames(page, ['Layer 1']),
    },
    {
      name: 'deleting a layer',
      change: (page) => getDeleteLayerButton(page).click(),
      assertChanged: (page) => assertLayerNames(page, ['Base layer']),
    },
    {
      name: 'changing the opacity of a layer',
      change: (page) => setTopLayerOpacity(page, 0.5),
      assertChanged: (page) => assertTopLayerOpacity(page, 0.5),
    },
  ];
  for (const { name, change, assertChanged } of layerOperations) {
    test(`undo should revert ${name} in one step`, { tag: ['@layers.undo'] }, async ({ page }) => {
      // Start from a pixel on each of two layers.
      await openEditor(page);
      await setPiskelFromGrid(page, gridFromRows(PIXEL_AT_0_0));
      await getAddLayerButton(page).click();
      await assertCurrentLayer(page, 1);
      await clickTool(page, 'tool-pen');
      await drawAtPixel(page, 1, 1);
      expect(await readPixelRows(page, 10, 10, 1)).toEqual(PIXEL_AT_1_1);

      await change(page);
      await assertChanged(page);

      // Undo reverts the operation only: the pixel drawn before it is still there.
      await undo(page);
      await assertLayerNames(page, ['Layer 1', 'Base layer']);
      await assertTopLayerOpacity(page, 1);
      await waitForGrid(page, 10, 10, PIXEL_AT_0_0, { layerIndex: 0 });
      await waitForGrid(page, 10, 10, PIXEL_AT_1_1, { layerIndex: 1 });
    });
  }
});
