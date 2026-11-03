import { Locator, Page, expect } from "@playwright/test";
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

/** Set the default size of new sprites in the resize panel, which closes the drawer */
export const setDefaultSize = async (
  page: Page,
  width: string,
  height: string
): Promise<void> => {
  await openResizeSettingsPanel(page);
  await page.locator('[name="default-width"]').fill(width);
  await page.locator('[name="default-height"]').fill(height);
  await page.click(".default-size-button");
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
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
  return await downloadPiskelFileFromSavePanel(page);
};

/** Same as downloadPiskelFile, when the save panel is already open */
export const downloadPiskelFileFromSavePanel = async (
  page: Page
): Promise<string> => {
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
  return { file, width, height, frames, hasTransparentColor, rgbAt };
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

/** Zoom in by scrolling on the canvas until the minimap appears */
export const zoomInUntilMinimapVisible = async (
  page: Page,
  minimap: Locator
): Promise<void> => {
  const canvas = page.locator("#drawing-canvas-container");
  await canvas.hover();

  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(30);
  }

  await waitFor(async () => await minimap.isVisible());
};

/**
 * Read a pixel from the onion-skin-canvas at sprite coordinates (col, row).
 * Accounts for the renderer margin that centers the sprite in the display area.
 * Returns {r, g, b, a} (0-255 each).
 */
export const getOnionSkinPixel = async (
  page: Page,
  col: number,
  row: number
) => {
  return await page.evaluate(
    ({ col, row }) => {
      const canvas = document.querySelector(
        ".onion-skin-canvas"
      ) as HTMLCanvasElement;
      if (!canvas) return { r: 0, g: 0, b: 0, a: 0 };
      const renderer = (window as any).pskl.app.drawingController
        .onionSkinRenderer.renderer;
      const zoom = renderer.zoom;
      const margin = renderer.margin;
      const offset = renderer.offset;
      const x = Math.floor(margin.x + (col - offset.x) * zoom + zoom / 2);
      const y = Math.floor(margin.y + (row - offset.y) * zoom + zoom / 2);
      const ctx = canvas.getContext("2d")!;
      const data = ctx.getImageData(x, y, 1, 1).data;
      return { r: data[0], g: data[1], b: data[2], a: data[3] };
    },
    { col, row }
  );
};

/** Check the labels of the preview sizes on offer, from left to right */
export const assertPreviewSizesOffered = async (
  page: Page,
  labels: string[]
): Promise<void> => {
  await expect(
    page.locator(
      '[data-test-id^="preview-size-"]:not(.preview-contextual-action-hidden)'
    )
  ).toHaveText(labels);
};

/** Check the label of the selected preview size */
export const assertSelectedPreviewSize = async (
  page: Page,
  label: string
): Promise<void> => {
  await expect(page.locator(".size-button-selected")).toHaveText(label);
};

/** Check whether an overlay covers the preview size buttons, disabling them */
export const assertPreviewSizesDisabled = async (
  page: Page,
  disabled: boolean
): Promise<void> => {
  // The size buttons only show while hovering the preview.
  await page.locator(".minimap-container").hover();
  const overlay = page.locator(".preview-disable-overlay");
  if (disabled) {
    await expect(overlay).toBeVisible();
  } else {
    await expect(overlay).toBeHidden();
  }
};

/** Check the width of the image shown by the preview, waiting for it to update */
export const assertPreviewImageWidth = async (
  page: Page,
  width: number
): Promise<void> => {
  await expect
    .poll(async () => (await readPreviewImage(page)).width)
    .toBe(width);
};

/** Count the red pixels visible in the preview, from a screenshot of it */
export const countRedPixelsInPreview = async (page: Page): Promise<number> => {
  // Hovering the preview shows buttons on top of it.
  await page.mouse.move(0, 0);
  const screenshot = await page
    .locator("#animated-preview-canvas-container")
    .screenshot();
  const png = new PNG(screenshot);
  const pixels = png.decodePixels();
  // Screenshots have no alpha channel when they are fully opaque.
  const channels = pixels.length / (png.width * png.height);
  let count = 0;
  for (let i = 0; i < pixels.length; i += channels) {
    if (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 0) {
      count++;
    }
  }
  return count;
};

