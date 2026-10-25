import test, { expect } from "@playwright/test";
import {
  clickTool,
  colorToInt,
  drawAtPixel,
  getPixelColor,
  openEditor,
  openImportSettingsPanel,
  testId,
  waitForEditorReady,
} from "../../testutils";

test.describe('Backup and recovery', () => {

  test('should open backup browser dialog', async ({ page }) => {
    await openEditor(page);
    await openImportSettingsPanel(page);

    await testId(page, 'browse-backups-button').click();

    // The backup browser dialog should appear
    await expect(page.locator('.backups-wizard-container')).toBeAttached();
  });

  test('should persist drawing across page reload via backup', async ({ page }) => {
    await openEditor(page);

    // Draw a recognizable pattern
    await clickTool(page, 'tool-pen');
    await drawAtPixel(page, 0, 0);

    // Verify the pixel was drawn (default primary color is black)
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#000000'));

    // Wait for backup to be saved (BackupService saves every 10s by default,
    // but we can force it by triggering the save via the model)
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        window.pskl.app.backupService.backup().then(() => resolve());
      });
    });

    // Reload the page
    await page.reload();
    await waitForEditorReady(page);

    // Open import > browse backups
    await openImportSettingsPanel(page);
    await testId(page, 'browse-backups-button').click();
    await expect(page.locator('.backups-wizard-container')).toBeAttached();

    // There should be exactly one session
    const sessions = page.locator('.session-item');
    await expect(sessions).toHaveCount(1);

    // Session should show the sprite name and snapshot count
    const sessionTitle = sessions.locator('.session-details-title');
    await expect(sessionTitle).toContainText('New Piskel');
    const sessionInfo = sessions.locator('.session-details-info');
    await expect(sessionInfo.first()).toContainText('Session recorded the');
    await expect(sessionInfo.last()).toContainText('saved');

    // Click "View" to see snapshots
    await sessions.locator('[data-action="view"]').click();

    // Should show snapshot details
    const snapshots = page.locator('.snapshot-item');
    await expect(snapshots).toHaveCount(1);

    // Snapshot should show frame count, resolution and fps
    const snapshotInfo = snapshots.locator('.snapshot-details-info').last();
    await expect(snapshotInfo).toContainText('1 frame');
    await expect(snapshotInfo).toContainText('32');
    await expect(snapshotInfo).toContainText('12fps');

    // Click "back" to return to session list
    await page.locator('.back-button').click();
    await expect(page.locator('.session-item')).toHaveCount(1);

    // Click "View" to see snapshots again
    await sessions.locator('[data-action="view"]').click();
    await expect(page.locator('.snapshot-item')).toHaveCount(1);

    // Click "Load" and accept the confirm dialog
    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="load"]').click();

    // Dialog should close after loading
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached();

    // The backed-up pixel should be restored (black at 0,0)
    expect(await getPixelColor(page, 0, 0)).toBe(colorToInt('#000000'));

    // Reopen backups to delete the session
    // Wait for settings drawer to fully close after backup load
    await expect(page.locator('[data-pskl-controller="settings"]:not(.expanded)')).toBeAttached();
    await openImportSettingsPanel(page);
    await testId(page, 'browse-backups-button').click();
    await expect(page.locator('.backups-wizard-container')).toBeAttached();
    await expect(page.locator('.session-item')).toHaveCount(1);

    // Get the session ID before delete
    const sessionIdBefore = await page.locator('.session-item [data-action="delete"]').getAttribute('data-session-id');

    // Delete the session — use dispatchEvent since the button may be outside viewport
    page.once('dialog', dialog => dialog.accept());
    await page.locator('.session-item [data-action="delete"]').dispatchEvent('click');

    // Wait for delete transition (500ms opacity + refresh)
    // The original session should disappear — a new one may be created by the running app
    await page.waitForTimeout(1000);

    // Close and reopen to verify the original session is gone
    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog-container-wrapper:not(.show)')).toBeAttached();

    await openImportSettingsPanel(page);
    await testId(page, 'browse-backups-button').click();
    await expect(page.locator('.backups-wizard-container')).toBeAttached();

    // The deleted session ID should no longer exist
    const remainingSessions = page.locator(`[data-action="delete"][data-session-id="${sessionIdBefore}"]`);
    await expect(remainingSessions).toHaveCount(0);
  });
});
