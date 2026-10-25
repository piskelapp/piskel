import test, { Page, expect } from "@playwright/test";
import { openEditor, setPiskelFromImageSrc } from "../../testutils";

const src_4_colors =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAH0lEQVQYV2P8z8DwnwEJMLL8' +
  'RxNQZfiPquI/wyQUAQBKSQi4ymBTpAAAAABJRU5ErkJggg=='

const src_16_colors =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAALUlEQVQYVzXDsQ0AIRADwbVE' +
  '+g0Q4IiGv+ElupEmgrTMLPFQZi66CzPySz/mA6UnC1iqHei4AAAAAElFTkSuQmCC';

const getPaletteColorCount = async(page: Page): Promise<number> => {
  return page.evaluate(() => {
      return window.document.querySelectorAll(".palettes-list-color").length
  });
};

test('Test palette switches to tiny mode if it contains more than 10 colors', async ({ page }) => {
  await openEditor(page);

  await setPiskelFromImageSrc(page, src_4_colors);
  await page.waitForSelector('.palettes-list-color:nth-child(4)', { state: 'attached' });
  await expect.poll(() => getPaletteColorCount(page)).toBe(4);
  await page.waitForSelector('.palettes-list-colors:not(.tiny)', { state: 'visible' });
  
  await setPiskelFromImageSrc(page, src_16_colors);
  await page.waitForSelector('.palettes-list-colors.tiny', { state: 'attached' });
  await expect.poll(() => getPaletteColorCount(page)).toBe(16);
  await page.waitForSelector('.palettes-list-colors.tiny', { state: 'visible' });
});