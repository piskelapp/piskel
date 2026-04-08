import { Page, expect } from '@playwright/test';
import os from 'os';

/** The modifier key for keyboard shortcuts: Meta on macOS, Control elsewhere. */
export const CMD_OR_CTRL = os.platform() === 'darwin' ? 'Meta' : 'Control';

/** The modifier label as displayed in the Piskel UI (e.g. cheatsheet): "cmd" on macOS, "ctrl" elsewhere. */
export const MODIFIER_LABEL = os.platform() === 'darwin' ? 'cmd' : 'ctrl';

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
  await page.waitForSelector('#drawing-canvas-container canvas', { state: 'attached' });
};

export const openEditor = async (page: Page) => {
  await page.goto(EDITOR_PATH);
  await waitForEditorReady(page);
}

export async function expectHasClass(page: Page, selector: string, className: string) {
  const locator = page.locator(selector);
  const hasClass = await locator.evaluate((el, cls) => el.classList.contains(cls), className);
  expect(hasClass).toBe(true);
}

export async function expectHasNotClass(page: Page, selector: string, className: string) {
  const locator = page.locator(selector);
  const hasClass = await locator.evaluate((el, cls) => el.classList.contains(cls), className);
  expect(hasClass).toBe(false);
}

export const setPiskelFromImageSrc = async(page: Page, base64Image: string): Promise<void> => {
  return page.evaluate((base64Image) => {
      window.pskl.utils.FrameUtils.createFromImageSrc(base64Image, false, (frame: any) => {
        var layer = window.pskl.model.Layer.fromFrames("l1", [frame]);
        var piskel = window.pskl.model.Piskel.fromLayers([layer], 12, {
          name: "piskel",
          description: "description"
        });
        window.pskl.app.piskelController.setPiskel(piskel);
      });
  }, base64Image);
};

type TestColor = "R" | "G" | "B" | "T";
type TestGrid = Array<Array< TestColor>>;

export const setPiskelFromGrid = async(page: Page, grid: TestGrid): Promise<void> => {
  return page.evaluate((grid) => {

      const convertedGrid: Array<Array<string>> = grid.map(row => row.map(() => ""));;
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
      const layer = window.pskl.model.Layer.fromFrames("l1", [frame]);
      const piskel = window.pskl.model.Piskel.fromLayers([layer], 12, {name : "test", description : ""});
      window.pskl.app.piskelController.setPiskel(piskel);
  }, grid);
};

export const expectGrid = async(page: Page, grid: TestGrid, layerIndex: number = 0, frameIndex: number = 0): Promise<boolean> => {
  return page.evaluate((param) => {
      const expectedGrid: Array<Array<string>> = param.grid.map(row => row.map(() => ""));;
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
      const frame = piskel.getLayerAt(param.layerIndex).getFrameAt(param.frameIndex);

      const log: Array<[any, TestColor]> = [];
      let isValid = true;

      frame.forEachPixel((color: any, col: any, row: any) => {
        if (window.pskl.utils.colorToInt(color) !== window.pskl.utils.colorToInt(expectedGrid[row][col])) {
          log.push([color, param.grid[row][col]]);
        }
        isValid = isValid && window.pskl.utils.colorToInt(color) === window.pskl.utils.colorToInt(expectedGrid[row][col]);
      });
      return isValid;
  }, {grid, layerIndex, frameIndex});
};

export const isResizeDrawerCollapsed = async(page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
      const settingsElement = document.querySelector('[data-pskl-controller="settings"]')
      return !!settingsElement && settingsElement.classList.contains('expanded');
  })
};

export const getCurrentPiskelWidth = async(page: Page): Promise<number> => {
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.getPiskel().getWidth();
  })
};

export const getCurrentPiskelHeight = async(page: Page): Promise<number> => {
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.getPiskel().getHeight();
  });
};

export const getCurrentPiskelFrameCount = async(page: Page): Promise<number> => {
  return await page.locator('[data-test-id="frame-tile"]').count();
};

export const getCurrentPiskelLayerCount = async(page: Page): Promise<number> => {
  return await page.locator('[data-test-id="layer-item"]').count();
};

export const getCurrentPiskelColorCount = async(page: Page): Promise<number> => {
  return await page.locator('.palettes-list-color').count();
};

export const isCurrentPiskelEmpty = async(page: Page): Promise<boolean> => {
  // Check if all palette colors show only transparent (no drawn colors)
  const colorCount = await page.locator('.palettes-list-color:not([data-color="TRANSPARENT"])').count();
  return colorCount === 0;
};

export const isSettingsDrawerExpanded = async(page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
      const settingsElement = document.querySelector('[data-pskl-controller="settings"]')
      return !!settingsElement && settingsElement.classList.contains('expanded');
  });
};

