/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, replaceFunction, setPiskelFromImageSrc */

casper.test.begin('Simple Image import test', 27, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  // Helper to retrieve the text content of the provided selector
  // in the current wizard step.
  var getTextContent = function (selector) {
    selector = '.current-step ' + selector;
    return evalLine('document.querySelector("' + selector +'").textContent');
  };

  // Helper to retrieve the value of a meta-information from the import
  // preview displayed on each of the import steps
  var getMetaValue = function (name) {
    return getTextContent('.import-' + name +' .import-meta-value');
  };

  var checkImportPreview = function (test) {
    casper.echo('Check the content of the import preview');
    test.assertEquals(getMetaValue('name'), 'test-name', 'Imported image has the expected name');
    test.assertEquals(getMetaValue('dimensions'), '2\u00D72', 'Imported image has the expected size');
    test.assertEquals(getMetaValue('frames'), '1', 'Imported image has the expected frames');
    test.assertEquals(getMetaValue('layers'), '1', 'Imported image has the expected layers');
  };

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');

    // 1x1 black pixel
    var src = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcS',
      'JAAAADUlEQVQYV2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg=='
    ].join('');
    setPiskelFromImageSrc(src);

    // For this test the most important is that the color service picked up the color from the sprite
    // since it drives which flow will be used for the import.
    casper.waitForSelector('.palettes-list-color:nth-child(1)', onPiskelPaletteUpdated, test.timeout, 10000);
  }

  function onPiskelPaletteUpdated() {
    // Check the expected piskel was correctly loaded.
    test.assertEquals(evalLine('pskl.app.currentColorsService.getCurrentColors().length'), 1, 'Has 1 color');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 1, 'Piskel width is 1 pixel');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 1, 'Piskel height is 1 pixel');

    // Open export panel.
    test.assertDoesntExist('.settings-section-import', 'Check if import panel is closed');
    casper.click('[data-setting="import"]');

    casper.waitForSelector('.settings-section-import', onImportPanelReady, test.timeout, 10000);
  }

  function onImportPanelReady() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded');
    test.assertExists('.settings-section-import', 'Check if import panel is opened');

    replaceFunction(test,
      'pskl.utils.FileUtils.readImageFile',
      function (file, callback) {
        var image = new Image();
        image.onload = callback.bind(null, image);
        // Source for a simple base64 encoded PNG, 2x2, with 2 different colors and 2 transparent pixels.
        image.src = [
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0',
          'kAAAAF0lEQVQYVwXBAQEAAACCIPw/uiAYi406Ig4EARK1RMAAAAAASUVORK5CYII='
        ].join('');
      }
    );

    casper.echo('Clicking on Browse Images button');
    test.assertExists('.file-input-button', 'The import image button is available');

    // We can't really control the file picker from the test so we directly fire the event
    casper.evaluate(
      'function () {\
        $.publish(Events.DIALOG_SHOW, {\
          dialogId : "import",\
          initArgs : {\
            rawFiles: [{type: "image", name: "test-name.png"}]\
          }\
        });\
      }'
    );

    casper.echo('Wait for .import-image-container');
    casper.waitForSelector('.current-step.import-image-container', onImageImportReady, test.timeout, 10000);
  }

  function onImageImportReady() {
    casper.echo('Found import-image-container');

    // Click on export again to close the settings drawer.
    test.assertEquals(getTextContent('.import-next-button'), 'next',
      'Next button found and has the expected text content');
    casper.click('.current-step .import-next-button');
    casper.waitForSelector('.current-step .import-mode', onSelectModeReady, test.timeout, 10000);
  }

  function onSelectModeReady() {
    casper.echo('Select Mode step is displayed');
    checkImportPreview(test);

    casper.echo('Go to next step (adjust size)');
    casper.click('.current-step .import-mode-merge-button');
    casper.waitForSelector('.current-step .import-resize-info', onAdjustSizeReady, test.timeout, 10000);
  }

  function onAdjustSizeReady() {
    casper.echo('Adjust size step is displayed');
    checkImportPreview(test);

    casper.echo('Go to next step (insert location)');
    casper.click('.current-step .import-next-button');
    casper.waitForSelector('.current-step .insert-mode-container', onInsertLocationReady, test.timeout, 10000);
  }

  function onInsertLocationReady() {
    casper.echo('Insert location step is displayed');
    checkImportPreview(test);

    casper.echo('Select the mode "insert in existing frames"');
    casper.click('#insert-mode-insert');

    casper.echo('Finalize the import');
    casper.click('.import-next-button');
    casper.waitForSelector('#dialog-container-wrapper:not(.show)', onPopupClosed, test.timeout, 10000);
  }

  function onPopupClosed() {
    casper.echo('Import popup is closed, check the imported piskel content');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 2, 'Piskel width is 2 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 2, 'Piskel height is 2 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getLayers().length'), 2, 'Piskel has 2 layers');
    test.assertEquals(evalLine('pskl.app.piskelController.getFrameCount()'), 1, 'Piskel has 1 frame');
  }

  casper
    .start(casper.cli.get('baseUrl')+"/?debug&integration-test")
    .then(function () {
      casper.echo("URL loaded");
      casper.waitForSelector('#drawing-canvas-container canvas', onTestStart, test.timeout, 20000);
    })
    .run(function () {
      test.done();
    });
});
