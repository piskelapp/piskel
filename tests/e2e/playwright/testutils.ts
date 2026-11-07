import { Locator, Page, expect } from "@playwright/test";
import AdmZip from "adm-zip";
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

/** Check that the editor's canvas doesn't exist yet */
export const assertEditorNotReady = async (page: Page) => {
  await expect(page.locator("#drawing-canvas-container canvas")).toHaveCount(0);
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

/**
 * Build a test grid from rows written like the ones of assertColorRows: R, G and B
 * are red, green and blue, and . a transparent pixel.
 */
export const gridFromColorRows = (rows: string[]): TestGrid =>
  rows.map((row) =>
    [...row].map((c) => {
      if (c === ".") return "T";
      if (c === "R" || c === "G" || c === "B") return c;
      throw new Error(`Unknown color letter "${c}" in "${row}"`);
    })
  );

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

/** Press a key several times, such as "+" or "Shift+ArrowUp" */
export const pressRepeatedly = async (
  page: Page,
  key: string,
  count: number
): Promise<void> => {
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(key);
  }
};

/** Check the size shown as a label on the last pen size option, for sizes above 4 */
export const assertPenSizeLabel = async (
  page: Page,
  size: number
): Promise<void> => {
  const label = page.locator(".pen-size-option.labeled");
  await expect(label).toHaveAttribute("real-size", String(size));
};

/** Check that no pen size option shows a label */
export const assertNoPenSizeLabel = async (page: Page): Promise<void> => {
  await expect(page.locator(".pen-size-option.labeled")).toHaveCount(0);
};

/**
 * Pick a pen size with the picker. Sizes above 4 are only reachable with the
 * `]` shortcut, from the size 4 option.
 */
export const setPenSize = async (page: Page, size: number): Promise<void> => {
  await getPenSizeButton(page, Math.min(size, 4)).click();
  await expect(getPenSizeButton(page, Math.min(size, 4))).toHaveClass(/selected/);
  if (size > 4) {
    await pressRepeatedly(page, "]", size - 4);
    await assertPenSizeLabel(page, size);
  }
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
  await moveMouseOntoCanvas(page, coords.x, coords.y);
  await page.mouse.click(coords.x, coords.y);
};

/**
 * Move the mouse before pressing it, and wait for the tooltip of a tool button to
 * fade out: until then, it can be over the canvas and catch the press.
 */
const moveMouseOntoCanvas = async (page: Page, x: number, y: number) => {
  await page.mouse.move(x, y);
  await expect(page.locator(".tooltip")).toHaveCount(0);
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
 * Press the mouse on the first sprite pixel, move it through the others in order,
 * and release it on the last one, via real mouse events, as when drawing a lasso
 * selection. Waits for any pending relayout before computing coordinates (same as
 * drawAtPixel).
 */
export const dragThroughPixels = async (
  page: Page,
  pixels: Array<[number, number]>,
  options?: { steps?: number }
): Promise<void> => {
  const steps = options?.steps ?? 5;
  // Wait for any pending relayout (DrawingController uses setTimeout(200) for relayout)
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 210)));
  const points = await page.evaluate(
    (pixels) =>
      pixels.map(([col, row]) =>
        window.pskl.app.drawingController.getScreenCoordinates(col, row)
      ),
    pixels
  );
  await moveMouseOntoCanvas(page, points[0].x, points[0].y);
  await page.mouse.down();
  for (const point of points.slice(1)) {
    await page.mouse.move(point.x, point.y, { steps });
  }
  await page.mouse.up();
};

/** Drag from sprite pixel (x1,y1) to (x2,y2) via real mouse events */
export const dragBetweenPixels = async (
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options?: { steps?: number }
): Promise<void> => {
  await dragThroughPixels(page, [[x1, y1], [x2, y2]], options);
};

