import { Page, expect } from "@playwright/test";
import { decompressFrames, parseGIF } from "gifuct-js";
import fs from "fs/promises";
import os from "os";
import nodePath from "path";
import PNG from "png-ts";

/** The modifier key for keyboard shortcuts: Meta on macOS, Control elsewhere. */
export const CMD_OR_CTRL = os.platform() === "darwin" ? "Meta" : "Control";

/** The modifier label as displayed in the Piskel UI (e.g. cheatsheet): "cmd" on macOS, "ctrl" elsewhere. */
export const MODIFIER_LABEL = os.platform() === "darwin" ? "cmd" : "ctrl";

import { EDITOR_PATH } from "./constants";

// Type declaration for the Piskel global available in the browser context.
// This silences TS errors in page.evaluate() calls that access window.pskl.
declare global {
  interface Window {
    pskl: any;
  }
}

/** Wait for the editor canvas to be ready */
export const waitForEditorReady = async (page: Page) => {
  await page.waitForSelector("#drawing-canvas-container canvas", {
    state: "attached"
  });
};

export const openEditor = async (page: Page) => {
  await page.goto(EDITOR_PATH);
  await waitForEditorReady(page);
};

export async function expectHasClass(
  page: Page,
  selector: string,
  className: string
) {
  const locator = page.locator(selector);
  const hasClass = await locator.evaluate(
    (el, cls) => el.classList.contains(cls),
    className
  );
  expect(hasClass).toBe(true);
}

export async function expectHasNotClass(
  page: Page,
  selector: string,
  className: string
) {
  const locator = page.locator(selector);
  const hasClass = await locator.evaluate(
    (el, cls) => el.classList.contains(cls),
    className
  );
  expect(hasClass).toBe(false);
}

export const setPiskelFromImageSrc = async (
  page: Page,
  base64Image: string
): Promise<void> => {
  return page.evaluate((base64Image) => {
    window.pskl.utils.FrameUtils.createFromImageSrc(
      base64Image,
      false,
      (frame: any) => {
        var layer = window.pskl.model.Layer.fromFrames("Base layer", [frame]);
        var piskel = window.pskl.model.Piskel.fromLayers([layer], 12, {
          name: "piskel",
          description: "description"
        });
        window.pskl.app.piskelController.setPiskel(piskel);
      }
    );
  }, base64Image);
};

type TestColor = "R" | "G" | "B" | "T";
type TestGrid = Array<Array<TestColor>>;

/** Build a test grid from rows where X is a colored pixel and . a transparent one */
export const gridFromRows = (rows: string[]): TestGrid =>
  rows.map((row) => [...row].map((c) => (c === "X" ? "R" : "T")));

export const setPiskelFromGrid = async (
  page: Page,
  grid: TestGrid
): Promise<void> => {
  return page.evaluate((grid) => {
    const convertedGrid: Array<Array<string>> = grid.map((row) =>
      row.map(() => "")
    );
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        switch (grid[i][j]) {
          case "R":
            convertedGrid[i][j] = "#FF0000";
            break;
          case "G":
            convertedGrid[i][j] = "#00FF00";
            break;
          case "B":
            convertedGrid[i][j] = "#0000FF";
            break;
          case "T":
            convertedGrid[i][j] = "rgba(0, 0, 0, 0)";
            break;
        }
      }
    }

    const pixelGrid = window.pskl.utils.FrameUtils.toFrameGrid(convertedGrid);
    const frame = window.pskl.model.Frame.fromPixelGrid(pixelGrid);
    const layer = window.pskl.model.Layer.fromFrames("Base layer", [frame]);
    const piskel = window.pskl.model.Piskel.fromLayers([layer], 12, {
      name: "test",
      description: ""
    });
    window.pskl.app.piskelController.setPiskel(piskel);
  }, grid);
};

export const expectGrid = async (
  page: Page,
  grid: TestGrid,
  layerIndex: number = 0,
  frameIndex: number = 0
): Promise<boolean> => {
  return page.evaluate(
    (param) => {
      const expectedGrid: Array<Array<string>> = param.grid.map((row) =>
        row.map(() => "")
      );
      for (let i = 0; i < param.grid.length; i++) {
        for (let j = 0; j < param.grid[i].length; j++) {
          switch (param.grid[i][j]) {
            case "R":
              expectedGrid[i][j] = "#FF0000";
              break;
            case "G":
              expectedGrid[i][j] = "#00FF00";
              break;
            case "B":
              expectedGrid[i][j] = "#0000FF";
              break;
            case "T":
              expectedGrid[i][j] = "rgba(0, 0, 0, 0)";
              break;
          }
        }
      }

      const piskel = window.pskl.app.piskelController.getPiskel();
      const frame = piskel
        .getLayerAt(param.layerIndex)
        .getFrameAt(param.frameIndex);

      const log: Array<[any, TestColor]> = [];
      let isValid = true;

      frame.forEachPixel((color: any, col: any, row: any) => {
        if (
          window.pskl.utils.colorToInt(color) !==
          window.pskl.utils.colorToInt(expectedGrid[row][col])
        ) {
          log.push([color, param.grid[row][col]]);
        }
        isValid =
          isValid &&
          window.pskl.utils.colorToInt(color) ===
            window.pskl.utils.colorToInt(expectedGrid[row][col]);
      });
      return isValid;
    },
    { grid, layerIndex, frameIndex }
  );
};

