import test, { expect, Locator, Page } from "@playwright/test";
import {
  assertFps,
  assertHiddenFrames,
  assertPreviewImageWidth,
  assertPreviewPlays,
  assertSelectedPreviewSize,
  createThreeFrames,
  downloadPiskelFile,
  gridFromRows,
  openEditor,
  openEditorWithFakeClock,
  PIXEL_IN_FIRST_COLUMN,
  PIXEL_IN_SECOND_COLUMN,
  readFpsFromPiskelFile,
  selectFrame,
  setFps,
  setPiskelFromGrid,
  testId,
  toggleFrameVisibility,
  zoomInUntilMinimapVisible,
} from "../../testutils";

/** A 10x10 sprite with an L shape */
const L_SHAPE = [
  'X.........',
  'X.........',
  'XX........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

/** Hover on the preview area to reveal the contextual action buttons */
async function showPreviewActions(page: Page) {
  await page.locator(".minimap-container").hover();
  await expect(page.locator(".preview-contextual-actions")).toBeVisible();
}

/** Hover the preview area and its size menu, and click a size button */
async function clickPreviewSizeButton(page: Page, size: "1x" | "full") {
  await showPreviewActions(page);
  await page.locator(".preview-drop-down").hover();
  const button = testId(page, `preview-size-${size}`);
  await expect(button).toBeVisible();
  await button.click();
}

/** Open the popup preview, and return its page */
async function openPopupPreview(page: Page): Promise<Page> {
  await showPreviewActions(page);
  const popupPromise = page.context().waitForEvent("page");
  await testId(page, "open-popup-preview-button").click();
  const popup = await popupPromise;
  await expect(popup.locator(".preview-container")).toBeAttached();
  return popup;
}

/** Read the size of the image shown by the popup preview */
async function readPopupImageSize(popup: Page): Promise<{ width: number; height: number }> {
  const image = popup.locator(".background-image-frame-container");
  await expect
    .poll(() => image.evaluate((element) => getComputedStyle(element).backgroundImage))
    .toContain("data:image/png;base64,");
  return image.evaluate((element) => {
    const url = getComputedStyle(element).backgroundImage.slice(5, -2);
    return new Promise<{ width: number; height: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = url;
    });
  });
}

// ─── Preview actions ─────────────────────────────────────────────