/** Click a transform tool with optional modifier keys held */
export const clickTransform = async (
  page: Page,
  toolId: string,
  modifiers: { alt?: boolean; shift?: boolean; ctrl?: boolean } = {}
): Promise<void> => {
  const tool = page.locator(`[data-tool-id="${toolId}"]`);

  // Expand "show more" if the tool is not visible
  if (!(await tool.isVisible())) {
    await page.locator(".transformations-show-more-link").click();
    await expect(tool).toBeVisible();
  }

  if (modifiers.alt) await page.keyboard.down("Alt");
  if (modifiers.shift) await page.keyboard.down("Shift");
  if (modifiers.ctrl) await page.keyboard.down(CMD_OR_CTRL);

  await tool.click();

  if (modifiers.ctrl) await page.keyboard.up(CMD_OR_CTRL);
  if (modifiers.shift) await page.keyboard.up("Shift");
  if (modifiers.alt) await page.keyboard.up("Alt");

  // Wait for transform to apply
  await wait(200);
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
  }: {
    timeout?: number;
    interval?: number;
    // A function is called after the last try, so it can describe the final state
    message?: string | (() => string);
  } = {}
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, interval));
  }
  if (!(await fn())) {
    const text = typeof message === "function" ? message() : message;
    throw new Error(text ?? `waitFor: condition not met after ${timeout}ms`);
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
      message: () =>
        `Grid did not match expected pattern within ${timeout}ms.\nExpected:\n${expectedGrid.join("\n")}\nGot:\n${lastGrid.join("\n")}`
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

/** Duplicate a frame with the clone action of its tile */
export const duplicateFrame = async (
  page: Page,
  frameIndex: number
): Promise<void> => {
  await getFrameTiles(page).nth(frameIndex).hover();
  await testId(page, "duplicate-frame-button").nth(frameIndex).click();
};

/**
 * Drag a frame from sourceIndex to targetIndex using the drag handle.
 * jQuery sortable (tolerance: 'pointer') inserts at the position where
 * the pointer crosses another item's midpoint.
 */
export const dragFrame = async (
  page: Page,
  sourceIndex: number,
  targetIndex: number
): Promise<void> => {
  const tiles = getFrameTiles(page);
  const handle = tiles.nth(sourceIndex).locator(".dnd-action");

  // The handle only shows while the tile is hovered.
  await tiles.nth(sourceIndex).hover();
  await expect(handle).toBeVisible();
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();

  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2
  );
  await page.mouse.down();

  // To land at targetIndex, we need to cross the midpoint of the item
  // currently at that position. Get the target tile's bounding box.
  const targetBox = await tiles.nth(targetIndex).boundingBox();
  expect(targetBox).not.toBeNull();

  const targetX = targetBox!.x + targetBox!.width / 2;
  let targetY: number;

  if (sourceIndex < targetIndex) {
    // Moving down: go just past the bottom edge of the target tile
    targetY = targetBox!.y + targetBox!.height + 5;
  } else if (targetIndex === 0) {
    // Moving up to the very start: go above the first tile
    targetY = targetBox!.y - 10;
  } else {
    // Moving up to a middle position: stop at the center of the target tile
    // This crosses the target's midpoint without crossing the previous item
    targetY = targetBox!.y + targetBox!.height / 2;
  }

  await page.mouse.move(targetX, targetY, { steps: 15 });
  await page.mouse.up();
  await wait(500);
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

/** Check the opacity shown by the α button of the top layer, in its tooltip */
export const assertTopLayerOpacity = async (
  page: Page,
  opacity: number
): Promise<void> => {
  const indicator = getAllLayerOpacityButtons(page).first();
  // Bootstrap moves the title to data-original-title once the tooltip is set up
  await expect
    .poll(
      async () =>
        (await indicator.getAttribute("data-original-title")) ??
        (await indicator.getAttribute("title"))
    )
    .toBe(`Layer opacity (${opacity})`);
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

/**
 * Check the colors of a frame against an ASCII art grid, with the letters of
 * getColorLetter. By default, the first frame of the first layer.
 */
export const assertColorRows = async (
  page: Page,
  rows: string[],
  { layerIndex = 0, frameIndex = 0 }: { layerIndex?: number; frameIndex?: number } = {}
): Promise<void> => {
  const readColorRows = async () => {
    const colors = await page.evaluate(
      ({ width, height, layerIndex, frameIndex }) => {
        const frame = window.pskl.app.piskelController
          .getPiskel()
          .getLayerAt(layerIndex)
          .getFrameAt(frameIndex);
        return Array.from({ length: height }, (_, y) =>
          Array.from({ length: width }, (_, x) => frame.getPixel(x, y))
        );
      },
      { width: rows[0].length, height: rows.length, layerIndex, frameIndex }
    );
    // Pixels are stored as ABGR integers.
    return colors.map((row) =>
      row
        .map((color) =>
          color >>> 24 === 0
            ? "."
            : getColorLetter(color & 255, (color >>> 8) & 255, (color >>> 16) & 255)
        )
        .join("")
    );
  };
  await expect.poll(readColorRows).toEqual(rows);
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
  await pauseClock(page);
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

/**
 * Check that no notification shows after a moment. assertNoNotification isn't enough
 * after an action that could show one, as it also passes when one expires.
 */
export const assertNoNotificationAppears = async (page: Page): Promise<void> => {
  await wait(500);
  expect(await page.locator("#user-message").count()).toBe(0);
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

/** Load a sprite from ASCII art rows, and pick the rectangle selection tool */
export const setSpriteWithRectangleSelect = async (
  page: Page,
  rows: string[]
): Promise<void> => {
  await setPiskelFromGrid(page, gridFromRows(rows));
  await waitForGrid(page, rows[0].length, rows.length, rows);
  await clickTool(page, "tool-rectangle-select");
};

/** Open the editor with a sprite from ASCII art rows, and the rectangle selection tool */
export const openEditorWithRectangleSelect = async (
  page: Page,
  rows: string[]
): Promise<void> => {
  await openEditor(page);
  await setSpriteWithRectangleSelect(page, rows);
};

/** Drag between two sprite pixels with the right mouse button */
export const dragWithRightButton = async (
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Promise<void> => {
  const start = await getPixelScreenPosition(page, x1, y1);
  const end = await getPixelScreenPosition(page, x2, y2);
  await moveMouseOntoCanvas(page, start.x, start.y);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(end.x, end.y, { steps: 5 });
  await page.mouse.up({ button: "right" });
};

/** Drag from a pixel to another and back, in a single stroke */
export const dragThereAndBack = async (
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Promise<void> => {
  const start = await getPixelScreenPosition(page, x1, y1);
  const end = await getPixelScreenPosition(page, x2, y2);
  await moveMouseOntoCanvas(page, start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 3 });
  await page.mouse.move(start.x, start.y, { steps: 3 });
  await page.mouse.up();
};

/**
 * Read the hover highlight of the canvas as an ASCII art grid, from the overlay
 * canvas: "L" is the light overlay, "D" the dark one, "." no overlay.
 */
const readHighlightRows = (page: Page, width: number, height: number) =>
  page.evaluate(
    ({ width, height }) => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        ".canvas-overlay"
      )!;
      const box = canvas.getBoundingClientRect();
      const context = canvas.getContext("2d")!;
      return Array.from({ length: height }, (_, row) =>
        Array.from({ length: width }, (_, col) => {
          const { x, y } =
            window.pskl.app.drawingController.getScreenCoordinates(col, row);
          const [red, , , alpha] = context.getImageData(
            Math.floor(x - box.left),
            Math.floor(y - box.top),
            1,
            1
          ).data;
          if (alpha === 0) return ".";
          return red === 255 ? "L" : "D";
        }).join("")
      );
    },
    { width, height }
  );

/**
 * Hover a pixel of the sprite, and check the highlight against an ASCII art grid.
 * The app ignores a mouse move that comes too soon after another, so the hover is
 * sent again until the highlight matches.
 */
export const hoverPixelAndAssertHighlight = async (
  page: Page,
  col: number,
  row: number,
  rows: string[]
): Promise<void> => {
  const { x, y } = await getPixelScreenPosition(page, col, row);
  await expect(async () => {
    await page.mouse.move(x - 1, y);
    await page.mouse.move(x, y);
    expect(await readHighlightRows(page, rows[0].length, rows.length)).toEqual(
      rows
    );
  }).toPass({ timeout: 5000 });
};

/** Hover a tool button, and check the text of its tooltip */
export const assertToolTooltip = async (
  page: Page,
  toolId: string,
  text: string
): Promise<void> => {
  await page.locator(`[data-tool-id="${toolId}"]`).hover();
  await expect(page.locator(".tooltip")).toHaveText(text);
};

/** Check the sprite title in the header, which ends with " *" when there are unsaved changes */
export const assertSpriteTitle = async (
  page: Page,
  title: string
): Promise<void> => {
  await expect(page.locator(".piskel-name")).toHaveText(title);
};

/** Check the title and description shown in the save panel, which stays open */
export const assertSavePanelFields = async (
  page: Page,
  title: string,
  description: string
): Promise<void> => {
  await openSaveSettingsPanel(page);
  await expect(page.locator("#save-name")).toHaveValue(title);
  await expect(page.locator("#save-description")).toHaveValue(description);
};

/** The Save in Browser button of the save panel */
export const getSaveInBrowserButton = (page: Page): Locator =>
  page.locator("#save-localstorage-button");

/** Check whether the settings drawer ends up open or closed */
export const assertSettingsDrawerOpen = async (
  page: Page,
  isOpen: boolean
): Promise<void> => {
  await expect.poll(() => isSettingsDrawerExpanded(page)).toBe(isOpen);
};

/** Open the save panel and edit the title and description, without saving */
export const fillSpriteTitleAndDescription = async (
  page: Page,
  title: string,
  description: string
): Promise<void> => {
  await openSaveSettingsPanel(page);
  await page.locator("#save-name").fill(title);
  await page.locator("#save-description").fill(description);
};

/** Press Enter in the title field of the save panel */
export const pressEnterInSaveForm = async (page: Page): Promise<void> => {
  await page.locator("#save-name").press("Enter");
};

/** Close the save panel with its button, and wait for the drawer to close */
export const closeSaveDrawer = async (page: Page): Promise<void> => {
  await page.click('[data-setting="save"]');
  await assertSettingsDrawerOpen(page, false);
};

/** Save the sprite in the browser, and wait for the drawer to close */
export const saveInBrowser = async (
  page: Page,
  title: string,
  description?: string
): Promise<void> => {
  await openSaveSettingsPanel(page);
  await page.locator("#save-name").fill(title);
  if (description !== undefined) {
    await page.locator("#save-description").fill(description);
  }
  await getSaveInBrowserButton(page).click();
  await assertSettingsDrawerOpen(page, false);
};

const EXPORT_DOWNLOAD_BUTTONS = {
  png: '[data-test-id="png-download-button"]',
  pixi: ".png-pixi-download-button",
  gif: '[data-test-id="gif-download-button"]',
  zip: '[data-test-id="zip-download-button"]',
  c: '[data-test-id="c-file-download-button"]'
};

/** A download button of the export drawer */
export const getExportDownloadButton = (
  page: Page,
  button: keyof typeof EXPORT_DOWNLOAD_BUTTONS
): Locator => page.locator(EXPORT_DOWNLOAD_BUTTONS[button]);

/** Make the browser's storage refuse every save */
export const makeBrowserSavesFail = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const refuse = () => {
      throw new Error("storage refused");
    };
    IDBObjectStore.prototype.add = refuse;
    IDBObjectStore.prototype.put = refuse;
  });

/** Make the browser refuse to create the file of every download */
export const makeDownloadsFail = (page: Page): Promise<void> =>
  page.evaluate(() => {
    window.URL.createObjectURL = () => {
      throw new Error("download refused");
    };
  });

/**
 * Start recording each change of the disabled state of the two save buttons, as
 * saves finish too quickly to catch that state otherwise.
 */
export const recordSaveButtonsDisabledStates = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const browserButton = document.querySelector("#save-localstorage-button")!;
    const fileButton = document.querySelector("#save-file-download-button")!;
    const states: boolean[][] = [];
    (window as any).saveButtonsDisabledStates = states;
    new MutationObserver(() => {
      states.push([
        browserButton.hasAttribute("disabled"),
        fileButton.hasAttribute("disabled")
      ]);
    }).observe(browserButton, { attributes: true });
  });