/** Check the size in the page of the preview area, waiting for it to update */
export const assertPreviewAreaSize = async (
  page: Page,
  width: number,
  height: number
): Promise<void> => {
  const area = page.locator("#animated-preview-canvas-container");
  await expect
    .poll(async () => {
      const box = await area.boundingBox();
      return [box?.width, box?.height];
    })
    .toEqual([width, height]);
};

/** Check the FPS of the sprite, from the display and the slider below the preview */
export const assertFps = async (page: Page, fps: number): Promise<void> => {
  await expect(testId(page, "fps-display")).toHaveText(`${fps} FPS`);
  await expect(testId(page, "fps-slider")).toHaveValue(String(fps));
};

/** Type a value in the "Maximum FPS" preference, then close the drawer */
export const setMaxFpsPreference = async (
  page: Page,
  maxFps: number
): Promise<void> => {
  await togglePreferencesPanel(page);
  const input = page.locator(".max-fps-input");
  await input.fill(String(maxFps));
  await input.dispatchEvent("change");
  await togglePreferencesPanel(page);
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
};

/** Enable or disable tile mode in the preferences, then close the drawer */
export const setTileMode = async (
  page: Page,
  enabled: boolean
): Promise<void> => {
  await togglePreferencesPanel(page);
  await page.locator('[data-tab-id="tile"]').click();
  await page.locator(".tile-mode-checkbox").setChecked(enabled);
  await togglePreferencesPanel(page);
  await waitFor(async () => !(await isSettingsDrawerExpanded(page)));
};

/** Read the FPS saved in a .piskel file */
export const readFpsFromPiskelFile = async (
  piskelPath: string
): Promise<number> => {
  return JSON.parse(await fs.readFile(piskelPath, "utf-8")).piskel.fps;
};

/**
 * Get where a pixel of the sprite is on the screen, which changes when panning.
 * Waits for the canvas to settle, as its layout also changes that position.
 */
export const getPixelScreenPosition = async (
  page: Page,
  col: number,
  row: number
): Promise<{ x: number; y: number }> => {
  await screenshotSettledCanvas(page);
  return await page.evaluate(
    ({ col, row }) =>
      window.pskl.app.drawingController.getScreenCoordinates(col, row),
    { col, row }
  );
};

/** Press the mouse on the preview at a position in it, drag, and release */
export const dragOnPreview = async (
  page: Page,
  from: { x: number; y: number },
  to: { x: number; y: number }
): Promise<void> => {
  const box = await page.locator(".minimap-container").boundingBox();
  await page.mouse.move(box!.x + from.x, box!.y + from.y);
  await page.mouse.down();
  await page.mouse.move(box!.x + to.x, box!.y + to.y, { steps: 5 });
  await page.mouse.up();
};

/** Open the cheatsheet dialog and wait for it to be visible */
export const openCheatsheet = async (page: Page): Promise<void> => {
  // Retry pressing ? in case the page isn't ready to receive the shortcut yet
  // (e.g. under coverage collection overhead or after dialog close animations)
  await expect(async () => {
    await page.keyboard.press("?");
    await expect(page.locator("#dialog-container-wrapper.show")).toBeAttached({
      timeout: 1000
    });
  }).toPass({ timeout: 5000 });
  await expect(page.locator(".cheatsheet-container")).toBeAttached();
};

/** Close the cheatsheet dialog and wait for it to be gone */
export const closeCheatsheet = async (page: Page): Promise<void> => {
  await page.keyboard.press("Escape");
  await expect(
    page.locator("#dialog-container-wrapper:not(.show)")
  ).toBeAttached();
};

/** Check which dialog is open, by its id such as "cheatsheet" */
export const assertDialogOpen = async (
  page: Page,
  dialogId: string
): Promise<void> => {
  await expect(page.locator("#dialog-container-wrapper")).toHaveClass(/show/);
  await expect(page.locator("#dialog-container")).toHaveClass(dialogId);
};

/** Check that no dialog is open, waiting for it to be fully removed */
export const assertNoDialogOpen = async (page: Page): Promise<void> => {
  await expect(page.locator("#dialog-container-wrapper")).not.toHaveClass(
    /show/
  );
  await expect(page.locator("#dialog-container")).toBeEmpty();
};

