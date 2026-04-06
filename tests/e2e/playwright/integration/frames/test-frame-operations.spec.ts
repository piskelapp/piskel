import test, { expect } from '../../fixtures';
import {
  openEditor,
  getCurrentPiskelFrameCount,
  getCurrentFrameIndex,
  testId,
  setPrimaryColor,
  getPixelColor,
  drawAtPixel,
  clickTool,
  colorToInt,
  getFrameTiles,
  getAddFrameButton,
  waitFor,
} from "../../testutils";

test.describe('Frame operations', () => {

  test('should start with one frame', async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    await expect(getFrameTiles(page)).toHaveCount(1);
  });

  test('should add a new frame', async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);
    await expect(getFrameTiles(page)).toHaveCount(2);
  });

  test('should select a frame by clicking', async ({ page }) => {
    await openEditor(page);

    // Add a second frame
    await getAddFrameButton(page).click();
    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // Click on the first frame tile (index 0)
    await getFrameTiles(page).nth(0).click();
    expect(await getCurrentFrameIndex(page)).toBe(0);

    // Click on the second frame tile (index 1)
    await getFrameTiles(page).nth(1).click();
    expect(await getCurrentFrameIndex(page)).toBe(1);
  });

  test('should duplicate a frame', async ({ page }) => {
    await openEditor(page);

    // Draw something on frame 0 so the duplicate has content
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Hover on the frame tile to reveal the duplicate button, then click
    await getFrameTiles(page).nth(0).hover();
    await testId(page, 'duplicate-frame-button').nth(0).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // The duplicated frame (index 1) should have the same red pixel
    const pixel = await getPixelColor(page, 0, 0, 0, 1);
    expect(pixel).toBe(colorToInt('#FF0000'));
  });

  test('should delete the last frame', async ({ page }) => {
    await openEditor(page);

    // Add a second frame
    await getAddFrameButton(page).click();
    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // Hover on frame tile 1 and delete it
    await getFrameTiles(page).nth(1).hover();
    await testId(page, 'delete-frame-button').nth(1).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    await expect(getFrameTiles(page)).toHaveCount(1);
  });

  test('should delete the first frame and keep the second', async ({ page }) => {
    await openEditor(page);

    // Draw red on frame 0
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Add frame 1 and draw green
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);

    // Delete frame 0 (the red one)
    await getFrameTiles(page).nth(0).hover();
    await testId(page, 'delete-frame-button').nth(0).click();

    // Only 1 frame remains — it should be the green one
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#00FF00'));
  });

  test('should delete a middle frame', async ({ page }) => {
    await openEditor(page);

    // Frame 0: red
    await clickTool(page, 'tool-pen');
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Frame 1: green
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);

    // Frame 2: blue
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 0);

    expect(await getCurrentPiskelFrameCount(page)).toBe(3);

    // Delete middle frame (green, index 1)
    await getFrameTiles(page).nth(1).hover();
    await testId(page, 'delete-frame-button').nth(1).click();

    // 2 frames remain: red (index 0) and blue (index 1)
    expect(await getCurrentPiskelFrameCount(page)).toBe(2);
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 0, 0, 0, 1)).toBe(colorToInt('#0000FF'));
  });

  test('should add multiple frames', async ({ page }) => {
    await openEditor(page);

    await getAddFrameButton(page).click();
    await getAddFrameButton(page).click();
    await getAddFrameButton(page).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(4);
    await expect(getFrameTiles(page)).toHaveCount(4);
  });

  test('should navigate frames with keyboard shortcuts', async ({ page }) => {
    await openEditor(page);

    // Add frames
    await getAddFrameButton(page).click();
    await getAddFrameButton(page).click();
    expect(await getCurrentPiskelFrameCount(page)).toBe(3);

    // Select first frame
    await getFrameTiles(page).nth(0).click();
    expect(await getCurrentFrameIndex(page)).toBe(0);

    // Navigate down (next frame)
    await page.keyboard.press('ArrowDown');
    expect(await getCurrentFrameIndex(page)).toBe(1);

    await page.keyboard.press('ArrowDown');
    expect(await getCurrentFrameIndex(page)).toBe(2);

    // Navigate up (previous frame)
    await page.keyboard.press('ArrowUp');
    expect(await getCurrentFrameIndex(page)).toBe(1);
  });

  test('should add a new frame with N shortcut', async ({ page }) => {
    await openEditor(page);
    expect(await getCurrentPiskelFrameCount(page)).toBe(1);

    await page.keyboard.press('n');

    await waitFor(async () => (await getCurrentPiskelFrameCount(page)) === 2);
  });

  test('should duplicate frame with content via UI button', async ({ page }) => {
    await openEditor(page);

    // Draw something on frame 0 via the pen tool
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 1, 1);

    // Duplicate via the frame tile button
    await getFrameTiles(page).nth(0).hover();
    await testId(page, 'duplicate-frame-button').nth(0).click();

    expect(await getCurrentPiskelFrameCount(page)).toBe(2);
    // Duplicated frame should have the same black pixel (default primary color)
    const pixel = await getPixelColor(page, 1, 1, 0, 1);
    expect(pixel).toBe(colorToInt('#000000'));
  });

  test('should duplicate a middle frame and insert after it', async ({ page }) => {
    await openEditor(page);
    await clickTool(page, 'tool-pen');

    // Frame 0: red
    await setPrimaryColor(page, '#FF0000');
    await drawAtPixel(page, 0, 0);

    // Frame 1: green
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#00FF00');
    await drawAtPixel(page, 0, 0);

    // Frame 2: blue
    await getAddFrameButton(page).click();
    await setPrimaryColor(page, '#0000FF');
    await drawAtPixel(page, 0, 0);

    expect(await getCurrentPiskelFrameCount(page)).toBe(3);

    // Duplicate frame 1 (green)
    await getFrameTiles(page).nth(1).hover();
    await testId(page, 'duplicate-frame-button').nth(1).click();

    // Should now have 4 frames: red, green, green-copy, blue
    expect(await getCurrentPiskelFrameCount(page)).toBe(4);
    expect(await getPixelColor(page, 0, 0, 0, 0)).toBe(colorToInt('#FF0000'));
    expect(await getPixelColor(page, 0, 0, 0, 1)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 0, 0, 2)).toBe(colorToInt('#00FF00'));
    expect(await getPixelColor(page, 0, 0, 0, 3)).toBe(colorToInt('#0000FF'));
  });
});
