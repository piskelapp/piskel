/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked, evalLine */

casper.test.begin('Test resize panel width/height inputs are synchronized', 28 , function(test) {
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

    testInputSynchronization();
  }

  function testInputSynchronization() {
    test.assertExists('[name="resize-width"]', 'Check if width input is available');
    test.assertExists('[name="resize-height"]', 'Check if height input is available');

    test.assertEquals(getValue('[name="resize-width"]'), "32", 'Resize width is 32px');
    test.assertEquals(getValue('[name="resize-height"]'), "32", 'Resize height is 32px');

    // Check that the resize ratio checkbox is available and checked.
    test.assertExists('.resize-ratio-checkbox', 'Check if resize ratio checkbox is available');
    test.assert(casper.evaluate(function () {
      return document.querySelector('.resize-ratio-checkbox').checked;
    }), 'Keep ratio checkbox is checked');

    // Check inputs are synchronized
    casper.sendKeys('[name="resize-width"]', casper.page.event.key.Backspace);
    test.assertEquals(getValue('[name="resize-width"]'), "3", 'Resize width is 3px');
    test.assertEquals(getValue('[name="resize-height"]'), "3", 'Resize height is 3px');

    casper.sendKeys('[name="resize-width"]', "0");
    test.assertEquals(getValue('[name="resize-width"]'), "30", 'Resize width is 30px');
    test.assertEquals(getValue('[name="resize-height"]'), "30", 'Resize height is 30px');

    // Check the synchronization also works when editing height field
    casper.sendKeys('[name="resize-height"]', "0");
    test.assertEquals(getValue('[name="resize-width"]'), "300", 'Resize width is 300px');
    test.assertEquals(getValue('[name="resize-height"]'), "300", 'Resize height is 300px');

    casper.sendKeys('[name="resize-height"]', casper.page.event.key.Backspace);
    test.assertEquals(getValue('[name="resize-width"]'), "30", 'Resize width is 30px');
    test.assertEquals(getValue('[name="resize-height"]'), "30", 'Resize height is 30px');

    // Uncheck the resize ratio checkbox.
    casper.click('.resize-ratio-checkbox');

    // Check inputs are no longer synchronized
    casper.sendKeys('[name="resize-width"]', casper.page.event.key.Backspace);
    test.assertEquals(getValue('[name="resize-width"]'), "3", 'Resize width is 3px');
    test.assertEquals(getValue('[name="resize-height"]'), "30", 'Resize height is 30px');

    casper.sendKeys('[name="resize-width"]', "2");
    test.assertEquals(getValue('[name="resize-width"]'), "32", 'Resize width is 32px');
    test.assertEquals(getValue('[name="resize-height"]'), "30", 'Resize height is 30px');

    casper.sendKeys('[name="resize-height"]', casper.page.event.key.Backspace);
    test.assertEquals(getValue('[name="resize-width"]'), "32", 'Resize width is 32px');
    test.assertEquals(getValue('[name="resize-height"]'), "3", 'Resize height is 3px');

    casper.sendKeys('[name="resize-height"]', "2");
    test.assertEquals(getValue('[name="resize-width"]'), "32", 'Resize width is 32px');
    test.assertEquals(getValue('[name="resize-height"]'), "32", 'Resize height is 32px');

    // Check the resize ratio checkbox again
    casper.click('.resize-ratio-checkbox');

    // Send ESCAPE to close the resize panel. (!!! does not work for some reason ...)
    // casper.page.sendEvent('keydown', casper.page.event.key.Escape);
    casper.click('[data-setting="resize"]');
    casper.waitForSelector('[data-pskl-controller="settings"]:not(.expanded)', onDrawerClosed, test.timeout, 10000);
  }

  function onDrawerClosed() {
    test.assert(!isDrawerExpanded(), 'settings drawer is closed');
  }

  casper
    .start(casper.cli.get('baseUrl')+"/?debug")
    .then(function () {
      this.echo("URL loaded");
      this.waitForSelector('#drawing-canvas-container canvas', onTestStart, test.timeout, 10000);
    })
    .run(function () {
      test.done();
    });
});