export const openResizeSettingsPanel = async(page: Page): Promise<void> => {
  await page.click('[data-setting="resize"]');
  await expect(page.locator('.settings-section-resize')).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
  await expect(page.locator('.settings-section-resize')).toBeAttached();
};

export const openImportSettingsPanel = async(page: Page): Promise<void> => {
  await page.click('[data-setting="import"]');
  await expect(page.locator('.settings-section-import')).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
  await expect(page.locator('.settings-section-import')).toBeAttached();
};

export const openExportSettingsPanel = async(page: Page): Promise<void> => {
  await page.click('[data-setting="export"]');
  await expect(page.locator('.settings-section-export')).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
  await expect(page.locator('.settings-section-export')).toBeAttached();
};

export const expectResizeValues = async(page: Page, expectedWidth: string, expectedHeight: string): Promise<void> => {
  const widthInputLocator = page.locator('[name="resize-width"]');
  const heightInputLocator = page.locator('[name="resize-height"]');
  await expect(widthInputLocator).toBeAttached();
  await expect(heightInputLocator).toBeAttached();

  await expect(widthInputLocator).toHaveValue(expectedWidth);
  await expect(heightInputLocator).toHaveValue(expectedHeight);
};

export const expectDefaultResizeValues = async(page: Page, expectedWidth: string, expectedHeight: string): Promise<void> => {
  const defaultWidthInputLocator = page.locator('[name="default-width"]');
  const defaultHeightInputLocator = page.locator('[name="default-height"]');
  await expect(defaultWidthInputLocator).toBeAttached();
  await expect(defaultHeightInputLocator).toBeAttached();

  await expect(defaultWidthInputLocator).toHaveValue(expectedWidth);
  await expect(defaultHeightInputLocator).toHaveValue(expectedHeight);
};

export const openSaveSettingsPanel = async(page: Page): Promise<void> => {
  await page.click('[data-setting="save"]');
  await expect(page.locator('.settings-section-save')).toBeAttached();
  expect(await isSettingsDrawerExpanded(page)).toBe(true);
};

/** data-test-id locator shorthand */
export const testId = (page: Page, id: string) => page.locator(`[data-test-id="${id}"]`);

/** Locator for all frame tiles in the timeline */
export const getFrameTiles = (page: Page) => testId(page, 'frame-tile');

/** Locator for the "Add new frame" button */
export const getAddFrameButton = (page: Page) => testId(page, 'add-frame-button');

/** Locator for the "Add layer" button */
export const getAddLayerButton = (page: Page) => testId(page, 'layer-add-button');

/** Locator for all layer items in the layers panel */
export const getLayerItems = (page: Page) => testId(page, 'layer-item');

/** Locator for all layer name elements in the layers panel */
export const getLayerNameLocators = (page: Page) => testId(page, 'layer-name');

/** Locator for the "Move layer up" button */
export const getMoveLayerUpButton = (page: Page) => testId(page, 'layer-move-up-button');

/** Locator for the "Move layer down" button */
export const getMoveLayerDownButton = (page: Page) => testId(page, 'layer-move-down-button');

/** Locator for the "Merge layer down" button */
export const getMergeLayerButton = (page: Page) => testId(page, 'layer-merge-button');

/** Locator for the "Delete layer" button */
export const getDeleteLayerButton = (page: Page) => testId(page, 'layer-delete-button');

/** Locator for all layer opacity (α) buttons */
export const getAllLayerOpacityButtons = (page: Page) => testId(page, 'layer-opacity');

/** Locator for a pen size option button (1-4) */
export const getPenSizeButton = (page: Page, size: number) => testId(page, `pen-size-${size}`);

/** Get the currently selected pen size from the DOM (.selected class on pen-size-option) */
export const getSelectedPenSize = async (page: Page): Promise<number> => {
  const selected = page.locator('.pen-size-option.selected');
  const size = await selected.getAttribute('data-size');
  return parseInt(size ?? '1', 10);
};

/**
 * Convert a hex color string to Piskel's ABGR integer format.
 * Matches the format returned by getPixelColor().
 * Transparent (alpha=0) maps to 0.
 */
export const colorToInt = (hex: string): number => {
  // Remove # prefix
  const h = hex.replace('#', '');
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
  await expect(page.locator(`[data-tool-id="${toolId}"]`)).toHaveClass(/selected/);
};

/** Get the currently selected tool id from the DOM (.selected class) */
export const getSelectedToolId = async (page: Page): Promise<string> => {
  const selected = page.locator('[data-tool-id].selected');
  return await selected.getAttribute('data-tool-id') ?? '';
};

/**
 * Draw a pixel at (col, row) by performing a real mouse click on the canvas.
 * Uses renderer.reverseCoordinates as a coordinate bridge, but the actual
 * drawing goes through the full mouse event pipeline.
 * Waits for renderer layout to settle before computing coordinates.
 */
