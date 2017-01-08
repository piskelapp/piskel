casper.test.begin('Test resize feature works, and check the output', 19, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    // Setup test Piskel
    casper.evaluate(function () {
      var B = '#000000', T = Constants.TRANSPARENT_COLOR;
      var frame = pskl.model.Frame.fromPixelGrid([
        [B, T],
        [T, B]
      ]);
      var layer = pskl.model.Layer.fromFrames('l1', [frame]);
      var piskel = pskl.model.Piskel.fromLayers([layer], 12, {name : 'test', description : ''});
      pskl.app.piskelController.setPiskel(piskel);
    });

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');
    test.assertDoesntExist('.settings-section-resize', 'Check if resize settings drawer is closed');

    // Open resize panel.
    this.click('[data-setting="resize"]');
    this.waitForSelector('.settings-section-resize', onResizePanelReady, test.timeout, 10000);
  }

  function onResizePanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-resize', 'Check if resize panel is opened');

    testResizePiskel();
  }

  function testResizePiskel() {
    test.assertExists('[name="resize-width"]', 'Check if width input is available');
    test.assertExists('[name="resize-height"]', 'Check if height input is available');

    test.assertEquals(getValue('[name="resize-width"]'), "2", 'Resize width is 2px');
    test.assertEquals(getValue('[name="resize-height"]'), "2", 'Resize height is 2px');

    // Check that the resize ratio checkbox is available and checked.
    test.assertExists('.resize-ratio-checkbox', 'Check if resize ratio checkbox is available');
    test.assert(isChecked('.resize-ratio-checkbox'), 'Keep ratio checkbox is checked');

    // Update width/height
    casper.sendKeys('[name="resize-width"]', casper.page.event.key.Backspace);
    casper.sendKeys('[name="resize-width"]', "4");
    test.assertEquals(getValue('[name="resize-width"]'), "4", 'Resize width is 4px');
    test.assertEquals(getValue('[name="resize-height"]'), "4", 'Resize height is 4px');

    test.assertExists('.resize-content-checkbox', 'Check if resize ratio checkbox is available');
    test.assert(!isChecked('.resize-content-checkbox'), 'Keep content checkbox is unchecked');

    casper.click('.resize-button');
    // Resizing the piskel should close the panel automatically
    casper.waitForSelector('[data-pskl-controller="settings"]:not(.expanded)', onDrawerClosed, test.timeout, 10000);
  }

  function onDrawerClosed() {
    test.assert(!isDrawerExpanded(), 'settings drawer is closed');

    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 4, 'Piskel width is now 4 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 4, 'Piskel height is now 4 pixels');

    test.assert(casper.evaluate(function () {
      var B = '#000000', T = Constants.TRANSPARENT_COLOR;
      var frame = pskl.app.piskelController.getPiskel().getLayerAt(0).getFrameAt(0);
      var grid = [
        [B, T, T, T],
        [T, B, T, T],
        [T, T, T, T],
        [T, T, T, T],
      ]
      var isValid = true;
      frame.forEachPixel(function (color, col, row) {
        isValid = isValid && pskl.utils.colorToInt(color) === pskl.utils.colorToInt(grid[row][col]);
      });
      return isValid;
    }), 'Resized piskel content is as expected');
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