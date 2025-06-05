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

export const getRequiredElementBySelector = (selector: string): Element => {
    const element = document.querySelector(selector)
    if (element === null) {
        throw new Error(`Element with selector "${selector}" not found`);
    }
    return element;
}