/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked, evalLine */

casper.test.begin('Settings Test', 18, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');
    test.assertDoesntExist('.settings-section-resize', 'Check if resize settings drawer is closed');

    // Open resize panel.
    this.click('[data-setting="resize"]');
    this.waitForSelector('.settings-section-resize', onResizePanelReady, test.timeout, 10000);
  }

  function onResizePanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-resize', 'Check if resize panel is opened');

    // Open preferences settings panel.
    test.assertDoesntExist('.settings-section-preferences', 'Check if preferences settings panel is closed');
    this.click('[data-setting="user"]');

    this.waitForSelector('.settings-section-preferences', onPreferencesPanelReady, test.timeout, 10000);
  }

  function onPreferencesPanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-preferences', 'Check if preferences settings panel is opened');

    // Open save panel.
    test.assertDoesntExist('.settings-section-save', 'Check if save panel is closed');
    this.click('[data-setting="save"]');

    this.waitForSelector('.settings-section-save', onSavePanelReady, test.timeout, 10000);
  }

  function onSavePanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-save', 'Check if save panel is opened');

    // Open export panel.
    test.assertDoesntExist('.settings-section-export', 'Check if export panel is closed');
    this.click('[data-setting="export"]');

    this.waitForSelector('.settings-section-export', onExportPanelReady, test.timeout, 10000);
  }

  function onExportPanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-export', 'Check if export panel is opened');

    // Open import panel.
    test.assertDoesntExist('.settings-section-import', 'Check if import panel is closed');
    this.click('[data-setting="import"]');

    this.waitForSelector('.settings-section-import', onImportPanelReady, test.timeout, 10000);
  }

  function onImportPanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-import', 'Check if import panel is opened');

    // Click on import again to close the settings drawer.
    this.click('[data-setting="import"]');
    this.waitForSelector('[data-pskl-controller="settings"]:not(.expanded)', onDrawerClosed, test.timeout, 10000);
  }

  function onDrawerClosed() {
    test.assert(!isDrawerExpanded(), 'settings drawer is closed');
  }

  casper
    .start(casper.cli.get('baseUrl')+"/?debug")
    .then(function () {
      this.echo("URL loaded");
      this.waitForSelector('#drawing-canvas-container canvas', onTestStart, test.timeout, 20000);
    })
    .run(function () {
      test.done();
    });
});