/** Read the states recorded by recordSaveButtonsDisabledStates */
export const getSaveButtonsDisabledStates = (page: Page): Promise<boolean[][]> =>
  page.evaluate(() => (window as any).saveButtonsDisabledStates);

/** Do something that downloads a file, and return the name given to the file */
export const getDownloadFileName = async (
  page: Page,
  click: () => Promise<void>
): Promise<string> => {
  const downloadPromise = page.waitForEvent("download");
  await click();
  return (await downloadPromise).suggestedFilename();
};

/** Open the Browse Local Saves dialog */
export const openBrowseLocalSaves = async (page: Page): Promise<void> => {
  await openImportSettingsPanel(page);
  await page.locator(".browse-local-button").click();
  await assertDialogOpen(page, "browse-local");
};

/** Check the titles listed in the Browse Local Saves dialog */
export const assertLocalSaves = async (
  page: Page,
  titles: string[]
): Promise<void> => {
  await expect(
    page.locator(".local-piskel-item .local-piskel-name")
  ).toHaveText(titles);
};

/** Check the dates listed in the Browse Local Saves dialog */
export const assertLocalSaveDates = async (
  page: Page,
  dates: string[]
): Promise<void> => {
  await expect(
    page.locator(".local-piskel-item .local-piskel-save-date")
  ).toHaveText(dates);
};

