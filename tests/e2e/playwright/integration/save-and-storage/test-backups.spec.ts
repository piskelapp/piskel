import test, { Page } from "@playwright/test";
import {
  assertBackupSessions,
  assertNoBackupSession,
  clickDeleteBackupSession,
  clickTool,
  drawAtPixel,
  gridFromRows,
  letTimePass,
  openBackupsInNewTab,
  openEditor,
  openEditorInNewPage,
  openEditorWithFakeClock,
  restoreSnapshot,
  saveInBrowser,
  sendPageClosingEvent,
  setPiskelFromGrid,
  viewBackupSession,
  wait,
  waitForGrid,
} from "../../testutils";

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;

const openEditorWithPen = async (page: Page) => {
  await openEditorWithFakeClock(page);
  await clickTool(page, 'tool-pen');
};

/** Draw a pixel on the top row of the sprite, and check that row */
const drawAndAssertTopRow = async (page: Page, col: number, topRow: string) => {
  await drawAtPixel(page, col, 0);
  await waitForGrid(page, topRow.length, 1, [topRow]);
};

/** Make a backup under this title, then close the page and return a new session */
const makeBackupSession = async (session: Page, title: string): Promise<Page> => {
  await saveInBrowser(session, title);
  await clickTool(session, 'tool-pen');
  await drawAndAssertTopRow(session, 0, 'X..');
  await letTimePass(session, ONE_MINUTE);

  const nextSession = await openEditorInNewPage(session);
  await session.close();
  return nextSession;
};

test.describe('Backup timing', () => {
  test('should not back up an unchanged sprite', { tag: ['@save-and-storage.backup'] }, async ({ page }) => {
    await openEditorWithPen(page);

    await letTimePass(page, ONE_MINUTE);

    const tab = await openBackupsInNewTab(page);
    await assertNoBackupSession(tab);
  });

  test('should back up a changed sprite after a minute', { tag: ['@save-and-storage.backup'] }, async ({ page }) => {
    await openEditorWithPen(page);
    await drawAndAssertTopRow(page, 0, 'X..');

    // After half a minute, there's no backup yet.
    await letTimePass(page, ONE_MINUTE / 2);
    const earlyTab = await openBackupsInNewTab(page);
    await assertNoBackupSession(earlyTab);
    await earlyTab.close();

    // After a minute, there is one.
    await letTimePass(page, ONE_MINUTE / 2);
    const tab = await openBackupsInNewTab(page);
    await assertBackupSessions(tab, ['New Piskel']);
    await viewBackupSession(tab, 0, 1);
  });

  test('should update the latest snapshot within 5 minutes', { tag: ['@save-and-storage.backup'] }, async ({ page }) => {
    await openEditorWithPen(page);

    // First backup.
    await drawAndAssertTopRow(page, 0, 'X..');
    await letTimePass(page, ONE_MINUTE);

    // A minute later, the second backup has the second pixel.
    await drawAndAssertTopRow(page, 1, 'XX.');
    await letTimePass(page, ONE_MINUTE);

    // There's still one snapshot, with both pixels.
    const tab = await openBackupsInNewTab(page);
    await viewBackupSession(tab, 0, 1);
    await restoreSnapshot(tab, 0);
    await waitForGrid(tab, 3, 1, ['XX.']);
  });

  test('should keep a new snapshot after 5 minutes, listed newest first', { tag: ['@save-and-storage.backup', '@save-and-storage.backups-order'] }, async ({ page }) => {
    await openEditorWithPen(page);

    // First backup.
    await drawAndAssertTopRow(page, 0, 'X..');
    await letTimePass(page, ONE_MINUTE);

    // A new snapshot 5 minutes later.
    await drawAndAssertTopRow(page, 1, 'XX.');
    await letTimePass(page, FIVE_MINUTES);

    // The newest snapshot has both pixels.
    const newestTab = await openBackupsInNewTab(page);
    await viewBackupSession(newestTab, 0, 2);
    await restoreSnapshot(newestTab, 0);
    await waitForGrid(newestTab, 3, 1, ['XX.']);

    // The oldest one has the first pixel only.
    const oldestTab = await openBackupsInNewTab(page);
    await viewBackupSession(oldestTab, 0, 2);
    await restoreSnapshot(oldestTab, 1);
    await waitForGrid(oldestTab, 3, 1, ['X..']);
  });

  test('should attempt a last backup when the page is closed', { tag: ['@save-and-storage.backup-on-close'] }, async ({ page }) => {
    // The real clock: no minute passes, so only the closing event can make this backup.
    await openEditor(page);
    await clickTool(page, 'tool-pen');
    await drawAndAssertTopRow(page, 0, 'X..');

    // Really closing the page can cut the backup short, which is why it's only an
    // attempt, and makes a test unreliable. So the page stays open here.
    await sendPageClosingEvent(page);
    await wait(200);

    // Another session can restore the drawing.
    const tab = await openBackupsInNewTab(page);
    await assertBackupSessions(tab, ['New Piskel']);
    await viewBackupSession(tab, 0, 1);
    await restoreSnapshot(tab, 0);
    await waitForGrid(tab, 3, 1, ['X..']);
  });
});