export const isResizeDrawerCollapsed = async (page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
    const settingsElement = document.querySelector(
      '[data-pskl-controller="settings"]'
    );
    return !!settingsElement && settingsElement.classList.contains("expanded");
  });
};

export const getCurrentPiskelWidth = async (page: Page): Promise<number> => {
  return await page.evaluate(() => {
    return window.pskl.app.piskelController.getPiskel().getWidth();
  });
};

export const getCurrentPiskelHeight = async (page: Page): Promise<number> => {
  return await page.evaluate(() => {
    return window.pskl.app.piskelController.getPiskel().getHeight();
  });
};

export const getCurrentPiskelFrameCount = async (
  page: Page
): Promise<number> => {
  return await page.locator('[data-test-id="frame-tile"]').count();
};

export const getCurrentPiskelLayerCount = async (
  page: Page
): Promise<number> => {
  return await page.locator('[data-test-id="layer-item"]').count();
};

export const getCurrentPiskelColorCount = async (
  page: Page
): Promise<number> => {
  return await page.locator(".palettes-list-color").count();
};

export const isCurrentPiskelEmpty = async (page: Page): Promise<boolean> => {
  // Check if all palette colors show only transparent (no drawn colors)
  const colorCount = await page
    .locator('.palettes-list-color:not([data-color="TRANSPARENT"])')
    .count();
  return colorCount === 0;
};

export const isSettingsDrawerExpanded = async (
  page: Page
): Promise<boolean> => {
  return await page.evaluate(() => {
    const settingsElement = document.querySelector(
      '[data-pskl-controller="settings"]'
    );
    return !!settingsElement && settingsElement.classList.contains("expanded");
  });
};

export const openResizeSettingsPanel = async (page: Page): Promise<void> => {
  await page.click('[data-setting="resize"]');
  await expect(page.locator(".settings-section-resize")).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
  await expect(page.locator(".settings-section-resize")).toBeAttached();
};

export const openImportSettingsPanel = async (page: Page): Promise<void> => {
  await page.click('[data-setting="import"]');
  await expect(page.locator(".settings-section-import")).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
  await expect(page.locator(".settings-section-import")).toBeAttached();
};

export const openExportSettingsPanel = async (page: Page): Promise<void> => {
  await page.click('[data-setting="export"]');
  await expect(page.locator(".settings-section-export")).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
  await expect(page.locator(".settings-section-export")).toBeAttached();
};

export const expectResizeValues = async (
  page: Page,
  expectedWidth: string,
  expectedHeight: string
): Promise<void> => {
  const widthInputLocator = page.locator('[name="resize-width"]');
  const heightInputLocator = page.locator('[name="resize-height"]');
  await expect(widthInputLocator).toBeAttached();
  await expect(heightInputLocator).toBeAttached();

  await expect(widthInputLocator).toHaveValue(expectedWidth);
  await expect(heightInputLocator).toHaveValue(expectedHeight);
};

export const expectDefaultResizeValues = async (
  page: Page,
  expectedWidth: string,
  expectedHeight: string
): Promise<void> => {
  const defaultWidthInputLocator = page.locator('[name="default-width"]');
  const defaultHeightInputLocator = page.locator('[name="default-height"]');
  await expect(defaultWidthInputLocator).toBeAttached();
  await expect(defaultHeightInputLocator).toBeAttached();

  await expect(defaultWidthInputLocator).toHaveValue(expectedWidth);
  await expect(defaultHeightInputLocator).toHaveValue(expectedHeight);
};

export const openSaveSettingsPanel = async (page: Page): Promise<void> => {
  await page.click('[data-setting="save"]');
  await expect(page.locator(".settings-section-save")).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
};

/** data-test-id locator shorthand */
export const testId = (page: Page, id: string) =>
  page.locator(`[data-test-id="${id}"]`);

/** Locator for all frame tiles in the timeline */
export const getFrameTiles = (page: Page) => testId(page, "frame-tile");

/** Locator for the "Add new frame" button */
export const getAddFrameButton = (page: Page) =>
  testId(page, "add-frame-button");

/** Locator for the "Add layer" button */
export const getAddLayerButton = (page: Page) =>
  testId(page, "layer-add-button");

/** Locator for all layer items in the layers panel */
export const getLayerItems = (page: Page) => testId(page, "layer-item");

/** Locator for all layer name elements in the layers panel */
export const getLayerNameLocators = (page: Page) => testId(page, "layer-name");

/** Locator for the "Move layer up" button */
export const getMoveLayerUpButton = (page: Page) =>
  testId(page, "layer-move-up-button");

/** Locator for the "Move layer down" button */
export const getMoveLayerDownButton = (page: Page) =>
  testId(page, "layer-move-down-button");

/** Locator for the "Merge layer down" button */
export const getMergeLayerButton = (page: Page) =>
  testId(page, "layer-merge-button");

/** Locator for the "Delete layer" button */
export const getDeleteLayerButton = (page: Page) =>
  testId(page, "layer-delete-button");

/** Locator for all layer opacity (α) buttons */
export const getAllLayerOpacityButtons = (page: Page) =>
  testId(page, "layer-opacity");