/** Click the delete button of a local save, and answer its confirmation */
export const clickDeleteLocalSave = async (
  page: Page,
  title: string,
  { accept }: { accept: boolean }
): Promise<void> => {
  page.once("dialog", (dialog) =>
    accept ? dialog.accept() : dialog.dismiss()
  );
  await page.locator(`[data-action="delete"][data-name="${title}"]`).click();
};

/** Load a sprite from the Browse Local Saves dialog, accepting the confirmation */
export const loadLocalSave = async (
  page: Page,
  title: string
): Promise<void> => {
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator(`[data-action="load"][data-name="${title}"]`).click();
};

/**
 * Let time pass on the clock of openEditorWithFakeClock, then give a backup started
 * by that time a moment to reach the browser's storage.
 */
export const letTimePass = async (page: Page, ms: number): Promise<void> => {
  await page.clock.fastForward(ms);
  await wait(200);
};

/**
 * Open the Browse Backups dialog in a new tab, as backups of the current session
 * aren't listed. Close that tab before letting time pass again, so that it can't
 * make backups of its own.
 */
export const openBackupsInNewTab = async (page: Page): Promise<Page> => {
  const tab = await openEditorInNewPage(page);
  await openImportSettingsPanel(tab);
  await testId(tab, "browse-backups-button").click();
  await expect(tab.locator(".backups-wizard-container")).toBeAttached();
  return tab;
};

/** Send the event a browser sends when a page is about to close, without closing it */
export const sendPageClosingEvent = (page: Page): Promise<void> =>
  page.evaluate(() => {
    window.dispatchEvent(new Event("beforeunload", { cancelable: true }));
  });

/** Check the titles of the sessions listed in the Browse Backups dialog */
export const assertBackupSessions = async (
  page: Page,
  titles: string[]
): Promise<void> => {
  await expect(
    page.locator(".session-item .session-details-title")
  ).toHaveText(titles);
};

/** Check the message of the Browse Backups dialog when there's no backup at all */
export const assertNoBackupSession = async (page: Page): Promise<void> => {
  await expect(page.locator(".session-list-empty")).toHaveText(
    "No session found ..."
  );
};

/** Show the snapshots of a session, and check how many there are */
export const viewBackupSession = async (
  page: Page,
  sessionIndex: number,
  snapshotCount: number
): Promise<void> => {
  await page
    .locator('.session-item [data-action="view"]')
    .nth(sessionIndex)
    .click();
  await expect(page.locator(".snapshot-item")).toHaveCount(snapshotCount);
};

/** Restore a snapshot of the session shown, accepting the confirmation */
export const restoreSnapshot = async (
  page: Page,
  snapshotIndex: number
): Promise<void> => {
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator('.snapshot-item [data-action="load"]')
    .nth(snapshotIndex)
    .click();
  await assertNoDialogOpen(page);
};

