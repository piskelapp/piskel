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

export const isSettingsDrawerExpanded = async(page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
      const settingsElement = document.querySelector('[data-pskl-controller="settings"]')
      return !!settingsElement && settingsElement.classList.contains('expanded');
  })
};

export const isResizeDrawerCollapsed = async(page: Page): Promise<boolean> => {
  return await page.evaluate(() => {
      const settingsElement = document.querySelector('[data-pskl-controller="settings"]')
      return !!settingsElement && settingsElement.classList.contains('expanded');
  })
};

export const getCurrectPiskelWidth = async(page: Page): Promise<number> => {
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.getPiskel().getWidth();
  })
};

export const getCurrectPiskelHeight = async(page: Page): Promise<number> => {
  return await page.evaluate(() => {
      return window.pskl.app.piskelController.getPiskel().getHeight();
  })
};