/** Locator for a pen size option button (1-4) */
export const getPenSizeButton = (page: Page, size: number) =>
  testId(page, `pen-size-${size}`);

/** Get the currently selected pen size from the DOM (.selected class on pen-size-option) */
export const getSelectedPenSize = async (page: Page): Promise<number> => {
  const selected = page.locator(".pen-size-option.selected");
  const size = await selected.getAttribute("data-size");
  return parseInt(size ?? "1", 10);
};

/**
 * Convert a hex color string to Piskel's ABGR integer format.
 * Matches the format returned by getPixelColor().
 * Transparent (alpha=0) maps to 0.
 */
export const colorToInt = (hex: string): number => {
  // Remove # prefix
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const a = 255;
  return ((a << 24) >>> 0) + (b << 16) + (g << 8) + r;
};

/** Transparent pixel value (alpha=0) */
export const TRANSPARENT = 0;

/** Click a tool by its tool id (e.g. "tool-pen", "tool-eraser") */
export const clickTool = async (page: Page, toolId: string): Promise<void> => {
  await page.click(`[data-tool-id="${toolId}"]`);
  await expect(page.locator(`[data-tool-id="${toolId}"]`)).toHaveClass(
    /selected/
  );
};

/** Get the currently selected tool id from the DOM (.selected class) */
export const getSelectedToolId = async (page: Page): Promise<string> => {
  const selected = page.locator("[data-tool-id].selected");
  return (await selected.getAttribute("data-tool-id")) ?? "";
};

/**
 * Draw a pixel at (col, row) by performing a real mouse click on the canvas.
 * Uses renderer.reverseCoordinates as a coordinate bridge, but the actual
 * drawing goes through the full mouse event pipeline.
 * Waits for renderer layout to settle before computing coordinates.
 */
export const drawAtPixel = async (
  page: Page,
  col: number,
  row: number
): Promise<void> => {
  // Wait for any pending relayout (DrawingController uses setTimeout(200) for relayout)
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 200)));
  const coords = await page.evaluate(
    ({ col, row }) => {
      // reverseCoordinates already adds cellSize/2 to center within the pixel
      return window.pskl.app.drawingController.getScreenCoordinates(col, row);
    },
    { col, row }
  );
  await page.mouse.click(coords.x, coords.y);
};

/**
 * Get the color at (col, row) on a given frame by reading the frame tile
 * canvas pixel data from the DOM. Returns the RGBA as a 32-bit integer.
 * Note: This reads from the model as there is no DOM representation of
 * individual pixel colors at arbitrary layer/frame indices.
 */
export const getPixelColor = async (
  page: Page,
  col: number,
  row: number,
  layerIndex = 0,
  frameIndex = 0
): Promise<number> => {
  return await page.evaluate(
    ({ col, row, layerIndex, frameIndex }) => {
      const piskel = window.pskl.app.piskelController.getPiskel();
      const frame = piskel.getLayerAt(layerIndex).getFrameAt(frameIndex);
      return frame.getPixel(col, row);
    },
    { col, row, layerIndex, frameIndex }
  );
};

/** Get all displayed palette swatch colors as a sorted array of hex strings */
export const getPaletteColors = async (page: Page): Promise<string[]> => {
  const colors = await page
    .locator(".palettes-list-color")
    .evaluateAll((els) =>
      els
        .map((el) => el.getAttribute("data-color") ?? "")
        .filter((c) => c !== "")
    );
  return colors.sort();
};

/**
 * Read the current frame as a 2D grid of single-char strings.
 * "X" = any non-transparent pixel, "." = transparent.
 * Useful for asserting shapes drawn on canvas.
 *
 * Example output for a 4x4 canvas with a 2x2 block at (1,1):
 * [
 *   [".", ".", ".", "."],
 *   [".", "X", "X", "."],
 *   [".", "X", "X", "."],
 *   [".", ".", ".", "."],
 * ]
 */
export const readPixelGrid = async (
  page: Page,
  width: number,
  height: number,
  layerIndex = 0,
  frameIndex = 0
): Promise<string[][]> => {
  return await page.evaluate(
    ({ width, height, layerIndex, frameIndex }) => {
      const piskel = window.pskl.app.piskelController.getPiskel();
      const frame = piskel.getLayerAt(layerIndex).getFrameAt(frameIndex);
      const grid: string[][] = [];
      for (let y = 0; y < height; y++) {
        const row: string[] = [];
        for (let x = 0; x < width; x++) {
          row.push(frame.getPixel(x, y) === 0 ? "." : "X");
        }
        grid.push(row);
      }
      return grid;
    },
    { width, height, layerIndex, frameIndex }
  );
};

/**
 * Read a frame as one string per row, to compare with an ASCII art grid.
 * "X" is a colored pixel and "." a transparent one, see readPixelGrid.
 */
export const readPixelRows = async (
  page: Page,
  width: number,
  height: number,
  layerIndex = 0,
  frameIndex = 0
): Promise<string[]> => {
  const grid = await readPixelGrid(page, width, height, layerIndex, frameIndex);
  return grid.map((row) => row.join(""));
};

/**
 * Drag from sprite pixel (x1,y1) to (x2,y2) via real mouse events.
 * Waits for any pending relayout before computing coordinates (same as drawAtPixel).
 */
