import test, { expect } from '../../fixtures';
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
} from "../../testutils";

test.describe('Layer operations', () => {

  test('should start with one layer', async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);
    const layerItems = getLayerItems(page);
    await expect(layerItems).toHaveCount(1);
  });

  test('should add a new layer', async ({ page }) => {
    await openEditor(page);

    await getAddLayerButton(page).click();

    expect(await getCurrentPiskelLayerCount(page)).toBe(2);
    const layerItems = getLayerItems(page);
    await expect(layerItems).toHaveCount(2);
  });

  test('should select a layer by clicking its name', async ({ page }) => {
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

  test('should delete a layer', async ({ page }) => {
    await openEditor(page);

    // Add a second layer
    await getAddLayerButton(page).click();
    expect(await getCurrentPiskelLayerCount(page)).toBe(2);

    // Delete the current layer
    await getDeleteLayerButton(page).click();

    expect(await getCurrentPiskelLayerCount(page)).toBe(1);
  });

  test('should rename a layer via edit button', async ({ page }) => {
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

  test('should rename a layer via double-click', async ({ page }) => {
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

  test('should cancel rename with Escape', async ({ page }) => {
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

  test('should move layer up', async ({ page }) => {
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

  test('should move layer down', async ({ page }) => {
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

  test('should merge layer down', async ({ page }) => {
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

  test('should disable delete button when only one layer', async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelLayerCount(page)).toBe(1);

    await expect(getDeleteLayerButton(page)).toBeDisabled();
  });

  test('should disable move-up when layer is at the top', async ({ page }) => {
    await openEditor(page);

    // Add a second layer - the new layer (top) is selected
    await getAddLayerButton(page).click();
    expect(await getCurrentLayerIndex(page)).toBe(1);

    await expect(getMoveLayerUpButton(page)).toBeDisabled();
  });

  test('should disable move-down when layer is at the bottom', async ({ page }) => {
    await openEditor(page);

    // Add a second layer
    await getAddLayerButton(page).click();

    // Select bottom layer (index 0)
    const layerNames = getLayerNameLocators(page);
    await layerNames.last().click();
    expect(await getCurrentLayerIndex(page)).toBe(0);

    await expect(getMoveLayerDownButton(page)).toBeDisabled();
  });

  test('should have default opacity of 1 (gold color)', async ({ page }) => {
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

  test('should change layer opacity via prompt', async ({ page }) => {
    await openEditor(page);

    // Draw on layer 0
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Add layer 1 and draw on it
    await getAddLayerButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 1);

    // Enable layer preview so opacity is visible on the drawing canvas
    await page.keyboard.press('Alt+l');

    // Screenshot the drawing canvas before opacity change
    const drawingCanvas = page.locator('[data-test-id="drawing-canvas"]');
    const before = await drawingCanvas.screenshot();

    // Change layer 1 opacity to 0.5
    // Layers are in reverse DOM order: first in DOM = top layer (index 1)
    page.once('dialog', dialog => dialog.accept('0.5'));
    await getAllLayerOpacityButtons(page).first().click();

    // Opacity α symbol should turn white for values between 0 and 1
    const opacityEl = getAllLayerOpacityButtons(page).first();
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(255, 255, 255)');

    // Tooltip attribute reflects the new value
    await expect(opacityEl).toHaveAttribute('data-original-title', 'Layer opacity (0.5)');

    // The drawing canvas should look different after opacity change
    // (layer 1's green pixel is now semi-transparent)
    const after = await drawingCanvas.screenshot();
    expect(before.equals(after)).toBe(false);
  });

  test('should show gray color for opacity 0', async ({ page }) => {
    await openEditor(page);

    // Set opacity to 0
    page.once('dialog', dialog => dialog.accept('0'));
    await getAllLayerOpacityButtons(page).first().click();

    const opacityEl = getAllLayerOpacityButtons(page).first();
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(150, 150, 150)');
  });

  test('should cancel opacity change when dismissing prompt', async ({ page }) => {
    await openEditor(page);

    // Dismiss the prompt
    page.once('dialog', dialog => dialog.dismiss());
    await getAllLayerOpacityButtons(page).first().click();

    // Opacity should remain 1 (gold)
    const opacityEl = getAllLayerOpacityButtons(page).first();
    const color = await opacityEl.evaluate(el => el.style.color);
    expect(color).toBe('rgb(255, 215, 0)');
  });

  test('should toggle layer preview with eye icon', async ({ page }) => {
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

  test('should toggle layer preview with Alt+L shortcut', async ({ page }) => {
    await openEditor(page);

    const toggle = testId(page, 'layer-preview-toggle');

    // Initially disabled (default is true in UserSettings but let's check the DOM)
    // Enable via Alt+L
    await page.keyboard.press('Alt+l');

    // Toggle state should change
    const enabledAfterFirst = await toggle.evaluate(
      el => el.classList.contains('layers-toggle-preview-enabled')
    );

    // Press Alt+L again to toggle back
    await page.keyboard.press('Alt+l');

    const enabledAfterSecond = await toggle.evaluate(
      el => el.classList.contains('layers-toggle-preview-enabled')
    );

    // The two states should be different (toggled)
    expect(enabledAfterFirst).not.toBe(enabledAfterSecond);
  });
});