/** Locator for a shortcut of the cheatsheet, by its id such as "tool-pen" */
export const getCheatsheetShortcut = (page: Page, shortcutId: string) =>
  page.locator(`[data-shortcut-id="${shortcutId}"]`);

/** In the open cheatsheet, click a shortcut and press a new key for it */
export const remapShortcut = async (
  page: Page,
  shortcutId: string,
  key: string
): Promise<void> => {
  const shortcut = getCheatsheetShortcut(page, shortcutId);
  await shortcut.click();
  await expect(shortcut).toHaveClass(/cheatsheet-shortcut-editing/);
  await page.keyboard.press(key);
  await expect(shortcut).not.toHaveClass(/cheatsheet-shortcut-editing/);
};

/** Check the key shown for a shortcut in the open cheatsheet */
export const assertShortcutKey = async (
  page: Page,
  shortcutId: string,
  key: string
): Promise<void> => {
  await expect(
    getCheatsheetShortcut(page, shortcutId).locator(".cheatsheet-key")
  ).toHaveText(key);
};

/** Check the description shown for a shortcut in the open cheatsheet */
export const assertShortcutDescription = async (
  page: Page,
  shortcutId: string,
  description: string
): Promise<void> => {
  await expect(
    getCheatsheetShortcut(page, shortcutId).locator(".cheatsheet-description")
  ).toHaveText(description);
};

/** Check the message shown in the notification */
export const assertNotification = async (
  page: Page,
  message: string
): Promise<void> => {
  await expect(page.locator("#user-message")).toContainText(message);
};

/** Check that this notification is showing, and that it's the only one */
export const assertOnlyNotification = async (
  page: Page,
  message: string
): Promise<void> => {
  await expect(page.locator("#user-message")).toHaveCount(1);
  await assertNotification(page, message);
};

/** Check that no notification is showing */
export const assertNoNotification = async (
  page: Page,
  options?: { timeout: number }
): Promise<void> => {
  await expect(page.locator("#user-message")).toHaveCount(0, options);
};

/** Dismiss the notification with its close button */
export const closeNotification = async (page: Page): Promise<void> => {
  await page.locator("#user-message").getByTitle("Close message").click();
};

/** A file that a test can drop on the editor or pick in a file chooser */
type TestFile = { name: string; mimeType: string; base64: string };

/** Create a PNG file from an ASCII art grid: X is red, . is transparent */
export const createPngFile = async (
  page: Page,
  name: string,
  rows: string[]
): Promise<TestFile> => {
  const base64 = await page.evaluate((rows) => {
    const canvas = document.createElement("canvas");
    canvas.width = rows[0].length;
    canvas.height = rows.length;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#FF0000";
    rows.forEach((row, y) => {
      [...row].forEach((pixel, x) => {
        if (pixel === "X") context.fillRect(x, y, 1, 1);
      });
    });
    return canvas.toDataURL("image/png").split(",")[1];
  }, rows);
  return { name, mimeType: "image/png", base64 };
};

/** Read a .piskel file saved on disk, such as one from downloadPiskelFile */
export const readPiskelFile = async (piskelPath: string): Promise<TestFile> => ({
  name: nodePath.basename(piskelPath),
  mimeType: "application/octet-stream",
  base64: (await fs.readFile(piskelPath)).toString("base64")
});

/** A .piskel file whose content isn't a sprite */
export const BROKEN_PISKEL_FILE: TestFile = {
  name: "broken.piskel",
  mimeType: "application/octet-stream",
  base64: Buffer.from("this is not a sprite").toString("base64")
};

/** Drop files on the editor, over a pixel of the sprite */
export const dropFilesOnPixel = async (
  page: Page,
  files: TestFile[],
  col = 0,
  row = 0
): Promise<void> => {
  const { x, y } = await getPixelScreenPosition(page, col, row);
  const dataTransfer = await page.evaluateHandle((files) => {
    const transfer = new DataTransfer();
    files.forEach(({ name, mimeType, base64 }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      transfer.items.add(new File([bytes], name, { type: mimeType }));
    });
    return transfer;
  }, files);
  await page.dispatchEvent("body", "drop", {
    dataTransfer,
    clientX: x,
    clientY: y
  });
};