// The default sprite is 32x32 and the preview area is 200 pixels wide: the sizes are
// 1x (32 pixels), the best zoom 6x (192 pixels) and Full (200 pixels).
test.describe("Preview actions", () => {
  // ─── Size buttons ──────────────────────────────────────────────

  test('should default to "original" preview size', { tag: ['@preview.sizes'] }, async ({ page }) => {
    await openEditor(page);

    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewImageWidth(page, 32);
  });

  test("clicking 1x button should select original size", { tag: ["@preview.sizes"] }, async ({ page }) => {
    // Start from Full.
    await openEditor(page);
    await page.keyboard.press("Alt+3");
    await assertSelectedPreviewSize(page, 'Full');

    await clickPreviewSizeButton(page, "1x");
    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewImageWidth(page, 32);
  });

  test("clicking Full button should select full size", { tag: ["@preview.sizes"] }, async ({ page }) => {
    await openEditor(page);

    await clickPreviewSizeButton(page, "full");
    await assertSelectedPreviewSize(page, 'Full');
    await assertPreviewImageWidth(page, 200);
  });

  test("Alt+1 shortcut should select original size", { tag: ["@preview.sizes"] }, async ({ page }) => {
    // Start from Full.
    await openEditor(page);
    await page.keyboard.press("Alt+3");
    await assertSelectedPreviewSize(page, 'Full');

    await page.keyboard.press("Alt+1");
    await assertSelectedPreviewSize(page, '1x');
    await assertPreviewImageWidth(page, 32);
  });

  test("Alt+2 shortcut should select best size", { tag: ["@preview.sizes"] }, async ({ page }) => {
    await openEditor(page);

    await page.keyboard.press("Alt+2");
    await assertSelectedPreviewSize(page, '6x');
    await assertPreviewImageWidth(page, 192);
  });

  test("Alt+3 shortcut should select full size", { tag: ["@preview.sizes"] }, async ({ page }) => {
    await openEditor(page);

    await page.keyboard.press("Alt+3");
    await assertSelectedPreviewSize(page, 'Full');
    await assertPreviewImageWidth(page, 200);
  });

  // ─── Grid toggle shortcut ─────────────────────────────────────

  test("Alt+G shortcut should toggle grid", { tag: ["@canvas.grid"] }, async ({ page }) => {
    // The grid is off by default: its button is white.
    await openEditor(page);
    const gridButton = testId(page, "grid-toggle-button");
    await expect(gridButton).toHaveClass(/icon-minimap-grid-white/);

    // Alt+G turns it on: the button is gold.
    await page.keyboard.press("Alt+g");
    await expect(gridButton).toHaveClass(/icon-minimap-grid-gold/);
    await expect(gridButton).not.toHaveClass(/icon-minimap-grid-white/);

    // Alt+G turns it off again.
    await page.keyboard.press("Alt+g");
    await expect(gridButton).toHaveClass(/icon-minimap-grid-white/);
    await expect(gridButton).not.toHaveClass(/icon-minimap-grid-gold/);
  });

  // ─── Popup preview ────────────────────────────────────────────

  test("open preview in popup should open a new window with rendered preview", { tag: ["@preview.popup"] }, async ({ page }) => {
    await openEditor(page);

    // The popup shows the 32x32 sprite, zoomed in.
    const popup = await openPopupPreview(page);
    const { width, height } = await readPopupImageSize(popup);
    expect(width).toBeGreaterThan(32);
    expect(height).toBe(width);

    await popup.close();
  });

  test("reloading the editor should close the popup preview", { tag: ["@preview.popup"] }, async ({ page }) => {
    await openEditor(page);
    const popup = await openPopupPreview(page);

    const popupClosed = popup.waitForEvent("close");
    await page.reload();
    await popupClosed;
    expect(popup.isClosed()).toBe(true);
  });

  test("closing the popup preview should allow opening a new one", { tag: ["@preview.popup"] }, async ({ page }) => {
    await openEditor(page);
    const firstPopup = await openPopupPreview(page);
    await firstPopup.close();

    // If the popup closure was not detected, clicking would only try to focus
    // the closed popup instead of opening a new one.
    const secondPopup = await openPopupPreview(page);
    await secondPopup.close();
  });

  test("popup preview should render known pattern as base64 PNG", { tag: ["@preview.popup"] }, async ({ page }) => {
    await openEditor(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // The popup shows the 10x10 sprite at a whole zoom: a square, 10 times the zoom.
    const popup = await openPopupPreview(page);
    const { width, height } = await readPopupImageSize(popup);
    expect(width).toBeGreaterThan(10);
    expect(width % 10).toBe(0);
    expect(height).toBe(width);

    await popup.close();
  });

  // ─── Rendering ────────────────────────────────────────────────

  test("main preview at 1x should render frame as base64 PNG background-image", { tag: ["@preview.playback"] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    await setPiskelFromGrid(page, gridFromRows(L_SHAPE));

    // At 1x, the preview shows the sprite pixel for pixel.
    await assertPreviewPlays(page, [L_SHAPE]);
  });
});

// ─── Animation preview (FPS) ─────────────────────────────────────

test.describe("Animation preview", () => {
  test("should display default FPS on load", { tag: ["@preview.fps"] }, async ({ page }) => {
    await openEditor(page);
    await assertFps(page, 12);
  });

  test("should change FPS via slider", { tag: ["@preview.fps"] }, async ({ page }) => {
    await openEditor(page);
    await setFps(page, 5);
  });

  test("should pause animation when FPS is set to 0", { tag: ["@preview.fps"] }, async ({ page }) => {
    await openEditor(page);
    await setFps(page, 0);
  });

  test("should set FPS to max value", { tag: ["@preview.fps"] }, async ({ page }) => {
    await openEditor(page);
    await setFps(page, 24);
  });

  test("FPS value should be saved in exported .piskel file", { tag: ["@preview.fps-saved"] }, async ({ page }) => {
    // Set a FPS other than the default one, and save the sprite to a file.
    await openEditor(page);
    await setFps(page, 7);
    const piskelPath = await downloadPiskelFile(page);

    expect(await readFpsFromPiskelFile(piskelPath)).toBe(7);
  });
});

// ─── Minimap ─────────────────────────────────────────────────────

/** Press a key three times, and wait for the minimap to move along an axis */
async function panAndAssertMinimapMoves(
  page: Page,
  minimap: Locator,
  key: string,
  axis: "x" | "y",
  direction: "more" | "less"
) {
  const before = (await minimap.boundingBox())![axis];
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press(key);
  }
  const position = async () => (await minimap.boundingBox())?.[axis] ?? before;
  if (direction === "more") {
    await expect.poll(position).toBeGreaterThan(before);
  } else {
    await expect.poll(position).toBeLessThan(before);
  }
}