export const drawAtPixel = async (page: Page, col: number, row: number): Promise<void> => {
  // Wait for any pending relayout (DrawingController uses setTimeout(200) for relayout)
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 200)));
  const coords = await page.evaluate(({ col, row }) => {
    // reverseCoordinates already adds cellSize/2 to center within the pixel
    return window.pskl.app.drawingController.getScreenCoordinates(col, row);
  }, { col, row });
  await page.mouse.click(coords.x, coords.y);
};

/**
 * Get the color at (col, row) on a given frame by reading the frame tile
 * canvas pixel data from the DOM. Returns the RGBA as a 32-bit integer.
 * Note: This reads from the model as there is no DOM representation of
 * individual pixel colors at arbitrary layer/frame indices.
 */
export const getPixelColor = async (page: Page, col: number, row: number, layerIndex = 0, frameIndex = 0): Promise<number> => {
  return await page.evaluate(({ col, row, layerIndex, frameIndex }) => {
    const piskel = window.pskl.app.piskelController.getPiskel();
    const frame = piskel.getLayerAt(layerIndex).getFrameAt(frameIndex);
    return frame.getPixel(col, row);
  }, { col, row, layerIndex, frameIndex });
};

/** Get all displayed palette swatch colors as a sorted array of hex strings */
export const getPaletteColors = async (page: Page): Promise<string[]> => {
  const colors = await page.locator('.palettes-list-color').evaluateAll(
    els => els.map(el => el.getAttribute('data-color') ?? '').filter(c => c !== '')
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
export const readPixelGrid = async (page: Page, width: number, height: number, layerIndex = 0, frameIndex = 0): Promise<string[][]> => {
  return await page.evaluate(({ width, height, layerIndex, frameIndex }) => {
    const piskel = window.pskl.app.piskelController.getPiskel();
    const frame = piskel.getLayerAt(layerIndex).getFrameAt(frameIndex);
    const grid: string[][] = [];
    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        row.push(frame.getPixel(x, y) === 0 ? '.' : 'X');
      }
      grid.push(row);
    }
    return grid;
  }, { width, height, layerIndex, frameIndex });
};

/**
 * Drag from sprite pixel (x1,y1) to (x2,y2) via real mouse events.
 * Waits for any pending relayout before computing coordinates (same as drawAtPixel).
 */
export const dragBetweenPixels = async (
  page: Page, x1: number, y1: number, x2: number, y2: number, options?: { steps?: number }
): Promise<void> => {
  const steps = options?.steps ?? 5;
  // Wait for any pending relayout (DrawingController uses setTimeout(200) for relayout)
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 210)));
  const start = await page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: x1, row: y1 });
  const end = await page.evaluate(({ col, row }) =>
    window.pskl.app.drawingController.getScreenCoordinates(col, row), { col: x2, row: y2 });
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps });
  await page.mouse.up();
};

/**
 * Decode a PNG data URL via browser canvas and return pixel data.
 * Use this instead of comparing raw base64 strings, which vary across Chrome versions.
 */
export const decodePngDataUrl = async (page: Page, dataUrl: string): Promise<{ width: number, height: number, pixels: number[][] }> => {
  return page.evaluate(async (src: string) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, img.width, img.height).data;
    const pixels: number[][] = [];
    for (let i = 0; i < d.length; i += 4) pixels.push([d[i], d[i+1], d[i+2], d[i+3]]);
    return { width: img.width, height: img.height, pixels };
  }, dataUrl);
};

/** Simple async delay. Use sparingly — prefer waitFor for state checks. */
export const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Generic poll helper. Retries `fn` every `interval` ms until it returns true.
 * Fails after `timeout` ms. Use for any async state that needs time to settle.
 *
 * Example: await waitFor(async () => (await getPixelColor(page, 0, 0)) === TRANSPARENT);
 */
export const waitFor = async (
  fn: () => Promise<boolean>,
  { timeout = 5000, interval = 100, message }: { timeout?: number; interval?: number; message?: string } = {}
): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await fn()) return;
    await new Promise(r => setTimeout(r, interval));
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
  page: Page, col: number, row: number, expectedColor: number,
  { timeout = 2000, interval = 50, layerIndex = 0, frameIndex = 0 }:
  { timeout?: number; interval?: number; layerIndex?: number; frameIndex?: number } = {}
): Promise<void> => {
  await waitFor(
    async () => (await getPixelColor(page, col, row, layerIndex, frameIndex)) === expectedColor,
    { timeout, interval, message: `Pixel (${col},${row}) did not reach expected color within ${timeout}ms` }
  );
};

/**
 * Poll until the pixel grid matches the expected pattern.
 * Replaces immediate readPixelGrid + expect for flake-free shape verification.
 */