/** Pick a file with a button of the import drawer */
const browseFile = async (page: Page, button: Locator, file: TestFile) => {
  await openImportSettingsPanel(page);
  const fileChooserPromise = page.waitForEvent("filechooser");
  await button.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: Buffer.from(file.base64, "base64")
  });
};

/** Pick an image in the import drawer, and wait for the wizard's first step */
export const browseImageFile = async (
  page: Page,
  file: TestFile
): Promise<void> => {
  await browseFile(page, page.locator(".file-input-button"), file);
  await expect(page.locator(".current-step.import-image-container")).toBeAttached();
};

/** Pick a .piskel file in the import drawer */
export const browsePiskelFile = async (
  page: Page,
  file: TestFile
): Promise<void> => {
  await browseFile(page, testId(page, "import-piskel-button"), file);
};

/** Go to the next step of the import wizard */
export const clickWizardNext = async (page: Page): Promise<void> => {
  await page.locator(".current-step .import-next-button").click();
};

/** Choose to replace the sprite in the select mode step of the import wizard */
export const clickWizardReplace = async (page: Page): Promise<void> => {
  await page.locator(".current-step .import-mode-replace-button").click();
};

/** Go back to the previous step of the import wizard */
export const clickWizardBack = async (page: Page): Promise<void> => {
  await page.locator(".current-step .import-back-button").click();
};

/** Choose to combine with the sprite in the select mode step of the import wizard */
export const clickWizardCombine = async (page: Page): Promise<void> => {
  await page.locator(".current-step .import-mode-merge-button").click();
};

const WIZARD_STEP_SELECTORS = {
  "image import": ".import-section-preview",
  "select mode": ".import-mode",
  "adjust size": ".import-resize-info",
  "insert location": ".insert-mode-container"
};

/**
 * Check which step of the import wizard is showing. Do this before clicking a
 * button of a new step: the previous step stays current during the transition.
 */
export const assertWizardStep = async (
  page: Page,
  step: keyof typeof WIZARD_STEP_SELECTORS
): Promise<void> => {
  await expect(
    page.locator(`.current-step ${WIZARD_STEP_SELECTORS[step]}`)
  ).toBeAttached();
};

/** Combine with a sprite of the same size, using the default insert location */
export const combineInWizard = async (page: Page): Promise<void> => {
  await assertWizardStep(page, "select mode");
  await clickWizardCombine(page);
  await assertWizardStep(page, "insert location");
  await clickWizardNext(page);
  await assertNoDialogOpen(page);
};

/** Close the import wizard with its close button */
export const closeImportWizard = async (page: Page): Promise<void> => {
  await page.locator(".dialog-close").click();
  await assertNoDialogOpen(page);
};

/** Check that the current wizard step has no back button */
export const assertNoWizardBackButton = async (page: Page): Promise<void> => {
  await expect(page.locator(".current-step .import-back-button")).toBeHidden();
};

/** Check the summary of the imported content shown by the current wizard step */
export const assertWizardSummary = async (
  page: Page,
  summary: { name: string; size: string; frames: number; layers: number }
): Promise<void> => {
  const meta = page.locator(".current-step .import-meta");
  const value = (section: string) =>
    meta.locator(`.${section} .import-meta-value`);
  await expect(value("import-name")).toHaveText(summary.name);
  await expect(value("import-dimensions")).toHaveText(summary.size);
  await expect(value("import-frames")).toHaveText(String(summary.frames));
  await expect(value("import-layers")).toHaveText(String(summary.layers));
  await expect(
    page.locator(".current-step .import-preview .frame-viewer .canvas-background")
  ).toBeVisible();
};

/** Run the action that replaces the sprite, and accept the confirmation */
export const confirmReplacement = async (
  page: Page,
  action: () => Promise<void>
): Promise<void> => {
  const confirmation = answerNextConfirm(page, "accept");
  await action();
  await confirmation;
  await assertNoDialogOpen(page);
};

/** Choose "expand" or "keep" in the adjust size step */
export const selectResizeOption = async (
  page: Page,
  option: "expand" | "keep"
): Promise<void> => {
  await page.locator(`#resize-option-${option}`).check();
};

