/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, piskelFrameEqualsGrid, replaceFunction, setPiskelFromImageSrc */

casper.test.begin('Preferences settings panel test', 11, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');

    // Open preferences panel.
    test.assertDoesntExist('.expanded .settings-section-preferences', 'Check if preferences panel is closed');
    casper.click('[data-setting="user"]');

    casper.waitForSelector('.expanded .settings-section-preferences', onPreferencesPanelReady, test.timeout, 10000);
  }

  function onPreferencesPanelReady() {
    casper.echo('Preferences panel ready');

    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.expanded .settings-section-preferences',
                      'Check if preferences panel is opened');

    test.assertExists('.preferences-panel-misc', 'Check if misc tab is rendered');
    test.assertDoesntExist('.preferences-panel-grid', 'Check that grid tab is not rendered');
    casper.click('[data-tab-id="grid"]');
    casper.waitForSelector('[data-tab-id="grid"]', onGridTabSelected, test.timeout, 10000);
  }

  function onGridTabSelected() {
    casper.echo('Grid tab ready');

    test.assertDoesntExist('.preferences-panel-tile', 'Check that tile tab is not rendered');
    casper.click('[data-tab-id="tile"]');
    casper.waitForSelector('[data-tab-id="tile"]', onTileTabSelected, test.timeout, 10000);
  }

  function onTileTabSelected() {
    casper.echo('Tile tab ready');

    // Click on settings again to close the settings drawer.
    casper.click('[data-setting="user"]');
    casper.waitForSelector('[data-pskl-controller="settings"]:not(.expanded)', onDrawerClosed, test.timeout, 10000);
  }

  function onDrawerClosed() {
    test.assert(!isDrawerExpanded(), 'settings drawer is closed');
    // Open the settings again to check if the last tab is selected.
    casper.click('[data-setting="user"]');
    casper.waitForSelector('.expanded .settings-section-preferences', onPreferencesPanelExpandedAgain, test.timeout, 10000);
  }

  function onPreferencesPanelExpandedAgain() {
    casper.echo('Tile tab ready');
    test.assertExists('.preferences-panel-tile', 'Check if tile tab is selected');

    // Close the panel a second time.
    casper.click('[data-setting="user"]');
    casper.waitForSelector('[data-pskl-controller="settings"]:not(.expanded)', onDrawerClosedAgain, test.timeout, 10000);
  }

  function onDrawerClosedAgain() {
    test.assert(!isDrawerExpanded(), 'settings drawer is closed');
  }

  casper
    .start(casper.cli.get('baseUrl')+"/?debug")
    .then(function () {
      casper.echo("URL loaded");
      casper.waitForSelector('#drawing-canvas-container canvas', onTestStart, test.timeout, 20000);
    })
    .run(function () {
      test.done();
    });
});