/**
 * Click the delete button of a session, and answer its confirmation. The event is
 * sent directly, as the button can be outside of the viewport.
 */
export const clickDeleteBackupSession = async (
  page: Page,
  sessionIndex: number,
  { accept }: { accept: boolean }
): Promise<void> => {
  page.once("dialog", (dialog) =>
    accept ? dialog.accept() : dialog.dismiss()
  );
  await page
    .locator('.session-item [data-action="delete"]')
    .nth(sessionIndex)
    .dispatchEvent("click");
};

/** Hold shift and drag the selection, to move its content along with it */
export const moveSelectionContent = async (
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): Promise<void> => {
  await page.keyboard.down("Shift");
  await dragBetweenPixels(page, x1, y1, x2, y2);
  await page.keyboard.up("Shift");
};

/** Move the mouse over a pixel of the sprite */
export const hoverPixel = async (
  page: Page,
  col: number,
  row: number
): Promise<void> => {
  const { x, y } = await getPixelScreenPosition(page, col, row);
  await page.mouse.move(x, y);
};

/** Check the cursor shown while the mouse is over the canvas */
export const assertCanvasCursor = async (
  page: Page,
  cursor: string | RegExp
): Promise<void> => {
  await expect(page.locator(".drawing-canvas-container")).toHaveCSS(
    "cursor",
    cursor
  );
};

// The clipboard helpers below send the browser's clipboard events with their own
// data, as the real clipboard can carry over between tests. The data copied
// by a test is returned, so that the test can paste it, even in another tab.

/** Send a copy or cut event, and return the text the app puts in the clipboard */
const sendCopyOrCutEvent = (page: Page, type: "copy" | "cut"): Promise<string> =>
  page.evaluate((type) => {
    const clipboardData = new DataTransfer();
    window.dispatchEvent(
      new ClipboardEvent(type, { clipboardData, cancelable: true })
    );
    return clipboardData.getData("text/plain");
  }, type);

/** Copy the selection, and return the text the app puts in the clipboard */
export const copySelection = (page: Page): Promise<string> =>
  sendCopyOrCutEvent(page, "copy");

/** Cut the selection, and return the text the app puts in the clipboard */
export const cutSelection = (page: Page): Promise<string> =>
  sendCopyOrCutEvent(page, "cut");

/** Paste with this text in the clipboard */
export const pasteClipboardText = (page: Page, text: string): Promise<void> =>
  page.evaluate((text) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData("text/plain", text);
    window.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData, cancelable: true })
    );
  }, text);

/** Paste with nothing in the clipboard */
export const pasteEmptyClipboard = (page: Page): Promise<void> =>
  page.evaluate(() => {
    window.dispatchEvent(
      new ClipboardEvent("paste", {
        clipboardData: new DataTransfer(),
        cancelable: true
      })
    );
  });

/** Paste with this image in the clipboard */
export const pasteClipboardImage = (page: Page, file: TestFile): Promise<void> =>
  page.evaluate(({ name, mimeType, base64 }) => {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const clipboardData = new DataTransfer();
    clipboardData.items.add(new File([bytes], name, { type: mimeType }));
    window.dispatchEvent(
      new ClipboardEvent("paste", { clipboardData, cancelable: true })
    );
  }, file);

/** Trigger undo via keyboard */
export const undo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+z`);
};

/** Trigger redo via keyboard */
export const redo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+y`);
};

/**
 * Open the editor, and wait for its canvas to settle. Needed before changing the zoom,
 * as the editor resets the zoom shortly after loading, which would undo the change.
 */
export const openEditorWithSettledCanvas = async (page: Page): Promise<void> => {
  await openEditor(page);
  await screenshotSettledCanvas(page);
};

/** Build a fully transparent grid, for setPiskelFromGrid */
export const emptyGrid = (width: number, height: number): TestGrid =>
  Array.from({ length: height }, () => Array(width).fill("T"));

/** Size in screen pixels of the area where the sprite is displayed */
export const getDrawingAreaSize = (
  page: Page
): Promise<{ width: number; height: number }> =>
  page
    .locator(".drawing-canvas")
    .evaluate((canvas: HTMLCanvasElement) => ({
      width: canvas.width,
      height: canvas.height
    }));

/** Check the zoom level shown in the bottom bar, such as 1.5 for "x1.50" */
export const assertZoom = async (page: Page, zoom: number): Promise<void> => {
  await expect(
    testId(page, "cursor-coordinates").locator(".drawing-zoom")
  ).toHaveText(`x${zoom.toFixed(2)}`);
};

/** Read the zoom level shown in the bottom bar */
export const readZoom = async (page: Page): Promise<number> => {
  const text = await testId(page, "cursor-coordinates")
    .locator(".drawing-zoom")
    .innerText();
  return parseFloat(text.slice(1));
};

/** Check the size of the sprite shown in the bottom bar */
export const assertSpriteSize = async (
  page: Page,
  width: number,
  height: number
): Promise<void> => {
  await expect(testId(page, "cursor-coordinates")).toContainText(
    `[${width}x${height}]`
  );
};