/** Check which of "expand" or "keep" is selected in the adjust size step */
export const assertResizeOption = async (
  page: Page,
  option: "expand" | "keep"
): Promise<void> => {
  await expect(page.locator(`#resize-option-${option}`)).toBeChecked();
};

/** Check that the adjust size step doesn't offer "expand" or "keep" */
export const assertNoResizeOptions = async (page: Page): Promise<void> => {
  await expect(page.locator(".current-step [name=\"resize-mode\"]")).toHaveCount(0);
};

/** Check the warning shown when keeping the size will crop the content */
export const assertCropWarning = async (page: Page): Promise<void> => {
  await expect(page.locator(".current-step .import-resize-warning")).toHaveText(
    "Imported content will be cropped!"
  );
};

/** Check the nine positions of the anchor, and which one is selected */
export const assertWizardAnchor = async (
  page: Page,
  origin: string
): Promise<void> => {
  await expect(page.locator(".current-step .anchor-option")).toHaveCount(9);
  await expect(
    page.locator(".current-step .anchor-option.selected")
  ).toHaveAttribute("data-origin", origin);
};

/** Locator for the text that says what the anchor does */
export const getWizardAnchorLabel = (page: Page): Locator =>
  page.locator(".current-step .import-resize-anchor-info");

/** Choose "add" (as new frames) or "insert" (in existing frames) */
export const selectInsertMode = async (
  page: Page,
  mode: "add" | "insert"
): Promise<void> => {
  await page.locator(`#insert-mode-${mode}`).check();
};

/** Check which of "add" or "insert" is selected in the insert location step */
export const assertInsertMode = async (
  page: Page,
  mode: "add" | "insert"
): Promise<void> => {
  await expect(page.locator(`#insert-mode-${mode}`)).toBeChecked();
};

/** Go to the very start of the frames in the insert location step */
export const clickFirstInsertFrame = async (page: Page): Promise<void> => {
  await page.locator(".current-step .insert-frame-preview .frame-nav-first").click();
};

/** Locator for the name of the file in the image import step */
export const getImportedFileName = (page: Page): Locator =>
  page.locator(".current-step .import-image-file-name");

/** Locator for the preview of the image in the image import step */
export const getImportedImagePreview = (page: Page): Locator =>
  page.locator(".current-step .import-section-preview img");

/** Locator for the grid drawn on the preview in the image import step */
export const getSpritesheetGrid = (page: Page): Locator =>
  page.locator(".current-step .import-section-preview canvas");

/** Locator for the "Smooth resize" checkbox of the image import step */
export const getSmoothResizeCheckbox = (page: Page): Locator =>
  page.locator('.current-step [name="smooth-resize-checkbox"]');

/** Check the name of the sprite, whether or not it has unsaved changes */
export const assertSpriteName = async (
  page: Page,
  name: string
): Promise<void> => {
  await expect(page.locator(".piskel-name")).toHaveText(
    new RegExp(`^${name}( \\*)?$`)
  );
};

/** Fill in the name and description of the open save panel */
export const fillSpriteNameAndDescription = async (
  page: Page,
  name: string,
  description: string
): Promise<void> => {
  await page.locator("#save-name").fill(name);
  await page.locator("#save-description").fill(description);
};

/** Check the description of the sprite, in the save panel */
export const assertSpriteDescription = async (
  page: Page,
  description: string
): Promise<void> => {
  await openSaveSettingsPanel(page);
  await expect(page.locator("#save-description")).toHaveValue(description);
};

/** Select "single image" or "spritesheet" in the image import step */
export const selectImportType = async (
  page: Page,
  importType: "single" | "sheet"
): Promise<void> => {
  await page.locator(`input[name="import-type"][value="${importType}"]`).check();
};

/** Check whether "single image" or "spritesheet" is selected */
export const assertImportType = async (
  page: Page,
  importType: "single" | "sheet"
): Promise<void> => {
  await expect(
    page.locator(`input[name="import-type"][value="${importType}"]`)
  ).toBeChecked();
};

/** Locator for a field of the current wizard step, such as "frame-size-x" */
export const getWizardField = (page: Page, name: string): Locator =>
  page.locator(`.current-step [name="${name}"]`);

/** Type over the value of a field of the current wizard step */
export const typeInWizardField = async (
  page: Page,
  name: string,
  value: string
): Promise<void> => {
  const field = getWizardField(page, name);
  await field.selectText();
  await field.pressSequentially(value);
};

