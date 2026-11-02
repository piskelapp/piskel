import test, { expect } from "@playwright/test";
import {
  openEditor,
  openResizeSettingsPanel,
  waitFor,
  wait,
} from "../../testutils";

/** Resize the canvas to a given size via the resize panel */
async function resizeCanvas(page: any, width: string, height: string) {
  await openResizeSettingsPanel(page);
  const ratioCheckbox = page.locator('.resize-ratio-checkbox');
  if (await ratioCheckbox.isChecked()) {
    await ratioCheckbox.uncheck();
  }
  await page.locator('[name="resize-width"]').fill(width);
  await page.locator('[name="resize-height"]').fill(height);

  // Uncheck resize-content so it just expands the canvas
  const contentCheckbox = page.locator('.resize-content-checkbox');
  if (await contentCheckbox.isChecked()) {
    await contentCheckbox.uncheck();
  }

  await page.click('.resize-button');
  await wait(500);
}

test.describe('Performance info dialog', () => {

  test('performance warning should not show on small canvas', async ({ page }) => {
    await openEditor(page);

    // Default 32x32 canvas — well under threshold
    const warningLink = page.locator('.performance-link');
    await expect(warningLink).not.toHaveClass(/visible/);
  });

  test('performance warning should appear on large canvas (>512x512)', async ({ page }) => {
    await openEditor(page);

    // Resize to 600x600 (exceeds 512x512 threshold)
    await resizeCanvas(page, '600', '600');

    // Warning icon should become visible
    const warningLink = page.locator('.performance-link');
    await waitFor(async () => {
      const cls = await warningLink.getAttribute('class') ?? '';
      return cls.includes('visible');
    });
    await expect(warningLink).toHaveClass(/visible/);
  });

  test('clicking warning icon should open performance dialog', async ({ page }) => {
    await openEditor(page);
    await resizeCanvas(page, '600', '600');

    // Wait for warning to appear
    const warningLink = page.locator('.performance-link');
    await waitFor(async () => {
      const cls = await warningLink.getAttribute('class') ?? '';
      return cls.includes('visible');
    });

    // Click the warning icon
    await warningLink.click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();

    // Dialog should contain performance info content
    await expect(page.locator('.dialog-performance-info-body')).toBeVisible();
  });

  test('performance dialog should close with X button', async ({ page }) => {
    await openEditor(page);
    await resizeCanvas(page, '600', '600');

    const warningLink = page.locator('.performance-link');
    await waitFor(async () => {
      const cls = await warningLink.getAttribute('class') ?? '';
      return cls.includes('visible');
    });

    // Open dialog
    await warningLink.click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();

    // Close with X
    await page.locator('.dialog-close').click();
    await waitFor(async () => (await page.locator('#dialog-container-wrapper.show').count()) === 0);
  });

  test('performance dialog should close with ESC', async ({ page }) => {
    await openEditor(page);
    await resizeCanvas(page, '600', '600');

    const warningLink = page.locator('.performance-link');
    await waitFor(async () => {
      const cls = await warningLink.getAttribute('class') ?? '';
      return cls.includes('visible');
    });

    // Open dialog
    await warningLink.click();
    await expect(page.locator('#dialog-container-wrapper.show')).toBeAttached();

    // Close with ESC
    await page.keyboard.press('Escape');
    await waitFor(async () => (await page.locator('#dialog-container-wrapper.show').count()) === 0);
  });
});