/**
 * Move the mouse to a position in the drawing area and read the hovered pixel from
 * the bottom bar, as "x:y", or "" outside the sprite. The position is a fraction of
 * the area: 0 is its top or left edge, 1 its bottom or right edge. Wrap this in
 * expect.poll, as a mouse move can be dropped.
 */
export const readPixelAtDrawingAreaPosition = async (
  page: Page,
  xFraction: number,
  yFraction: number
): Promise<string> => {
  const box = await page.locator(".drawing-canvas").boundingBox();
  // Stay 2 pixels inside the area, as the position is measured from its edges.
  const x = box.x + 2 + (box.width - 4) * xFraction;
  const y = box.y + 2 + (box.height - 4) * yFraction;
  return readPixelAtScreenPosition(page, x, y);
};

/** Move the mouse to a position on the screen and read the hovered pixel from the bottom bar */
const readPixelAtScreenPosition = async (
  page: Page,
  x: number,
  y: number
): Promise<string> => {
  // Two moves, as moving to the current position sends no event.
  await page.mouse.move(x + 1, y);
  await wait(20);
  await page.mouse.move(x, y);
  await wait(20);
  const text = await testId(page, "cursor-coordinates").innerText();
  return text.match(/\]\s*(\d+:\d+)/)?.[1] ?? "";
};

/**
 * Count the sprite pixels between two positions in the middle of the drawing area, a
 * number of screen pixels apart. Wrap this in expect.poll, as a mouse move can be dropped.
 */
export const countSpritePixelsAcross = async (
  page: Page,
  screenPixels: number
): Promise<number> => {
  const box = await page.locator(".drawing-canvas").boundingBox();
  const y = box.y + box.height / 2;
  const left = box.x + box.width / 2;
  const column = (pixel: string) => Number(pixel.split(":")[0]);
  const first = await readPixelAtScreenPosition(page, left, y);
  const last = await readPixelAtScreenPosition(page, left + screenPixels, y);
  return column(last) - column(first);
};

/** A position in the top-left corner of the drawing area, in the gray around a small sprite */
export const getGrayAreaPosition = async (
  page: Page
): Promise<{ x: number; y: number }> => {
  const box = await page.locator(".drawing-canvas").boundingBox();
  return { x: box.x + 5, y: box.y + 5 };
};

/** A position on the button of a tool */
export const getToolPosition = async (
  page: Page,
  toolId: string
): Promise<{ x: number; y: number }> => {
  const box = await page.locator(`[data-tool-id="${toolId}"]`).boundingBox();
  return { x: box.x + 5, y: box.y + 5 };
};

/** Check the first and last rows visible in the middle column of the drawing area */
export const assertVisibleRows = async (
  page: Page,
  firstRow: number,
  lastRow: number
): Promise<void> => {
  const readRow = async (yFraction: number) => {
    const pixel = await readPixelAtDrawingAreaPosition(page, 0.5, yFraction);
    return Number(pixel.split(":")[1]);
  };
  await expect
    .poll(async () => [await readRow(0), await readRow(1)])
    .toEqual([firstRow, lastRow]);
};

/** Read the [r, g, b, a] color displayed at a position in the drawing area, as a fraction of it */
export const readDrawingAreaColor = (
  page: Page,
  xFraction: number,
  yFraction: number
): Promise<number[]> =>
  page.locator(".drawing-canvas").evaluate(
    (canvas: HTMLCanvasElement, { xFraction, yFraction }) => {
      const x = Math.floor((canvas.width - 1) * xFraction);
      const y = Math.floor((canvas.height - 1) * yFraction);
      return Array.from(canvas.getContext("2d").getImageData(x, y, 1, 1).data);
    },
    { xFraction, yFraction }
  );

/**
 * Right-click at a position on the screen, and return whether the browser would show
 * its context menu there.
 */
export const rightClickAndCheckBrowserMenu = async (
  page: Page,
  position: { x: number; y: number }
): Promise<boolean> => {
  // The app can stop the event, so listen before it reaches the app, and read the
  // result once the event is over.
  const isPrevented = page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        window.addEventListener(
          "contextmenu",
          (event) => setTimeout(() => resolve(event.defaultPrevented)),
          { capture: true, once: true }
        );
      })
  );
  await page.mouse.click(position.x, position.y, { button: "right" });
  return !(await isPrevented);
};

/** Tap a pixel of the sprite on a touch screen */
export const tapPixel = async (
  page: Page,
  col: number,
  row: number
): Promise<void> => {
  const { x, y } = await getPixelScreenPosition(page, col, row);
  await page.touchscreen.tap(x, y);
};