/** Click one of the nine positions of the anchor, such as "BOTTOMRIGHT" */
export const pickWizardAnchor = async (
  page: Page,
  origin: string
): Promise<void> => {
  await page.locator(`.current-step .anchor-option[data-origin="${origin}"]`).click();
};

/** Locator for the frame number in the insert location step */
export const getInsertFrameInput = (page: Page): Locator =>
  page.locator(".current-step .insert-frame-preview .frame-nav-input");

/** Pick a frame in the insert location step, by its number from 1 */
export const pickInsertFrame = async (
  page: Page,
  frameNumber: number
): Promise<void> => {
  await getInsertFrameInput(page).fill(String(frameNumber));
  await getInsertFrameInput(page).blur();
  await expect(getInsertFrameInput(page)).toHaveValue(String(frameNumber));
};

/** The wizard counts a sprite as empty until its colors are listed */
export const waitForColorsToBeListed = async (page: Page): Promise<void> => {
  await expect.poll(() => isCurrentPiskelEmpty(page)).toBe(false);
};

/** Check the frames of a layer, as ASCII art grids, and the size of the sprite */
export const assertLayerFrames = async (
  page: Page,
  layerIndex: number,
  frames: string[][]
): Promise<void> => {
  const width = frames[0][0].length;
  const height = frames[0].length;
  await assertFrameCount(page, frames.length);
  await expect.poll(() => getCurrentPiskelWidth(page)).toBe(width);
  await expect.poll(() => getCurrentPiskelHeight(page)).toBe(height);
  for (const [frameIndex, rows] of frames.entries()) {
    await expect
      .poll(() => readPixelRows(page, width, height, layerIndex, frameIndex))
      .toEqual(rows);
  }
};

/** Set the FPS with the slider of the preview */
export const setFps = async (page: Page, fps: number): Promise<void> => {
  await testId(page, "fps-slider").fill(String(fps));
  await assertFps(page, fps);
};

/**
 * Answer the next native confirm dialog. The returned promise gives its
 * message, so awaiting it also checks that the dialog appeared.
 */
export const answerNextConfirm = (
  page: Page,
  answer: "accept" | "dismiss"
): Promise<string> =>
  new Promise((resolve) => {
    page.once("dialog", async (dialog) => {
      const message = dialog.message();
      await dialog[answer]();
      resolve(message);
    });
  });

/** Create a text file, such as a palette file */
export const createTextFile = (name: string, text: string): TestFile => ({
  name,
  mimeType: "text/plain",
  base64: Buffer.from(text).toString("base64")
});

/** Create a GIMP palette file with these colors, such as "#ff0000" */
export const createGplFile = (name: string, colors: string[]): TestFile => {
  const lines = colors.map((color) =>
    [1, 3, 5]
      .map((start) => parseInt(color.slice(start, start + 2), 16))
      .join(" ")
  );
  return createTextFile(name, ["GIMP Palette", ...lines, ""].join("\n"));
};

/** Create a PNG file with one row of pixels, one for each of these colors */
export const createPngFileFromColors = async (
  page: Page,
  name: string,
  colors: string[]
): Promise<TestFile> => {
  const base64 = await page.evaluate((colors) => {
    const canvas = document.createElement("canvas");
    canvas.width = colors.length;
    canvas.height = 1;
    const context = canvas.getContext("2d")!;
    colors.forEach((color, x) => {
      context.fillStyle = color;
      context.fillRect(x, 0, 1, 1);
    });
    return canvas.toDataURL("image/png").split(",")[1];
  }, colors);
  return { name, mimeType: "image/png", base64 };
};

/** A list of distinct colors, as many as needed */
export const createDistinctColors = (count: number): string[] =>
  Array.from(
    { length: count },
    (_, index) => `#${index.toString(16).padStart(4, "0")}07`
  );

/** Open the palette dialog to create a palette */
export const openCreatePaletteDialog = async (page: Page): Promise<void> => {
  await testId(page, "create-palette-button").click();
  await assertDialogOpen(page, "create-palette");
};