export const dragBetweenPixels = async (
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: { steps?: number }
): Promise<void> => {
  const steps = options?.steps ?? 5;
  // Wait for any pending relayout (DrawingController uses setTimeout(200) for relayout)
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 210)));
  const start = await page.evaluate(
    ({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row),
    { col: x1, row: y1 }
  );
  const end = await page.evaluate(
    ({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row),
    { col: x2, row: y2 }
  );
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps });
  await page.mouse.up();
};

/**
 * Decode a PNG data URL via browser canvas and return pixel data.
 * Use this instead of comparing raw base64 strings, which vary across Chrome versions.
 */
export const decodePngDataUrl = async (
  page: Page,
  dataUrl: string
): Promise<{ width: number; height: number; pixels: number[][] }> => {
  return page.evaluate(async (src: string) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, img.width, img.height).data;
    const pixels: number[][] = [];
    for (let i = 0; i < d.length; i += 4)
      pixels.push([d[i], d[i + 1], d[i + 2], d[i + 3]]);
    return { width: img.width, height: img.height, pixels };
  }, dataUrl);
};

/** Simple async delay. Use sparingly — prefer waitFor for state checks. */
export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Generic poll helper. Retries `fn` every `interval` ms until it returns true.
 * Fails after `timeout` ms. Use for any async state that needs time to settle.
 *
 * Example: await waitFor(async () => (await getPixelColor(page, 0, 0)) === TRANSPARENT);
 */
export const waitFor = async (
  fn: () => Promise<boolean>,
  {
    timeout = 5000,
    interval = 100,
    message
  }: { timeout?: number; interval?: number; message?: string } = {}
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  if (!(await fn())) {
    throw new Error(message ?? `waitFor: condition not met after ${timeout}ms`);
  }
};

/**
 * Poll until a specific pixel reaches the expected color.
 * Use after drawing operations to avoid reading stale model state.
 */
export const waitForPixelUpdate = async (
  page: Page,
  col: number,
  row: number,
  expectedColor: number,
  {
    timeout = 2000,
    interval = 50,
    layerIndex = 0,
    frameIndex = 0
  }: {
    timeout?: number;
    interval?: number;
    layerIndex?: number;
    frameIndex?: number;
  } = {}
): Promise<void> => {
  await waitFor(
    async () =>
      (await getPixelColor(page, col, row, layerIndex, frameIndex)) ===
      expectedColor,
    {
      timeout,
      interval,
      message: `Pixel (${col},${row}) did not reach expected color within ${timeout}ms`
    }
  );
};

/**
 * Poll until the pixel grid matches the expected pattern.
 * Replaces immediate readPixelGrid + expect for flake-free shape verification.
 */
export const waitForGrid = async (
  page: Page,
  width: number,
  height: number,
  expectedGrid: string[],
  {
    layerIndex = 0,
    frameIndex = 0,
    timeout = 2000,
    interval = 50
  }: {
    layerIndex?: number;
    frameIndex?: number;
    timeout?: number;
    interval?: number;
  } = {}
): Promise<void> => {
  let lastGrid: string[] = [];
  await waitFor(
    async () => {
      const grid = await readPixelGrid(
        page,
        width,
        height,
        layerIndex,
        frameIndex
      );
      lastGrid = grid.map((r) => r.join(""));
      return lastGrid.join("\n") === expectedGrid.join("\n");
    },
    {
      timeout,
      interval,
      message: `Grid did not match expected pattern within ${timeout}ms.\nExpected:\n${expectedGrid.join("\n")}\nGot:\n${lastGrid.join("\n")}`
    }
  );
};

/**
 * Set primary color via the Spectrum color picker UI.
 * Opens the picker, types the color in the input, and closes it.
 */
export const setPrimaryColor = async (
  page: Page,
  color: string
): Promise<void> => {
  // Remove any lingering tooltips that might block clicks
  await page.evaluate(() =>
    document.querySelectorAll(".tooltip").forEach((t) => t.remove())
  );
  const replacer = page
    .locator('[data-test-id="primary-color-picker"]')
    .locator("..")
    .locator(".sp-replacer");
  await replacer.click();
  const container = page.locator(".sp-container:not(.sp-hidden)");
  await expect(container).toBeVisible();
  const input = container.locator(".sp-input");
  await input.fill(color);
  await input.press("Enter");
  // Dismiss the picker via Spectrum's hide API and restore keyboard focus
  await page.evaluate((selector) => {
    const $ = (window as any).$;
    $(selector).spectrum("hide");
    (document.activeElement as HTMLElement)?.blur();
  }, '[data-test-id="primary-color-picker"]');
};

/**
 * Set secondary color via the Spectrum color picker UI.
 */
export const setSecondaryColor = async (
  page: Page,
  color: string
): Promise<void> => {
  await page.evaluate(() =>
    document.querySelectorAll(".tooltip").forEach((t) => t.remove())
  );
  const replacer = page
    .locator('[data-test-id="secondary-color-picker"]')
    .locator("..")
    .locator(".sp-replacer");
  await replacer.click();
  const container = page.locator(".sp-container:not(.sp-hidden)");
  await expect(container).toBeVisible();
  const input = container.locator(".sp-input");
  await input.fill(color);
  await input.press("Enter");
  await page.evaluate((selector) => {
    const $ = (window as any).$;
    $(selector).spectrum("hide");
    (document.activeElement as HTMLElement)?.blur();
  }, '[data-test-id="secondary-color-picker"]');
};