/** Drag a finger between two pixels of the sprite on a touch screen */
export const dragFingerBetweenPixels = async (
  page: Page,
  from: { col: number; row: number },
  to: { col: number; row: number }
): Promise<void> => {
  const start = await getPixelScreenPosition(page, from.col, from.row);
  const end = await getPixelScreenPosition(page, to.col, to.row);
  // Playwright can only tap, so send the touches through the browser's own protocol.
  const client = await page.context().newCDPSession(page);
  const touch = (type: string, x?: number, y?: number) =>
    client.send("Input.dispatchTouchEvent", {
      type: type as "touchStart" | "touchMove" | "touchEnd",
      touchPoints: x === undefined ? [] : [{ x, y }]
    });
  await touch("touchStart", start.x, start.y);
  const steps = 6;
  for (let step = 1; step <= steps; step++) {
    await touch(
      "touchMove",
      start.x + ((end.x - start.x) * step) / steps,
      start.y + ((end.y - start.y) * step) / steps
    );
    await wait(30);
  }
  await touch("touchEnd");
};

/** Resize the sprite with the resize panel, without keeping its proportions or scaling its content */
export const resizeSprite = async (
  page: Page,
  width: number,
  height: number
): Promise<void> => {
  await openResizeSettingsPanel(page);
  await page.locator(".resize-ratio-checkbox").uncheck();
  await page.locator('[name="resize-width"]').fill(String(width));
  await page.locator('[name="resize-height"]').fill(String(height));
  await page.locator(".resize-content-checkbox").uncheck();
  await page.locator(".resize-button").click();
  await assertSpriteSize(page, width, height);
};

/** Crop the sprite to its content */
export const cropSprite = async (page: Page): Promise<void> => {
  await page.locator('[data-tool-id="tool-crop"]').click();
};

/** Open the grid preferences, and turn on the grid with visible lines */
export const enableVisibleGrid = async (page: Page): Promise<void> => {
  await page.locator('[data-setting="user"]').click();
  await page.locator('[data-tab-id="grid"]').click();
  await page.locator('.grid-colors-item[data-color="#FF004D"]').click();
  await page.locator(".enable-grid-checkbox").check();
};

/** Pick the width of the grid lines in the grid preferences */
export const setGridLineWidth = async (
  page: Page,
  width: number
): Promise<void> => {
  await page
    .locator(`.grid-size-container .size-picker-option[data-size="${width}"]`)
    .click();
};

/** Pick the number of pixels between the grid lines in the grid preferences */
export const setGridSpacing = async (
  page: Page,
  spacing: number
): Promise<void> => {
  await page
    .locator(
      `.grid-spacing-container .size-picker-option[data-size="${spacing}"]`
    )
    .click();
};

/**
 * Read the vertical lines of the grid enabled by enableVisibleGrid: how many are
 * displayed across the first row of the sprite, and the width of each one in screen
 * pixels. A line between two screen pixels shares its width between them.
 */
export const readGridLines = async (
  page: Page,
  spriteHeight: number
): Promise<{ count: number; widths: number[] }> => {
  const zoom = await readZoom(page);
  return page.locator(".drawing-canvas").evaluate(
    (canvas: HTMLCanvasElement, { zoom, spriteHeight }) => {
      const spriteTop = Math.max(0, (canvas.height - zoom * spriteHeight) / 2);
      const { data } = canvas
        .getContext("2d")
        .getImageData(0, Math.floor(spriteTop + zoom / 2), canvas.width, 1);
      const widths: number[] = [];
      let width = 0;
      for (let x = 0; x < canvas.width; x++) {
        // The red of the grid, not the gray around the sprite.
        const [r, g, a] = [data[x * 4], data[x * 4 + 1], data[x * 4 + 3]];
        if (a > 0 && r > g) {
          width += a / 255;
        } else if (width > 0) {
          widths.push(Math.round(width));
          width = 0;
        }
      }
      return { count: widths.length, widths: [...new Set(widths)] };
    },
    { zoom, spriteHeight }
  );
};

/** Check whether the performance warning icon shows */
export const assertPerformanceIcon = async (
  page: Page,
  isVisible: boolean
): Promise<void> => {
  const icon = expect(page.locator(".performance-link"));
  await (isVisible ? icon : icon.not).toHaveClass(/visible/);
};

/** Check that the dialog about performance is open */
export const assertPerformanceDialogOpen = async (page: Page): Promise<void> => {
  await expect(page.locator(".dialog-performance-info-body")).toBeVisible();
};

/** Click the link of the notification */
export const clickNotificationLink = async (page: Page): Promise<void> => {
  await page.locator("#user-message a").click();
};

/**
 * Start opening the editor with the app's script held back, so that the page stays on
 * its loading screen. Returns a function that lets the script load, and waits for the
 * editor to be ready.
 */
export const startOpeningEditorWithoutItsScript = async (
  page: Page
): Promise<() => Promise<void>> => {
  let letScriptLoad: () => void;
  const scriptAllowed = new Promise<void>((resolve) => {
    letScriptLoad = resolve;
  });
  await page.route(/piskel-packaged/, async (route) => {
    await scriptAllowed;
    await route.continue();
  });
  const opening = page.goto(EDITOR_PATH);
  return async () => {
    letScriptLoad();
    await opening;
    await waitForEditorReady(page);
  };
};

/** The screen shown while the editor loads */
export const getLoadingScreen = (page: Page): Locator =>
  page.locator("#loading-mask");