/** Open the palette dialog for the selected palette */
export const openEditPaletteDialog = async (page: Page): Promise<void> => {
  await page.locator(".edit-palette-button").click();
  await assertDialogOpen(page, "create-palette");
};

/** Locator for the name of the palette in the palette dialog */
export const getPaletteNameInput = (page: Page): Locator =>
  page.locator('input[name="palette-name"]');

/** Save the palette and close the palette dialog */
export const savePaletteDialog = async (page: Page): Promise<void> => {
  await page.locator(".create-palette-submit").click();
  await assertNoDialogOpen(page);
};

/** Close the palette dialog with its cancel button */
export const cancelPaletteDialog = async (page: Page): Promise<void> => {
  await page.locator(".create-palette-cancel").click();
  await assertNoDialogOpen(page);
};

/** Locator for an action of the palette dialog */
export const getPaletteDialogButton = (
  page: Page,
  action: "import" | "download" | "delete"
): Locator =>
  page.locator(
    {
      import: ".create-palette-import-button",
      download: ".create-palette-download-button",
      delete: ".create-palette-delete"
    }[action]
  );

/** Pick a palette file with the import button of the palette dialog */
export const importFileInPaletteDialog = async (
  page: Page,
  file: TestFile
): Promise<void> => {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await getPaletteDialogButton(page, "import").click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: file.name,
    mimeType: file.mimeType,
    buffer: Buffer.from(file.base64, "base64")
  });
};

/** Create a palette with these colors, which then becomes the selected one */
export const createPaletteWithColors = async (
  page: Page,
  name: string,
  colors: string[]
): Promise<void> => {
  await openCreatePaletteDialog(page);
  await importFileInPaletteDialog(page, createGplFile("palette.gpl", colors));
  await assertPaletteDialogColors(page, colors);
  await getPaletteNameInput(page).fill(name);
  await savePaletteDialog(page);
  await assertSelectedPalette(page, name);
};

const rgbToHex = (rgb: string): string => {
  const channels = rgb.match(/\d+/g) ?? [];
  return `#${channels.map((c) => Number(c).toString(16).padStart(2, "0")).join("")}`;
};

/** Check the colors listed in the palette dialog, in order */
export const assertPaletteDialogColors = async (
  page: Page,
  colors: string[]
): Promise<void> => {
  await expect
    .poll(async () => {
      const backgrounds = await page
        .locator(".create-palette-color")
        .evaluateAll((elements) =>
          elements.map((element) => (element as HTMLElement).style.background)
        );
      return backgrounds.map(rgbToHex);
    })
    .toEqual(colors);
};

/** Check which color is selected in the palette dialog, by its position */
export const assertPaletteDialogSelectedColor = async (
  page: Page,
  index: number
): Promise<void> => {
  await expect(page.locator(".create-palette-color.selected")).toHaveAttribute(
    "data-palette-index",
    String(index)
  );
};

/** Select a color in the palette dialog, by its position */
export const selectPaletteDialogColor = async (
  page: Page,
  index: number
): Promise<void> => {
  await page.locator(".create-palette-color").nth(index).click();
  await assertPaletteDialogSelectedColor(page, index);
};

/** Click the + button of the palette dialog */
export const clickPaletteDialogAddColor = async (page: Page): Promise<void> => {
  await page.locator(".create-palette-new-color").click();
};

/** Remove a color in the palette dialog, by its position */
export const removePaletteDialogColor = async (
  page: Page,
  index: number
): Promise<void> => {
  const color = page.locator(".create-palette-color").nth(index);
  await color.hover();
  await color.locator(".create-palette-remove-color").click();
};

/** Type a hex value for the selected color in the palette dialog */
export const typePaletteDialogColor = async (
  page: Page,
  hex: string
): Promise<void> => {
  const input = page.locator('[data-model="hex"]');
  await input.fill(hex);
  await input.press("Enter");
};

/** Drag a color of the palette dialog onto the position of another one */
export const dragPaletteDialogColor = async (
  page: Page,
  from: number,
  to: number
): Promise<void> => {
  const colors = page.locator(".create-palette-color");
  const start = (await colors.nth(from).boundingBox())!;
  const end = (await colors.nth(to).boundingBox())!;
  const startX = start.x + start.width / 2;
  const endX = end.x + end.width / 2;
  const y = start.y + start.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  const steps = 20;
  for (let step = 1; step <= steps; step++) {
    // The list only reorders on vertical movement, and a hand is never perfectly
    // straight, so move up and down a little along the way.
    const wobble = step % 2 === 0 ? 2 : -2;
    await page.mouse.move(startX + ((endX - startX) * step) / steps, y + wobble);
    await wait(20);
  }
  await page.mouse.up();
};