/**
 * Get the current primary color by reading the Spectrum preview background.
 * Uses jQuery Spectrum's get() API via the DOM since the preview-inner
 * background update can lag behind the model.
 */
export const getPrimaryColor = async (page: Page): Promise<string> => {
  return await page.evaluate(() => {
    const el = document.querySelector(
      '[data-test-id="primary-color-picker"]'
    ) as HTMLInputElement;
    const color = (window as any).$(el).spectrum("get");
    if (!color || color.getAlpha() === 0) {
      return "rgba(0, 0, 0, 0)";
    }
    return color.toHexString();
  });
};

/**
 * Get the current secondary color by reading the Spectrum picker value.
 */
export const getSecondaryColor = async (page: Page): Promise<string> => {
  return await page.evaluate(() => {
    const el = document.querySelector(
      '[data-test-id="secondary-color-picker"]'
    ) as HTMLInputElement;
    const color = (window as any).$(el).spectrum("get");
    if (!color || color.getAlpha() === 0) {
      return "rgba(0, 0, 0, 0)";
    }
    return color.toHexString();
  });
};

/**
 * Get the name of the layer at given index by reading from the DOM.
 * Layers are rendered in reverse order in the DOM (top layer first),
 * so index 0 (bottom) is the last item.
 */
export const getLayerName = async (
  page: Page,
  index: number
): Promise<string> => {
  // Get total layer count from DOM
  const count = await page.locator('[data-test-id="layer-item"]').count();
  // DOM order is reversed: layer index 0 is at position (count - 1) in DOM
  const domPosition = count - 1 - index;
  return await page
    .locator('[data-test-id="layer-name"]')
    .nth(domPosition)
    .innerText();
};

/** Get the current layer index from the DOM (.current-layer-item class) */
export const getCurrentLayerIndex = async (page: Page): Promise<number> => {
  const current = page.locator(".current-layer-item");
  const indexStr = await current.getAttribute("data-layer-index");
  return parseInt(indexStr ?? "0", 10);
};

/**
 * Get the current frame index from the DOM (.preview-tile.selected).
 * Waits briefly for the render loop to update the .selected class.
 */
export const getCurrentFrameIndex = async (page: Page): Promise<number> => {
  // The FramesListController updates .selected in its render() cycle,
  // which is async (requestAnimationFrame). Wait for one animation frame.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(resolve))
  );
  const selected = page.locator(".preview-tile.selected");
  const indexStr = await selected.getAttribute("data-tile-number");
  return parseInt(indexStr ?? "0", 10);
};

/** Check how many frames are in the frames list, waiting for it to update */
export const assertFrameCount = async (
  page: Page,
  count: number
): Promise<void> => {
  await expect(getFrameTiles(page)).toHaveCount(count);
};

/** Check which frame is current, waiting for the frames list to update */
export const assertCurrentFrame = async (
  page: Page,
  frameIndex: number
): Promise<void> => {
  await expect.poll(() => getCurrentFrameIndex(page)).toBe(frameIndex);
};

/** Check which layer is current, waiting for the layers list to update */
export const assertCurrentLayer = async (
  page: Page,
  layerIndex: number
): Promise<void> => {
  await expect.poll(() => getCurrentLayerIndex(page)).toBe(layerIndex);
};

/** Click a frame in the frames list */
export const selectFrame = async (
  page: Page,
  frameIndex: number
): Promise<void> => {
  await getFrameTiles(page).nth(frameIndex).click();
  await assertCurrentFrame(page, frameIndex);
};

/** Click the bottom layer, which is the last one of the layers list */
export const selectBottomLayer = async (page: Page): Promise<void> => {
  await getLayerItems(page).last().click();
  await assertCurrentLayer(page, 0);
};

/** Open the editor in a new page of the same browser, as a new session would */
export const openEditorInNewPage = async (page: Page): Promise<Page> => {
  const newPage = await page.context().newPage();
  await openEditor(newPage);
  return newPage;
};

/** Create a 4x4 sprite: a layer with a pixel at (0,0), below an empty current layer */
export const createEmptyLayerAbovePixel = async (page: Page): Promise<void> => {
  await setPiskelFromGrid(
    page,
    gridFromRows(["X...", "....", "....", "...."])
  );
  await getAddLayerButton(page).click();
  await assertCurrentLayer(page, 1);
};

/** Check the names shown in the layers list, from top to bottom */
export const assertLayerNames = async (
  page: Page,
  names: string[]
): Promise<void> => {
  await expect(getLayerNameLocators(page)).toHaveText(names);
};

/** Shift+click on the add button, which duplicates the current layer */
export const duplicateCurrentLayer = async (page: Page): Promise<void> => {
  await getAddLayerButton(page).click({ modifiers: ["Shift"] });
};

/** Rename the current layer with the edit button */
export const renameCurrentLayer = async (
  page: Page,
  name: string
): Promise<void> => {
  await testId(page, "layer-edit-button").click();
  const input = testId(page, "layer-name-input");
  await input.fill(name);
  await input.press("Enter");
};

/** Click the eye icon at the top of the layers list */
export const toggleLayerPreview = async (page: Page): Promise<void> => {
  await testId(page, "layer-preview-toggle").click();
};

