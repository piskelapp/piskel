import test, { expect } from "@playwright/test";
import { openEditor, testId, clickTool, setPrimaryColor, getPrimaryColor, drawAtPixel, waitFor, getPaletteColors } from "../../testutils";

test.describe('Create palette', () => {

  test('should open create palette dialog with correct default content', async ({ page }) => {
    await openEditor(page);

    await testId(page, 'create-palette-button').click();

    // Dialog should be visible
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });

    // Title
    await expect(page.locator('.dialog-title')).toHaveText('Create Palette');

    // Name input with empty value and placeholder
    const nameInput = page.locator('input[name="palette-name"]');
    await expect(nameInput).toBeAttached();
    await expect(nameInput).toHaveValue('New palette');
    await expect(nameInput).toHaveAttribute('placeholder', 'palette name ...');

    // Import/download buttons
    await expect(page.locator('.create-palette-import-button')).toHaveText('Import from file');
    await expect(page.locator('.create-palette-download-button')).toHaveText('Download as file');

    // Color picker with hex input defaulting to #000000
    await expect(page.locator('[data-model="hex"]')).toHaveValue('#000');

    // HSV sliders present with defaults (H=0, S=0, V=0)
    await expect(page.locator('input[data-model="hsv"][data-dimension="h"][type="range"]')).toHaveValue('0');
    await expect(page.locator('input[data-model="hsv"][data-dimension="s"][type="range"]')).toHaveValue('0');
    await expect(page.locator('input[data-model="hsv"][data-dimension="v"][type="range"]')).toHaveValue('0');

    // RGB sliders present with defaults (R=0, G=0, B=0)
    await expect(page.locator('input[data-model="rgb"][data-dimension="r"][type="range"]')).toHaveValue('0');
    await expect(page.locator('input[data-model="rgb"][data-dimension="g"][type="range"]')).toHaveValue('0');
    await expect(page.locator('input[data-model="rgb"][data-dimension="b"][type="range"]')).toHaveValue('0');

    // Action buttons (scoped to dialog)
    const dialog = page.locator('.dialog-create-palette');
    await expect(dialog.locator('[data-action="cancel"]')).toHaveText('Cancel');
    await expect(dialog.locator('[data-action="delete"]')).toHaveText('Delete');
    await expect(dialog.locator('[data-action="submit"]')).toHaveText('Save');

    // Colors list should have one default color (black)
    await expect(page.locator('.create-palette-color')).toHaveCount(1);
    await expect(page.locator('.create-palette-color').first()).toHaveAttribute('data-palette-color', '#000000');
  });

  test('should create a palette with a custom name', async ({ page }) => {
    await openEditor(page);

    await testId(page, 'create-palette-button').click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });

    // Type palette name
    const nameInput = page.locator('input[name="palette-name"]');
    await nameInput.fill('My Test Palette');

    // Save the palette
    await page.locator('[data-action="submit"]').click();

    // Dialog should close
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });

    // The palette selector should now show the new palette
    const selectedOption = testId(page, 'palette-select');
    await expect(selectedOption).toContainText('My Test Palette');
  });

  test('should cancel palette creation', async ({ page }) => {
    await openEditor(page);

    // Get current palette selection
    const initialPalette = await testId(page, 'palette-select').inputValue();

    await testId(page, 'create-palette-button').click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });

    // Type a name but cancel
    const nameInput = page.locator('input[name="palette-name"]');
    await nameInput.fill('Cancelled Palette');
    await page.locator('[data-action="cancel"]').click();

    // Dialog should close
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });

    // Palette selection should be unchanged
    const currentPalette = await testId(page, 'palette-select').inputValue();
    expect(currentPalette).toBe(initialPalette);
  });

  test('should open create palette dialog with Alt+P shortcut', async ({ page }) => {
    await openEditor(page);

    await page.keyboard.press('Alt+p');

    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });
    await expect(page.locator('input[name="palette-name"]')).toBeAttached();
  });

  test('should update current colors palette when drawing new colors', async ({ page }) => {
    await openEditor(page);

    // Default palette is "Current colors" — starts empty on a blank canvas
    const colorSwatches = page.locator('.palettes-list-color');
    const initialCount = await colorSwatches.count();

    // Draw red pixel
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Wait for current colors to update with red
    await waitFor(async () => (await colorSwatches.count()) > initialCount);
    await expect(colorSwatches.locator('[data-color="#ff0000"]')).toBeAttached();

    // Draw green pixel
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 0);

    // Wait for green to appear
    await waitFor(async () => (await colorSwatches.count()) > initialCount + 1);
    await expect(colorSwatches.locator('[data-color="#00ff00"]')).toBeAttached();

    // Draw blue pixel
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 1);

    await waitFor(async () => (await colorSwatches.count()) > initialCount + 2);
    await expect(colorSwatches.locator('[data-color="#0000ff"]')).toBeAttached();

    // All 3 colors should be in the palette
    await expect(colorSwatches.locator('[data-color="#ff0000"]')).toBeAttached();
    await expect(colorSwatches.locator('[data-color="#00ff00"]')).toBeAttached();
    await expect(colorSwatches.locator('[data-color="#0000ff"]')).toBeAttached();
  });

  test('should set primary color when clicking a palette swatch', async ({ page }) => {
    await openEditor(page);

    // Draw red and green to populate the current colors palette
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 0);

    // Wait for both swatches to appear
    const colorSwatches = page.locator('.palettes-list-color');
    await waitFor(async () => (await colorSwatches.count()) >= 2);

    // Set primary to something else first
    await setPrimaryColor(page, '#FFFFFF');
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#ffffff');

    // Click the red swatch
    await page.locator('.palettes-list-color [data-color="#ff0000"]').click();

    // Primary color should now be red
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#ff0000');

    // Click the green swatch
    await page.locator('.palettes-list-color [data-color="#00ff00"]').click();

    // Primary color should now be green
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#00ff00');
  });

  test('should clone current colors, add/remove colors, save and verify', async ({ page }) => {
    await openEditor(page);

    // Draw red and green to populate current colors
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 1, 0);

    const colorSwatches = page.locator('.palettes-list-color');
    await waitFor(async () => (await colorSwatches.count()) >= 2);

    // Click the edit (pencil) button on the palette — clones current colors
    await page.locator('.edit-palette-button').click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached({ timeout: 5000 });

    // Dialog should show "Create Palette" (cloning, not editing)
    await expect(page.locator('.dialog-title')).toHaveText('Create Palette');

    // Name should be "Current colors clone"
    await expect(page.locator('input[name="palette-name"]')).toHaveValue('Current colors clone');

    // Should have the 2 current colors (red + green)
    const paletteColors = page.locator('.create-palette-color');
    await expect(paletteColors).toHaveCount(2);

    // Add a new color (duplicates the selected color, then we change it)
    await page.locator('.create-palette-new-color').click();
    await expect(paletteColors).toHaveCount(3);

    // Change the new color to blue via the hex input
    const hexInput = page.locator('[data-model="hex"]');
    await hexInput.fill('#0000FF');
    await hexInput.press('Enter');

    // Remove the first color (red) by clicking its X button
    await paletteColors.nth(0).locator('.create-palette-remove-color').click();
    await expect(paletteColors).toHaveCount(2);

    // Rename the palette
    const nameInput = page.locator('input[name="palette-name"]');
    await nameInput.fill('My Custom Palette');

    // Save
    const dialog = page.locator('.dialog-create-palette');
    await dialog.locator('[data-action="submit"]').click();
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached({ timeout: 5000 });

    // Palette selector should show the new palette
    await expect(testId(page, 'palette-select')).toContainText('My Custom Palette');

    // Palette should show green + blue (red was removed)
    expect(await getPaletteColors(page)).toEqual(['#00ff00', '#0000ff'].sort());

    // --- Verify 2 palettes exist and swapping updates displayed colors ---

    const paletteSelect = testId(page, 'palette-select');
    const optionTexts = await paletteSelect.locator('option').allInnerTexts();
    expect(optionTexts).toContain('Current colors');
    expect(optionTexts).toContain('My Custom Palette');

    // Switch to "Current colors" — should show red + green (canvas colors)
    await paletteSelect.selectOption({ label: 'Current colors' });
    expect(await getPaletteColors(page)).toEqual(['#00ff00', '#ff0000'].sort());

    // Switch back to "My Custom Palette" — should show green + blue
    await paletteSelect.selectOption({ label: 'My Custom Palette' });
    expect(await getPaletteColors(page)).toEqual(['#00ff00', '#0000ff'].sort());
  });
});
