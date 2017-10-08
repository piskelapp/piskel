/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, replaceFunction, setPiskelFromImageSrc */

casper.test.begin('Image import test with an empty current sprite', 16, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  // Helper to retrieve the text content of the provided selector
  // in the current wizard step.
  var getTextContent = function (selector) {
    return evalLine('document.querySelector(".current-step ' + selector +'").textContent');
  };

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');

    waitForEvent('PISKEL_RESET', onPiskelReset, test.timeout);

    // 1x1 transparent pixel
    setPiskelFromGrid('['+
      '[T]' +
    ']');
  }

  function onPiskelReset() {
    // Check the expected piskel was correctly loaded.
    test.assertEquals(evalLine('pskl.app.currentColorsService.getCurrentColors().length'), 0, 'Has no color');
    test.assertEquals(evalLine('pskl.app.piskelController.isEmpty()'), true, 'Current piskel is considered as empty');
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
    test.assertEquals(getTextContent('.import-next-button'), 'import',
      'Next button found, with text content \'import\'');
    casper.click('.current-step .import-next-button');

    // Since the current sprite is empty clicking on the button should directly finalize the import.
    casper.waitForSelector('#dialog-container-wrapper:not(.show)', onPopupClosed, test.timeout, 10000);
  }

  function onPopupClosed() {
    casper.echo('Import popup is closed, check the imported piskel content');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 2, 'Piskel width is 2 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 2, 'Piskel height is 2 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getLayers().length'), 1, 'Piskel has 1 layer');
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