/** Check that the dialog warning about the browser is open, and names this browser */
export const assertUnsupportedBrowserWarning = async (
  page: Page,
  browserName: string
): Promise<void> => {
  await assertDialogOpen(page, "unsupported-browser");
  await expect(page.locator("#dialog-container")).toContainText(
    "is not supported"
  );
  await expect(page.locator("#current-user-agent")).toHaveText(browserName);
};

/** Check that the dialog warning about the browser doesn't open at startup */
export const assertNoUnsupportedBrowserWarning = async (
  page: Page
): Promise<void> => {
  // Give a dialog time to appear, as the check below would pass straight away.
  await wait(500);
  await assertNoDialogOpen(page);
};

/**
 * Make the app's background workers wait: their messages are kept until the test lets
 * them go, so that a task takes as long as the test needs. Let the clock settle first,
 * so that only the task being tested is waiting.
 */
export const holdBackgroundWork = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const heldWork: Array<() => void> = [];
    const postMessage = Worker.prototype.postMessage;
    Worker.prototype.postMessage = function (...args: [any]) {
      heldWork.push(() => postMessage.apply(this, args));
    };
    (window as any).heldWork = heldWork;
  });

/** Wait for a background task to be waiting, for the tasks that start after loading a file */
export const waitForHeldBackgroundWork = async (page: Page): Promise<void> => {
  await expect
    .poll(() => page.evaluate(() => (window as any).heldWork.length))
    .toBeGreaterThan(0);
};

/** Let the oldest message held by holdBackgroundWork reach its worker */
export const releaseBackgroundWorkStep = (page: Page): Promise<void> =>
  page.evaluate(() => (window as any).heldWork.shift()());

/** Stop the fake clock, so that time only passes with runClock */
export const pauseClock = async (page: Page): Promise<void> => {
  const pageTime = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(pageTime + 1000);
};

/** Let time pass on a clock stopped by pauseClock, running each timer that comes due */
export const runClock = async (page: Page, ms: number): Promise<void> => {
  await page.clock.runFor(ms);
};

/** Check the name and the percentage shown by the progress bar */
export const assertProgressBar = async (
  page: Page,
  name: string,
  percentage: string
): Promise<void> => {
  await expect(page.locator(".progress-bar-name")).toHaveText(name);
  await expect(page.locator(".progress-bar-status")).toHaveText(percentage);
};

/** Check that no progress bar shows */
export const assertNoProgressBar = async (page: Page): Promise<void> => {
  await expect(page.locator(".progress-bar-container")).toHaveCount(0);
};

/** Colors of an export, by frame and position, as [r, g, b, a] */
type ExportedFrames = {
  frameCount: number;
  rgbaAt: (frame: number, x: number, y: number) => number[];
};

const decodePng = (file: Buffer) => {
  const png = new PNG(file);
  const pixels = png.decodePixels();
  return {
    rgbaAt: (x: number, y: number) => {
      const i = (y * png.width + x) * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
    }
  };
};

/** Download the ZIP export, with its PNG files in the order of the frames */
export const downloadZipExport = async (
  page: Page
): Promise<ExportedFrames> => {
  await selectExportTab(page, "zip");
  const file = await saveDownload(page, () =>
    getExportDownloadButton(page, "zip").click()
  );
  const frames = new AdmZip(file)
    .getEntries()
    .sort((a, b) => a.entryName.localeCompare(b.entryName))
    .map((entry) => decodePng(entry.getData()));
  return {
    frameCount: frames.length,
    rgbaAt: (frame, x, y) => frames[frame].rgbaAt(x, y)
  };
};

/** Download the PixiJS export, and find each frame in its spritesheet with its JSON file */
export const downloadPixiExport = async (
  page: Page
): Promise<ExportedFrames> => {
  await selectExportTab(page, "png");
  const file = await saveDownload(page, () =>
    getExportDownloadButton(page, "pixi").click()
  );
  const zip = new AdmZip(file);
  const entry = (extension: string) =>
    zip.getEntries().find((e) => e.entryName.endsWith(extension));
  const json = JSON.parse(entry(".json").getData().toString("utf-8"));
  const rects = Object.values<any>(json.frames).map((frame) => frame.frame);
  const spritesheet = decodePng(entry(".png").getData());
  return {
    frameCount: rects.length,
    rgbaAt: (frame, x, y) =>
      spritesheet.rgbaAt(rects[frame].x + x, rects[frame].y + y)
  };
};

/** Download the C file export, and read its pixels written as 0xAABBGGRR */
export const downloadCFileExport = async (
  page: Page,
  spriteWidth: number
): Promise<ExportedFrames> => {
  await selectExportTab(page, "misc");
  const file = await saveDownload(page, () =>
    getExportDownloadButton(page, "c").click()
  );
  const frames = [...file.toString("utf-8").matchAll(/\{([^{}]+)\}/g)].map(
    (match) => match[1].match(/0x[0-9a-f]{8}/g)
  );
  return {
    frameCount: frames.length,
    rgbaAt: (frame, x, y) => {
      const hex = frames[frame][y * spriteWidth + x];
      const channel = (start: number) =>
        parseInt(hex.slice(start, start + 2), 16);
      return [channel(8), channel(6), channel(4), channel(2)];
    }
  };
};