/** Check whether layer preview is on, from the eye icon of the layers list */
export const assertLayerPreviewEnabled = async (
  page: Page,
  enabled: boolean
): Promise<void> => {
  const toggle = testId(page, "layer-preview-toggle");
  if (enabled) {
    await expect(toggle).toHaveClass(/layers-toggle-preview-enabled/);
  } else {
    await expect(toggle).not.toHaveClass(/layers-toggle-preview-enabled/);
  }
};

/** Open or close the preferences drawer, on the Misc tab by default */
const togglePreferencesPanel = async (page: Page): Promise<void> => {
  await page.click('[data-setting="user"]');
};

/**
 * Set the opacity of layer preview with the slider labelled "Layer opacity" in
 * the preferences, then close the drawer.
 */
export const setLayerPreviewOpacity = async (
  page: Page,
  opacity: number
): Promise<void> => {
  await togglePreferencesPanel(page);
  await page.locator(".layer-opacity-input").fill(String(opacity));
  await togglePreferencesPanel(page);
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
};

/** Check the value next to the slider labelled "Layer opacity" in the preferences */
export const assertLayerPreviewOpacity = async (
  page: Page,
  opacity: string
): Promise<void> => {
  await togglePreferencesPanel(page);
  await expect(page.locator(".layer-opacity-text")).toHaveText(opacity);
  await togglePreferencesPanel(page);
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
};

/** Delete a frame with the delete action of its tile */
export const deleteFrame = async (
  page: Page,
  frameIndex: number
): Promise<void> => {
  await getFrameTiles(page).nth(frameIndex).hover();
  await testId(page, "delete-frame-button").nth(frameIndex).click();
};

/** Click the number of a frame, which shows or hides it in the preview */
export const toggleFrameVisibility = async (
  page: Page,
  frameIndex: number
): Promise<void> => {
  await testId(page, "toggle-frame-button").nth(frameIndex).click();
};

/** Check which frames are hidden, waiting for the frames list to update */
export const assertHiddenFrames = async (
  page: Page,
  frameIndexes: number[]
): Promise<void> => {
  await expect
    .poll(() =>
      testId(page, "toggle-frame-button").evaluateAll((buttons) =>
        buttons.flatMap((button, index) =>
          button.classList.contains("toggled") ? [] : [index]
        )
      )
    )
    .toEqual(frameIndexes);
};

/** Check the numbers shown on the frame tiles, from top to bottom */
export const assertFrameNumbers = async (
  page: Page,
  numbers: string[]
): Promise<void> => {
  await expect(testId(page, "toggle-frame-button")).toHaveText(numbers);
};

/**
 * Check the thumbnail of a frame tile against an ASCII art grid, waiting for
 * the frames list to update. "X" is a colored pixel, "." a transparent one.
 */
export const assertFrameThumbnail = async (
  page: Page,
  frameIndex: number,
  rows: string[]
): Promise<void> => {
  const canvas = getFrameTiles(page).nth(frameIndex).locator("canvas");
  await expect
    .poll(() =>
      canvas.evaluate(
        (canvas: HTMLCanvasElement, { width, height }) => {
          const context = canvas.getContext("2d")!;
          const cellWidth = canvas.width / width;
          const cellHeight = canvas.height / height;
          return Array.from({ length: height }, (_, row) =>
            Array.from({ length: width }, (_, col) => {
              const alpha = context.getImageData(
                (col + 0.5) * cellWidth,
                (row + 0.5) * cellHeight,
                1,
                1
              ).data[3];
              return alpha === 0 ? "." : "X";
            }).join("")
          );
        },
        { width: rows[0].length, height: rows.length }
      )
    )
    .toEqual(rows);
};

/** Download the sprite as a .piskel file and return the path of the file */
export const downloadPiskelFile = async (page: Page): Promise<string> => {
  await openSaveSettingsPanel(page);
  const downloadPromise = page.waitForEvent("download");
  await testId(page, "save-file-download-button").click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  const piskelPath = nodePath.join(
    nodePath.dirname(downloadPath),
    "sprite.piskel"
  );
  await fs.copyFile(downloadPath, piskelPath);
  // A successful save closes the drawer
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
  return piskelPath;
};

/** Replace the sprite with a .piskel file, using the import wizard */
export const importPiskelFile = async (
  page: Page,
  piskelPath: string
): Promise<void> => {
  await openImportSettingsPanel(page);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await testId(page, "import-piskel-button").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(piskelPath);
  await page.waitForSelector(".current-step .import-mode", {
    state: "attached"
  });
  // Accept the confirmation to replace the current sprite
  page.once("dialog", (dialog) => dialog.accept());
  await page.click(".import-mode-replace-button");
  await page.waitForSelector("#dialog-container-wrapper:not(.show)", {
    state: "attached"
  });
};

export const PIXEL_IN_FIRST_COLUMN = ["X...", "....", "....", "...."];
export const PIXEL_IN_SECOND_COLUMN = [".X..", "....", "....", "...."];
export const PIXEL_IN_THIRD_COLUMN = ["..X.", "....", "....", "...."];

