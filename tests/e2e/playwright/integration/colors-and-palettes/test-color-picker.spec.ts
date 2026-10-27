import test, { expect } from "@playwright/test";
import {
  getPrimaryColor,
  getSecondaryColor,
  openEditor,
  setPrimaryColor,
  setSecondaryColor,
  testId,
} from "../../testutils";

test.describe('Color picker', () => {

  test('should have default colors on load', async ({ page }) => {
    await openEditor(page);

    const primary = await getPrimaryColor(page);
    const secondary = await getSecondaryColor(page);

    // Default primary is black (#000000), secondary is transparent
    expect(primary).toBe('#000000');
    expect(secondary).toBe('rgba(0, 0, 0, 0)');
  });

  test('should swap colors with X key', async ({ page }) => {
    await openEditor(page);

    // Set distinct colors to verify swap
    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');

    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#ff0000');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#0000ff');

    // Press X to swap
    await page.keyboard.press('x');

    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#0000ff');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#ff0000');
  });

  test('should swap colors by clicking swap button', async ({ page }) => {
    await openEditor(page);

    await setPrimaryColor(page, '#00FF00');
    await setSecondaryColor(page, '#FF00FF');

    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#00ff00');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#ff00ff');

    await testId(page, 'swap-colors-button').click();

    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#ff00ff');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#00ff00');
  });

  test('should reset colors with D key', async ({ page }) => {
    await openEditor(page);

    // Set non-default colors
    await setPrimaryColor(page, '#FF0000');
    await setSecondaryColor(page, '#0000FF');

    // Press D to reset
    await page.keyboard.press('d');

    expect(await getPrimaryColor(page)).toBe('#000000');
    expect(await getSecondaryColor(page)).toBe('rgba(0, 0, 0, 0)');
  });

  test('should set primary color', async ({ page }) => {
    await openEditor(page);

    await setPrimaryColor(page, '#AABB00');
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#aabb00');
  });

  test('should set secondary color', async ({ page }) => {
    await openEditor(page);

    await setSecondaryColor(page, '#00CCDD');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#00ccdd');
  });

  test('should swap colors twice to return to original', async ({ page }) => {
    await openEditor(page);

    await setPrimaryColor(page, '#112233');
    await setSecondaryColor(page, '#445566');

    // First swap
    await page.keyboard.press('x');
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#445566');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#112233');

    // Second swap
    await page.keyboard.press('x');
    expect((await getPrimaryColor(page)).toLowerCase()).toBe('#112233');
    expect((await getSecondaryColor(page)).toLowerCase()).toBe('#445566');
  });
});
