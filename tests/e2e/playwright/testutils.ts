import { EDITOR_PATH } from "./constants";
import { Page, expect } from '@playwright/test';

export const openEditor = async (page: Page) => {
  await page.goto(EDITOR_PATH);
  await page.waitForSelector('#drawing-canvas-container canvas', { state: 'attached' });
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
      window.pskl.utils.FrameUtils.createFromImageSrc(base64Image, false, (frame) => {
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

      frame.forEachPixel((color, col, row) => {
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
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.getFrameCount();
  });
};

export const getCurrentPiskelLayerCount = async(page: Page): Promise<number> => {
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.getLayers().length;
  });
};

export const getCurrentPiskelColorCount= async(page: Page): Promise<number> => {
  return await page.evaluate(() => {
      return window.pskl.app.currentColorsService.getCurrentColors().length;
  });
};

export const isCurrentPiskelEmpty= async(page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.isEmpty();
  });
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