/** Create a 4x4 sprite with three frames, each with a pixel in a different column */
export const createThreeFrames = async (page: Page): Promise<void> => {
  await setPiskelFromGrid(
    page,
    gridFromRows(["....", "....", "....", "...."])
  );
  await clickTool(page, "tool-pen");

  // Draw in the first frame.
  await drawAtPixel(page, 0, 0);
  expect(await readPixelRows(page, 4, 4, 0, 0)).toEqual(PIXEL_IN_FIRST_COLUMN);

  // Add a second frame and draw in it.
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 2);
  await drawAtPixel(page, 1, 0);
  expect(await readPixelRows(page, 4, 4, 0, 1)).toEqual(PIXEL_IN_SECOND_COLUMN);

  // Add a third frame and draw in it.
  await getAddFrameButton(page).click();
  await assertFrameCount(page, 3);
  await drawAtPixel(page, 2, 0);
  expect(await readPixelRows(page, 4, 4, 0, 2)).toEqual(PIXEL_IN_THIRD_COLUMN);
};

/** Select a tab of the export drawer: "gif", "png", "zip" or "misc" */
export const selectExportTab = async (
  page: Page,
  tabId: string
): Promise<void> => {
  const tab = testId(page, `export-tab-${tabId}`);
  await tab.click();
  await expect(tab).toHaveClass(/selected/);
};

/** Type a resolution in the width input of the export drawer */
export const setExportWidth = async (
  page: Page,
  width: number
): Promise<void> => {
  await testId(page, "export-width-input").fill(String(width));
};

/** Set the opacity of the top layer, answering the prompt of the opacity button */
export const setTopLayerOpacity = async (
  page: Page,
  opacity: number
): Promise<void> => {
  page.once("dialog", (dialog) => dialog.accept(String(opacity)));
  await getAllLayerOpacityButtons(page).first().click();
};

/**
 * Letter for a color in the ASCII art grid of an exported image: "." is a
 * transparent pixel, and "?" any color without a letter.
 */
const getColorLetter = (r: number, g: number, b: number): string => {
  const letters: Record<string, string> = {
    "255,0,0": "R",
    "0,255,0": "G",
    "0,0,255": "B",
    "0,0,0": "K",
    "255,255,0": "Y"
  };
  return letters[`${r},${g},${b}`] ?? "?";
};

const saveDownload = async (page: Page, click: () => Promise<void>) => {
  const downloadPromise = page.waitForEvent("download");
  await click();
  const download = await downloadPromise;
  return await fs.readFile(await download.path());
};

/**
 * Download the PNG spritesheet from the export drawer. Its pixels are returned
 * as an ASCII art grid, and as exact [r, g, b, a] values with rgbaAt.
 */
export const downloadPngExport = async (page: Page) => {
  await selectExportTab(page, "png");
  const file = await saveDownload(page, () =>
    testId(page, "png-download-button").click()
  );
  const png = new PNG(file);
  const pixels = png.decodePixels();
  const rgbaAt = (x: number, y: number) => {
    const i = (y * png.width + x) * 4;
    return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
  };
  const rows = Array.from({ length: png.height }, (_, y) =>
    Array.from({ length: png.width }, (_, x) => {
      const [r, g, b, a] = rgbaAt(x, y);
      if (a === 0) return ".";
      return a === 255 ? getColorLetter(r, g, b) : "?";
    }).join("")
  );
  return { width: png.width, height: png.height, rows, rgbaAt };
};

/**
 * Download the animated GIF from the export drawer. Each of its frames is
 * returned as an ASCII art grid, where "." is the transparent color of the GIF.
 * rgbAt gives the exact color of a pixel of a frame.
 */
export const downloadGifExport = async (page: Page) => {
  await selectExportTab(page, "gif");
  const file = await saveDownload(page, () =>
    testId(page, "gif-download-button").click()
  );
  const gifFrames = decompressFrames(parseGIF(file as any), true);
  const { width, height } = gifFrames[0].dims;
  const isTransparent = (frameIndex: number, x: number, y: number) => {
    const frame = gifFrames[frameIndex];
    return frame.pixels[y * width + x] === frame.transparentIndex;
  };
  const rgbAt = (frameIndex: number, x: number, y: number) => {
    const frame = gifFrames[frameIndex];
    return frame.colorTable[frame.pixels[y * width + x]];
  };
  const frames = gifFrames.map((_, frameIndex) =>
    Array.from({ length: height }, (_, y) =>
      Array.from({ length: width }, (_, x) => {
        if (isTransparent(frameIndex, x, y)) return ".";
        const [r, g, b] = rgbAt(frameIndex, x, y);
        return getColorLetter(r, g, b);
      }).join("")
    )
  );
  const hasTransparentColor = gifFrames.every(
    (frame) => frame.transparentIndex !== undefined && frame.transparentIndex >= 0
  );
  return { width, height, frames, hasTransparentColor, rgbAt };
};

/**
 * Open the editor with a clock the test can control. Required by
 * assertPreviewPlays, as the clock has to be installed before the page loads.
 */
export const openEditorWithFakeClock = async (page: Page): Promise<void> => {
  await page.clock.install();
  await openEditor(page);
};

/** Decode the image shown by the animated preview */
const readPreviewImage = async (page: Page) => {
  const backgroundImage = await page
    .locator("#animated-preview-container .background-image-frame-container")
    .evaluate((element) => getComputedStyle(element).backgroundImage);
  const dataUrl = backgroundImage.slice(5, -2); // strip url(" and ")
  return await decodePngDataUrl(page, dataUrl);
};

