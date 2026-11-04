import test, { expect } from "@playwright/test";
import {
  assertEditorNotReady,
  assertNoDialogOpen,
  assertNoUnsupportedBrowserWarning,
  assertUnsupportedBrowserWarning,
  getLoadingScreen,
  openEditor,
  startOpeningEditorWithoutItsScript,
} from "../../testutils";

const CHROME_PARTS = 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
const OLD_BROWSER = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0)';

const UNSUPPORTED_BROWSERS = [
  {
    browser: 'Safari',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    shownName: 'Safari',
  },
  { browser: 'Opera', userAgent: `${WINDOWS} ${CHROME_PARTS} OPR/106.0.0.0`, shownName: 'Opera' },
  // The app can't name this browser, so it shows its full identity.
  { browser: 'an unknown browser', userAgent: OLD_BROWSER, shownName: OLD_BROWSER },
];

const SUPPORTED_BROWSERS = [
  { browser: 'Chrome', userAgent: `${WINDOWS} ${CHROME_PARTS}` },
  { browser: 'Firefox', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0' },
  { browser: 'Edge', userAgent: `${WINDOWS} ${CHROME_PARTS} Edg/120.0.0.0` },
  { browser: 'the old Edge', userAgent: `${WINDOWS} ${CHROME_PARTS} Edge/18.19041` },
  // Based on Chrome, so it counts as Chrome.
  { browser: 'Vivaldi', userAgent: `${WINDOWS} ${CHROME_PARTS} Vivaldi/6.5` },
];

test.describe('Loading screen', () => {

  test('should show until the editor is ready', { tag: ['@editor.loading'] }, async ({ page }) => {
    // Open the editor, with its script still on the way.
    const finishLoading = await startOpeningEditorWithoutItsScript(page);

    // The loading screen shows, and there's no editor yet.
    await expect(getLoadingScreen(page)).toBeVisible();
    await expect(getLoadingScreen(page)).toHaveText('Loading Piskel ...');
    await assertEditorNotReady(page);

    // Once the script loads, the editor is ready and the loading screen goes away.
    await finishLoading();
    await expect(getLoadingScreen(page)).toHaveCount(0);
  });
});

test.describe('Unsupported browsers', () => {

  for (const { browser, userAgent, shownName } of UNSUPPORTED_BROWSERS) {
    test.describe(browser, () => {
      test.use({ userAgent });

      test(`should warn at startup in ${browser}`, { tag: ['@editor.unsupported-browser'] }, async ({ page }) => {
        // Open the editor: the warning names the browser.
        await openEditor(page);
        await assertUnsupportedBrowserWarning(page, shownName);

        // It can be dismissed, to use the editor anyway.
        await page.keyboard.press('Escape');
        await assertNoDialogOpen(page);
      });
    });
  }

  for (const { browser, userAgent } of SUPPORTED_BROWSERS) {
    test.describe(browser, () => {
      test.use({ userAgent });

      test(`should not warn at startup in ${browser}`, { tag: ['@editor.unsupported-browser'] }, async ({ page }) => {
        await openEditor(page);
        await assertNoUnsupportedBrowserWarning(page);
      });
    });
  }
});
