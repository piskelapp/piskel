/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, replaceFunction, setPiskelFromImageSrc */

casper.test.begin('Double Image import test', 26, function(test) {
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

  var fireDialogShowEvent = function (name) {
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
  };

  var mockReadImageFile = function (imageDataUrl) {
    replaceFunction(test,
      'pskl.utils.FileUtils.readImageFile',
      'function (file, callback) {\
        var image = new Image();\
        image.onload = callback.bind(null, image);\
        image.src = "' + imageDataUrl +'";\
      }'
    );
  };

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    // Bypass all confirm dialogs.
    replaceFunction(test,
      'window.confirm',
      function () {
        return true;
      }
    );

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

    mockReadImageFile([
      // Source for a simple base64 encoded PNG, 2x2, with 2 different colors and 2 transparent pixels.
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0',
      'kAAAAF0lEQVQYVwXBAQEAAACCIPw/uiAYi406Ig4EARK1RMAAAAAASUVORK5CYII='
    ].join(''));

    casper.echo('Clicking on Browse Images button');
    test.assertExists('.file-input-button', 'The import image button is available');

    // We can't really control the file picker from the test so we directly fire the event
    fireDialogShowEvent();

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

    casper.echo('Click on replace-button and wait for popup to close');
    casper.click('.current-step .import-mode-replace-button');
    casper.waitForSelector('#dialog-container-wrapper:not(.show)', onPopupClosed, test.timeout, 10000);
  }

  function onPopupClosed() {
    casper.echo('Import popup is closed, check the imported piskel content');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 2, 'Piskel width is 2 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 2, 'Piskel height is 2 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getLayers().length'), 1, 'Piskel has 1 layer');
    test.assertEquals(evalLine('pskl.app.piskelController.getFrameCount()'), 1, 'Piskel has 1 frame');

    // Need to wait a bit for the popup to be actually destroyed!
    casper.wait(1000, onPopupDestroyed);
  }

  function onPopupDestroyed() {
    // Now we reopen the import panel a second time to check that the destroy of the previous import
    // wizard was successful.
    test.assertDoesntExist('.expanded .settings-section-import', 'Check if import panel is closed');
    casper.click('[data-setting="import"]');

    casper.waitForSelector('.expanded .settings-section-import', onImportPanelReady2, test.timeout, 10000);
  }

  function onImportPanelReady2() {
    test.assert(isDrawerExpanded(), 'settings drawer is expanded(2)');
    test.assertExists('.settings-section-import', 'Check if import panel is opened');

    mockReadImageFile([
      // 1 x 1 black pixel
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcS',
      'JAAAADUlEQVQYV2NgYGD4DwABBAEAcCBlCwAAAABJRU5ErkJggg=='
    ].join(''));

    casper.echo('Clicking on Browse Images button');
    test.assertExists('.file-input-button', 'The import image button is available');

    // We can't really control the file picker from the test so we directly fire the event
    fireDialogShowEvent();

    casper.echo('Wait for .import-image-container');
    casper.waitForSelector('.current-step', onImageImportReady2, test.timeout, 10000);
  }

  function onImageImportReady2() {
    casper.echo('Found import-image-container (again)');

    // Click on export again to close the settings drawer.
    test.assertEquals(getTextContent('.import-next-button'), 'next',
      'Next button found and has the expected text content');
    casper.click('.current-step .import-next-button');
    casper.waitForSelector('.current-step .import-mode', onSelectModeReady2, test.timeout, 10000);
  }

  function onSelectModeReady2() {
    casper.echo('Select Mode step is displayed (again)');

    casper.echo('Click on replace-button and wait for popup to close');
    casper.click('.current-step .import-mode-replace-button');
    casper.waitForSelector('#dialog-container-wrapper:not(.show)', onPopupClosed2, test.timeout, 10000);
  }

  function onPopupClosed2() {
    casper.echo('Import popup is closed, check the imported piskel content');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 1, 'Piskel width is 1 pixel');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 1, 'Piskel height is 1 pixel');
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