/** Read the image shown by the animated preview as an ASCII art grid */
const readPreviewFrame = async (page: Page): Promise<string[]> => {
  const { width, height, pixels } = await readPreviewImage(page);
  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) =>
      pixels[row * width + col][3] === 0 ? "." : "X"
    ).join("")
  );
};

/**
 * Check which frames the animated preview plays, whatever their order. Steps
 * through two loops of the animation with the fake clock, without waiting for
 * them in real time. The test has to use openEditorWithFakeClock.
 */
export const assertPreviewPlays = async (
  page: Page,
  frames: string[][]
): Promise<void> => {
  // At 1x, each image of the preview has the size of the sprite.
  await page.keyboard.press("Alt+1");
  await expect
    .poll(async () => (await readPreviewFrame(page))[0].length)
    .toBe(frames[0][0].length);

  const fps = parseInt(await testId(page, "fps-display").innerText(), 10);
  const frameCount = await getFrameTiles(page).count();

  // Read the preview twice per frame, to be sure not to miss any.
  const pageTime = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(pageTime + 1000);
  const playedFrames = new Set<string>();
  for (let step = 0; step < 2 * 2 * frameCount; step++) {
    await page.clock.runFor(Math.ceil(1000 / fps / 2));
    playedFrames.add((await readPreviewFrame(page)).join("\n"));
  }
  await page.clock.resume();

  expect([...playedFrames].sort()).toEqual(
    frames.map((frame) => frame.join("\n")).sort()
  );
};

/**
 * Screenshot the drawing canvas once it stopped changing, as it is laid out again
 * shortly after the sprite changes (DrawingController uses setTimeout(200)).
 */
export const screenshotSettledCanvas = async (page: Page): Promise<Buffer> => {
  const canvas = testId(page, "drawing-canvas");
  let screenshot = await canvas.screenshot();
  await expect
    .poll(async () => {
      await wait(300);
      const previous = screenshot;
      screenshot = await canvas.screenshot();
      return screenshot.equals(previous);
    })
    .toBe(true);
  return screenshot;
};

/**
 * Check how opaque (0 to 1) a pixel of a non-current layer looks on the canvas,
 * waiting for the canvas to update. Layer preview draws these layers on their own
 * canvases, with the layer's opacity in the pixels and the preference in the CSS.
 */
export const assertOtherLayerOpacityOnCanvas = async (
  page: Page,
  col: number,
  row: number,
  opacity: number
): Promise<void> => {
  await expect
    .poll(async () => {
      const visibleOpacity = await page.evaluate(
        ({ col, row }) => {
          const { x, y } =
            window.pskl.app.drawingController.getScreenCoordinates(col, row);
          const canvases = Array.from(
            document.querySelectorAll<HTMLCanvasElement>(".layers-canvas")
          );
          return Math.max(
            ...canvases.map((canvas) => {
              const { left, top } = canvas.getBoundingClientRect();
              const alpha = canvas
                .getContext("2d")!
                .getImageData(Math.floor(x - left), Math.floor(y - top), 1, 1)
                .data[3];
              return (alpha / 255) * Number(getComputedStyle(canvas).opacity);
            })
          );
        },
        { col, row }
      );
      return Math.abs(visibleOpacity - opacity) <= 0.01;
    })
    .toBe(true);
};

/**
 * Check that a pixel of a non-current layer is hidden on the canvas. It is also
 * hidden before the canvas renders, so wait for the canvas to settle first.
 */
export const assertOtherLayerHiddenOnCanvas = async (
  page: Page,
  col: number,
  row: number
): Promise<void> => {
  await screenshotSettledCanvas(page);
  await assertOtherLayerOpacityOnCanvas(page, col, row, 0);
};

/**
 * Check the alpha (0 to 255) of a pixel of the animated preview, waiting for the
 * preview to update. Allows for the rounding of the browser's canvas.
 */
export const assertPreviewPixelAlpha = async (
  page: Page,
  col: number,
  row: number,
  alpha: number
): Promise<void> => {
  // At 1x, each pixel of the sprite is one pixel of the preview.
  await page.keyboard.press("Alt+1");
  const spriteWidth = await getCurrentPiskelWidth(page);
  await expect
    .poll(async () => {
      const { width, pixels } = await readPreviewImage(page);
      return width === spriteWidth
        ? Math.abs(pixels[row * width + col][3] - alpha) <= 2
        : false;
    })
    .toBe(true);
};

/**
 * Lower the size of the undo history, to fill it with a few changes only.
 * When the history is full, the oldest states are dropped up to the first
 * snapshot, so the snapshot period has to be lower than the maximum.
 */
export const setUndoHistoryLimit = async (
  page: Page,
  maxStates: number,
  snapshotPeriod: number
): Promise<void> => {
  await page.evaluate(
    ({ maxStates, snapshotPeriod }) => {
      const { HistoryService } = window.pskl.service;
      HistoryService.MAX_SAVED_STATES = maxStates;
      HistoryService.SNAPSHOT_PERIOD = snapshotPeriod;
    },
    { maxStates, snapshotPeriod }
  );
};

/** Trigger undo via keyboard */
export const undo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+z`);
};

/** Trigger redo via keyboard */
export const redo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+y`);
};