export const waitForGrid = async (
  page: Page, width: number, height: number, expectedGrid: string[],
  { layerIndex = 0, frameIndex = 0, timeout = 2000, interval = 50 }:
  { layerIndex?: number; frameIndex?: number; timeout?: number; interval?: number } = {}
): Promise<void> => {
  let lastGrid: string[] = [];
  await waitFor(async () => {
    const grid = await readPixelGrid(page, width, height, layerIndex, frameIndex);
    lastGrid = grid.map(r => r.join(''));
    return lastGrid.join('\n') === expectedGrid.join('\n');
  }, { timeout, interval, message: `Grid did not match expected pattern within ${timeout}ms.\nExpected:\n${expectedGrid.join('\n')}\nGot:\n${lastGrid.join('\n')}` });
};

/**
 * Set primary color via the Spectrum color picker UI.
 * Opens the picker, types the color in the input, and closes it.
 */
export const setPrimaryColor = async (page: Page, color: string): Promise<void> => {
  // Remove any lingering tooltips that might block clicks
  await page.evaluate(() => document.querySelectorAll('.tooltip').forEach(t => t.remove()));
  const replacer = page.locator('[data-test-id="primary-color-picker"]').locator('..').locator('.sp-replacer');
  await replacer.click();
  const container = page.locator('.sp-container:not(.sp-hidden)');
  await expect(container).toBeVisible();
  const input = container.locator('.sp-input');
  await input.fill(color);
  await input.press('Enter');
  // Dismiss the picker via Spectrum's hide API and restore keyboard focus
  await page.evaluate((selector) => {
    const $ = (window as any).$;
    $(selector).spectrum('hide');
    (document.activeElement as HTMLElement)?.blur();
  }, '[data-test-id="primary-color-picker"]');
};

/**
 * Set secondary color via the Spectrum color picker UI.
 */
export const setSecondaryColor = async (page: Page, color: string): Promise<void> => {
  await page.evaluate(() => document.querySelectorAll('.tooltip').forEach(t => t.remove()));
  const replacer = page.locator('[data-test-id="secondary-color-picker"]').locator('..').locator('.sp-replacer');
  await replacer.click();
  const container = page.locator('.sp-container:not(.sp-hidden)');
  await expect(container).toBeVisible();
  const input = container.locator('.sp-input');
  await input.fill(color);
  await input.press('Enter');
  await page.evaluate((selector) => {
    const $ = (window as any).$;
    $(selector).spectrum('hide');
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
    const el = document.querySelector('[data-test-id="primary-color-picker"]') as HTMLInputElement;
    const color = (window as any).$(el).spectrum('get');
    if (!color || color.getAlpha() === 0) {
      return 'rgba(0, 0, 0, 0)';
    }
    return color.toHexString();
  });
};

/**
 * Get the current secondary color by reading the Spectrum picker value.
 */
export const getSecondaryColor = async (page: Page): Promise<string> => {
  return await page.evaluate(() => {
    const el = document.querySelector('[data-test-id="secondary-color-picker"]') as HTMLInputElement;
    const color = (window as any).$(el).spectrum('get');
    if (!color || color.getAlpha() === 0) {
      return 'rgba(0, 0, 0, 0)';
    }
    return color.toHexString();
  });
};

/**
 * Get the name of the layer at given index by reading from the DOM.
 * Layers are rendered in reverse order in the DOM (top layer first),
 * so index 0 (bottom) is the last item.
 */
export const getLayerName = async (page: Page, index: number): Promise<string> => {
  // Get total layer count from DOM
  const count = await page.locator('[data-test-id="layer-item"]').count();
  // DOM order is reversed: layer index 0 is at position (count - 1) in DOM
  const domPosition = count - 1 - index;
  return await page.locator('[data-test-id="layer-name"]').nth(domPosition).innerText();
};

/** Get the current layer index from the DOM (.current-layer-item class) */
export const getCurrentLayerIndex = async (page: Page): Promise<number> => {
  const current = page.locator('.current-layer-item');
  const indexStr = await current.getAttribute('data-layer-index');
  return parseInt(indexStr ?? '0', 10);
};

/**
 * Get the current frame index from the DOM (.preview-tile.selected).
 * Waits briefly for the render loop to update the .selected class.
 */
export const getCurrentFrameIndex = async (page: Page): Promise<number> => {
  // The FramesListController updates .selected in its render() cycle,
  // which is async (requestAnimationFrame). Wait for one animation frame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  const selected = page.locator('.preview-tile.selected');
  const indexStr = await selected.getAttribute('data-tile-number');
  return parseInt(indexStr ?? '0', 10);
};

/** Trigger undo via keyboard */
export const undo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+z`);
};

/** Trigger redo via keyboard */
export const redo = async (page: Page): Promise<void> => {
  await page.keyboard.press(`${CMD_OR_CTRL}+y`);
};