/** Choose a palette in the dropdown of the palettes panel */
export const selectPalette = async (
  page: Page,
  name: string
): Promise<void> => {
  await testId(page, "palette-select").selectOption({ label: name });
};

/** Check which palette is selected in the dropdown of the palettes panel */
export const assertSelectedPalette = async (
  page: Page,
  name: string
): Promise<void> => {
  await expect(
    testId(page, "palette-select").locator("option:checked")
  ).toHaveText(name);
};

/** Check the palettes offered in the dropdown of the palettes panel */
export const assertPaletteOptions = async (
  page: Page,
  names: string[]
): Promise<void> => {
  await expect(testId(page, "palette-select").locator("option")).toHaveText(names);
};

/** Check the colors of the palettes panel, in order */
export const assertPaletteSwatches = async (
  page: Page,
  colors: string[]
): Promise<void> => {
  await expect
    .poll(() =>
      page
        .locator(".palettes-list-color")
        .evaluateAll((elements) =>
          elements.map((element) => (element as HTMLElement).dataset.color)
        )
    )
    .toEqual(colors);
};

/** Check how many colors the palettes panel shows */
export const assertPaletteSwatchCount = async (
  page: Page,
  count: number
): Promise<void> => {
  await expect(page.locator(".palettes-list-color")).toHaveCount(count);
};

/** Check how many colors the palette dialog lists */
export const assertPaletteDialogColorCount = async (
  page: Page,
  count: number
): Promise<void> => {
  await expect(page.locator(".create-palette-color")).toHaveCount(count);
};

/** Locator for the swatch of a color in the palettes panel */
export const getPaletteSwatch = (page: Page, color: string): Locator =>
  page.locator(`.palettes-list-color[data-color="${color}"]`);

/** Check which swatches are highlighted. Use null when none should be */
export const assertSwatchHighlights = async (
  page: Page,
  highlights: { primary: string | null; secondary: string | null }
): Promise<void> => {
  const assertHighlight = async (selector: string, color: string | null) => {
    const swatch = page.locator(selector);
    if (color === null) {
      await expect(swatch).toHaveCount(0);
    } else {
      await expect(swatch).toHaveAttribute("data-color", color);
    }
  };
  await assertHighlight(".palettes-list-primary-color", highlights.primary);
  await assertHighlight(".palettes-list-secondary-color", highlights.secondary);
};

/** Check the message that the selected palette has no colors */
export const assertEmptyPaletteMessage = async (page: Page): Promise<void> => {
  await expect(page.locator(".palettes-list-colors")).toContainText(
    "No color in this palette"
  );
};

/** Check the primary color, waiting for the color picker to update */
export const assertPrimaryColor = async (
  page: Page,
  color: string
): Promise<void> => {
  await expect.poll(() => getPrimaryColor(page)).toBe(color);
};

/** Check the secondary color, waiting for the color picker to update */
export const assertSecondaryColor = async (
  page: Page,
  color: string
): Promise<void> => {
  await expect.poll(() => getSecondaryColor(page)).toBe(color);
};

/** Click the transparent swatch offered by the primary color picker */
export const clickTransparentSwatchOfPrimaryColor = async (
  page: Page
): Promise<void> => {
  await page
    .locator('[data-test-id="primary-color-picker"]')
    .locator("..")
    .locator(".sp-replacer")
    .click();
  await page
    .locator(".sp-container:not(.sp-hidden) .sp-palette .sp-thumb-el")
    .first()
    .click();
};

/** Try to import a .piskel file whose content isn't a sprite */
export const importBrokenPiskelFile = async (page: Page): Promise<void> => {
  await browsePiskelFile(page, BROKEN_PISKEL_FILE);
};

/** Trigger undo via keyboard */
export const undo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+z`);
};

/** Trigger redo via keyboard */
export const redo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+y`);
};
