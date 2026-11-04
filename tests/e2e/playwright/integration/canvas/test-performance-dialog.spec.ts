import test, { expect } from "@playwright/test";
import {
  assertNoNotification,
  assertNoNotificationAppears,
  assertOnlyNotification,
  assertPerformanceDialogOpen,
  assertPerformanceIcon,
  clickNotificationLink,
  closeNotification,
  openEditor,
  resizeSprite,
  waitFor,
} from "../../testutils";

test.describe('Performance notification', () => {

  test('should show with a link to the dialog when the warning icon appears', { tag: ['@canvas.performance-notification'] }, async ({ page }) => {
    // A small sprite shows no message.
    await openEditor(page);
    await assertNoNotificationAppears(page);

    // Resize it past the limit: the message shows, with the icon.
    await resizeSprite(page, 600, 600);
    await assertPerformanceIcon(page, true);
    await assertOnlyNotification(page, 'Performance problem detected');

    // Its link opens the dialog.
    await clickNotificationLink(page);
    await assertPerformanceDialogOpen(page);
  });

  test('should only show again after the warning icon went away', { tag: ['@canvas.performance-notification'] }, async ({ page }) => {
    // Resize past the limit, and dismiss the message.
    await openEditor(page);
    await resizeSprite(page, 600, 600);
    await assertOnlyNotification(page, 'Performance problem detected');
    await closeNotification(page);
    await assertNoNotification(page);

    // Larger still, the combined score is also too high. The report changes, but the
    // icon was already there, so no new message shows.
    await resizeSprite(page, 800, 800);
    await assertPerformanceIcon(page, true);
    await assertNoNotificationAppears(page);

    // Back under the limit, the icon goes away, without a message.
    await resizeSprite(page, 32, 32);
    await assertPerformanceIcon(page, false);
    await assertNoNotificationAppears(page);

    // Past the limit again, the message shows again.
    await resizeSprite(page, 600, 600);
    await assertOnlyNotification(page, 'Performance problem detected');
  });
});

test.describe('Performance info dialog', () => {

  test('performance warning should not show on small canvas', { tag: ['@canvas.performance-warning'] }, async ({ page }) => {
    await openEditor(page);

    // Default 32x32 canvas — well under threshold
    const warningLink = page.locator('.performance-link');
    await expect(warningLink).not.toHaveClass(/visible/);
  });

  test('performance warning should appear on large canvas (>512x512)', { tag: ['@canvas.performance-warning'] }, async ({ page }) => {
    await openEditor(page);

    // Resize to 600x600 (exceeds 512x512 threshold)
    await resizeSprite(page, 600, 600);

    // Warning icon should become visible
    const warningLink = page.locator('.performance-link');
    await waitFor(async () => {
      const cls = await warningLink.getAttribute('class') ?? '';
      return cls.includes('visible');
    });
    await expect(warningLink).toHaveClass(/visible/);
  });

  test('clicking warning icon should open performance dialog', { tag: ['@canvas.performance-dialog'] }, async ({ page }) => {
    await openEditor(page);
    await resizeSprite(page, 600, 600);

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

  test('performance dialog should close with X button', { tag: ['@canvas.performance-dialog'] }, async ({ page }) => {
    await openEditor(page);
    await resizeSprite(page, 600, 600);

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

  test('performance dialog should close with ESC', { tag: ['@canvas.performance-dialog'] }, async ({ page }) => {
    await openEditor(page);
    await resizeSprite(page, 600, 600);

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