test.describe('Backup limits', () => {
  test('should keep the 12 latest snapshots of a session', { tag: ['@save-and-storage.backup-limits', '@save-and-storage.backups-order'] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    await setPiskelFromGrid(page, gridFromRows(['..............']));
    await waitForGrid(page, 14, 1, ['..............']);
    await clickTool(page, 'tool-pen');

    // Make 13 snapshots, each with one more pixel.
    for (let col = 0; col < 13; col++) {
      await drawAndAssertTopRow(page, col, 'X'.repeat(col + 1).padEnd(14, '.'));
      await letTimePass(page, FIVE_MINUTES);
    }

    // The newest snapshot has all the pixels.
    const newestTab = await openBackupsInNewTab(page);
    await viewBackupSession(newestTab, 0, 12);
    await restoreSnapshot(newestTab, 0);
    await waitForGrid(newestTab, 14, 1, ['XXXXXXXXXXXXX.']);

    // The first snapshot is gone: the oldest one has two pixels.
    const oldestTab = await openBackupsInNewTab(page);
    await viewBackupSession(oldestTab, 0, 12);
    await restoreSnapshot(oldestTab, 11);
    await waitForGrid(oldestTab, 14, 1, ['XX............']);
  });

  test('should keep the 10 latest sessions', { tag: ['@save-and-storage.backup-limits', '@save-and-storage.backups-order'] }, async ({ page }) => {
    test.slow();
    await openEditorWithFakeClock(page);

    // Make 11 sessions, each in its own page load.
    let session = page;
    for (let number = 1; number <= 11; number++) {
      session = await makeBackupSession(session, `session ${number}`);
    }

    // The first session is gone, and the others are listed newest first.
    const tab = await openBackupsInNewTab(session);
    await assertBackupSessions(tab, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((number) => `session ${number}`));
  });
});

// The list is blank when the only backups are from the current session, so that isn't
// tested here: see docs/known-issues.md.
test.describe('Deleting a backup session', () => {
  test('should keep the session when cancelling, and delete only that session otherwise', { tag: ['@save-and-storage.backups-delete', '@save-and-storage.backups-delete-cancel'] }, async ({ page }) => {
    await openEditorWithFakeClock(page);
    const secondSession = await makeBackupSession(page, 'first');
    const thirdSession = await makeBackupSession(secondSession, 'second');
    const tab = await openBackupsInNewTab(thirdSession);
    await assertBackupSessions(tab, ['second', 'first']);

    // Cancel the confirmation, and wait longer than the 500ms a deletion takes.
    await clickDeleteBackupSession(tab, 0, { accept: false });
    await wait(700);
    await assertBackupSessions(tab, ['second', 'first']);

    // Accept the confirmation.
    await clickDeleteBackupSession(tab, 0, { accept: true });
    await assertBackupSessions(tab, ['first']);

    // Delete the last one.
    await clickDeleteBackupSession(tab, 0, { accept: true });
    await assertNoBackupSession(tab);
  });
});