/** Turn the mouse wheel over the drawing area: up to zoom in, down to zoom out */
async function turnWheel(page: Page, steps: number, direction: "up" | "down") {
  await page.locator("#drawing-canvas-container").hover();
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, direction === "up" ? -120 : 120);
    // Let the app handle each step on its own.
    await page.waitForTimeout(30);
  }
}

test.describe("Minimap", () => {
  test("should not show minimap at default zoom", { tag: ["@preview.minimap"] }, async ({ page }) => {
    await openEditor(page);
    await expect(page.locator(".minimap-crop-frame")).toBeHidden();
  });

  test("should show minimap when zoomed in via scroll wheel", { tag: ["@preview.minimap", "@canvas.wheel-zoom"] }, async ({ page }) => {
    await openEditor(page);
    await zoomInUntilMinimapVisible(page, page.locator(".minimap-crop-frame"));
  });

  test("panning right should increase minimap x position", { tag: ["@preview.minimap", "@canvas.keyboard-pan"] }, async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);

    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowRight", "x", "more");
  });

  test("panning left should decrease minimap x position", { tag: ["@preview.minimap", "@canvas.keyboard-pan"] }, async ({ page }) => {
    // Pan right first, to have room to pan left.
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);
    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowRight", "x", "more");

    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowLeft", "x", "less");
  });

  test("panning down should increase minimap y position", { tag: ["@preview.minimap", "@canvas.keyboard-pan"] }, async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);

    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowDown", "y", "more");
  });

  test("panning up should decrease minimap y position", { tag: ["@preview.minimap", "@canvas.keyboard-pan"] }, async ({ page }) => {
    // Pan down first, to have room to pan up.
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);
    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowDown", "y", "more");

    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowUp", "y", "less");
  });

  test("zooming in more should keep minimap visible and still responsive to pan", { tag: ["@preview.minimap"] }, async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);

    // Zoom in even more: the minimap stays, and still follows the panning.
    await turnWheel(page, 15, "up");
    await expect(minimap).toBeVisible();
    await panAndAssertMinimapMoves(page, minimap, "Shift+ArrowRight", "x", "more");
  });

  test("zooming out partially should grow minimap width or height", { tag: ["@preview.minimap"] }, async ({ page }) => {
    // Zoom in even more, to have room to zoom out.
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);
    await turnWheel(page, 20, "up");
    await expect(minimap).toBeVisible();
    const before = (await minimap.boundingBox())!;

    // Zoom out a bit: the minimap frame grows, as more of the sprite is visible.
    await turnWheel(page, 10, "down");
    await expect.poll(async () => {
      const after = (await minimap.boundingBox())!;
      return after.width > before.width || after.height > before.height;
    }).toBe(true);
    const after = (await minimap.boundingBox())!;
    expect(after.width).toBeGreaterThanOrEqual(before.width);
    expect(after.height).toBeGreaterThanOrEqual(before.height);
  });

  test("zooming out fully should hide the minimap", { tag: ["@preview.minimap"] }, async ({ page }) => {
    await openEditor(page);
    const minimap = page.locator(".minimap-crop-frame");
    await zoomInUntilMinimapVisible(page, minimap);

    // Reset the zoom with 0.
    await page.keyboard.press("0");
    await expect(minimap).toBeHidden();
  });
});

test.describe("Preview with hidden frames", () => {
  test("should show the current frame when every frame is hidden", { tag: ["@preview.all-hidden"] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    await createThreeFrames(page);

    // Hide all the frames.
    await toggleFrameVisibility(page, 0);
    await toggleFrameVisibility(page, 1);
    await toggleFrameVisibility(page, 2);
    await assertHiddenFrames(page, [0, 1, 2]);

    // Select the second frame: the preview only shows it.
    await selectFrame(page, 1);
    await assertPreviewPlays(page, [PIXEL_IN_SECOND_COLUMN]);

    // Select the first frame: the preview follows.
    await selectFrame(page, 0);
    await assertPreviewPlays(page, [PIXEL_IN_FIRST_COLUMN]);
  });
});
