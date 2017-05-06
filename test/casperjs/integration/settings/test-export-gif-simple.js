/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, replaceFunction, piskelFrameEqualsGrid, setPiskelFromImageSrc */

casper.test.begin('Simple GIF (<256 colors) export test', 14, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');

    setPiskelFromGrid('['+
      '[R, G, B, T],' +
      '[T, R, G, B],'+
      '[B, T, R, G],'+
      '[G, B, T, R],'+
    ']');

    // Check the expected piskel was correctly loaded.
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 4, 'Piskel width is now 4 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 4, 'Piskel height is now 4 pixels');

    // Open export panel.
    test.assertDoesntExist('.settings-section-export', 'Check if export panel is closed');
    casper.click('[data-setting="export"]');

    casper.waitForSelector('.settings-section-export', onExportPanelReady, test.timeout, 10000);
  }

  function onExportPanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-export', 'Check if export panel is opened');

    // Override download method from GIF export controller to be able to retrieve the image
    // data on the content document.
    replaceFunction(test,
      'pskl.controller.settings.exportimage.GifExportController.prototype.downloadImageData_',
      function (imageData) {
        window.casperImageData = imageData;
        var el = document.createElement("div");
        el.id = "casper-imagedata-ready";
        document.body.appendChild(el);
      }
    );

    casper.echo('Clicking on Download GIF button');
    test.assertExists('.gif-download-button', 'The gif download button is available');
    casper.click('.gif-download-button');

    casper.echo('Wait for #casper-imagedata-ready');
    casper.waitForSelector('#casper-imagedata-ready', onImageDataReady, test.timeout, 10000);
  }

  function onImageDataReady() {
    casper.echo('Found casper-imagedata-ready element');

    // cleanup
    casper.evaluate(function () {
      document.body.removeChild(document.getElementById('casper-imagedata-ready'));
    });

    var imageData = evalLine('window.casperImageData');

    // Check the exported gif is valid
    test.assert(imageData.indexOf('data:image/gif;base64') === 0, 'The gif image data was generated');

    // Recreate a new piskel from the source
    waitForEvent('PISKEL_RESET', onPiskelReset, test.timeout);
    setPiskelFromImageSrc(imageData);
  }

  function onPiskelReset() {
    casper.echo('Received PISKEL_RESET event after loading piskel from GIF source');

    // Check the expected piskel was correctly loaded.
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 4, 'Piskel width is now 4 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 4, 'Piskel height is now 4 pixels');

    // Check that the piskel content has been resized.
    test.assert(piskelFrameEqualsGrid('['+
      '[R, G, B, T],' +
      '[T, R, G, B],' +
      '[B, T, R, G],' +
      '[G, B, T, R],' +
    ']', 0, 0), 'Imported piskel content is as expected');

    // Click on export again to close the settings drawer.
    casper.click('[data-setting="export"]');
    casper.waitForSelector('[data-pskl-controller="settings"]:not(.expanded)', onDrawerClosed, test.timeout, 10000);
  }

  function onDrawerClosed() {
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
