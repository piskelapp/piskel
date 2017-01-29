/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, replaceFunction, setPiskelFromImageSrc */

casper.test.begin('Complex GIF export test', 11, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    test.assert(!isDrawerExpanded(), 'settings drawer is closed');

    waitForEvent('PISKEL_RESET', onPiskelReset, test.timeout);
    setPiskelFromImageSrc(src);
  }

  function onPiskelReset() {
    // Check the expected piskel was correctly loaded.
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getWidth()'), 20, 'Piskel width is now 20 pixels');
    test.assertEquals(evalLine('pskl.app.piskelController.getPiskel().getHeight()'), 20, 'Piskel height is now 20 pixels');

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
    // Sadly we can't assert much more for now as the generated GIF in casper environment is invalid
    test.assert(imageData.indexOf('data:image/gif;base64') === 0, 'The gif image data was generated');

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
      casper.waitForSelector('#drawing-canvas-container canvas', onTestStart, test.timeout, 10000);
    })
    .run(function () {
      test.done();
    });
});

// Source for a base64 encoded PNG, 20x20, with 400 different colors.
var src = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAFrUlEQVQ4TwXBC1zNhwLA8d+/',
  '47aKViR6eqSNpNtDbkW0peTRY2u0FYpmkeuOso4QJ+XeOJvClB6kh0NK76lGXSskmw+V5HVIYVTH9NChUv99v0L3yizRPG',
  'uUgrV6xEdI2B0wRMQHTYYm1dDi+Bb9Z+fYlf0fbBtGiEgPIyCyifFqOyT37PhptJe5pkqOPItHXbGBVGUVQrDcUEyreUFV',
  'aSaHpTXcsJTRXTxE6olxfJw3kb39tqx36qHk0VGMA8v5QuMK47xTuJUWgb11PqpKLfYNPCQh9zvm9m1HWNS1TVxXnkCMZi',
  '8G+6I5s8KUxuoCfh5Tz0FJLENNBthYZjHB0p5LVmnolAyy0lKO2dh3xK4qxvvgORRbXMl0nkPkGkOEpOVfi0ZZf5FmpkVf',
  'yFLi5H3kBHbzutaXfVGTSc83ZlJpEoGhOSz4dQ8zTB34YkErJSkLkTt8hfukO/z8pwtXfS2QK/+J8MMaH7FBRxOD9gYOhS',
  'cwzWcy56I+pUtvmM2qz9ib0sES35nYKnTwcZOQLN2CR8nvxLVok1wWhVttF+73OlgWlozE0gthzaRu0eryKVJVvWRqTKQz',
  '8Trf6+jjMVGH/xlpMXLRmrqEZj56asNTz5d4Xf4EX20VtbOsMHO+xSfHHBm/v58iaRzZZgKC7fGjYnivPWbDCSyQ5vBtQQ',
  'VpJaMM52aj7XsQdw0n3uw2Yf6ufGr8G8nw9yapKY3N+SqMej9wxHYEi2UFDI+dzvTKRoQW2WpRnV1F1oVfCNyRQXT8PAwX',
  'xhBkvJ5Q3WrUtxfT4WLOPBtNjD+IzNwZQFdKBbM3ypiZV09hmyd86cfudb14n3BH2NWxQwzpsETdMpXZa7t4Mi2HS04lJD',
  'ap+WFCPH7fF6MMkPEwU06TxJTywhUccp7Bt4enUba2kH8YBZE14sWS0+MIK12GcGx0UJxztY2pIdVUXpNTqp5MrVE4qgNO',
  'DCuD+FG+lMg5PTzO68aqNJDqd7mULjah/bsXbBjwILaiH+3tSqLL7dFOqEHQb9wuGv6+CsfpdaRbXsJHfZbQCn+E/zqRWO',
  '7BjIgnXMnYSnvMci7a5vLKTsXFpnq+vqMk7ISE54YyHlqMZcWMmyiefoOwOPK8ODYhmCJZEQXxKVxu8aJ0VAOZvSY+z6tR',
  'rb2OteweYerxLP+3BffLDqDy/oy6NAXNtT8S1f6Akspf0XhrQsfLqwg683eKs6zNOCizxiXVENssKUnBeWxu/YONVlPIds',
  '5DsUmJ39BZToq2zIusw3D3abTeHufmqjc0OeZity8AYZodoUX3EZQJ0WJ2Ri3zjTpJTKmgMr+A9xr+PHAvxLxeyn6HVmK2',
  'jmJ+x4Lmm4WcfLQFsyvP2FkfgmObiogmHVLP38b1q2s8/2MYobHqlDj4WygGejuwuJBIuncN140VeAZZ0ZNYxIOBNgw6P0',
  'ftcYvmiAL0HQzQfbeC+PMNmG5Zxo1nfmQMx2JedhKXpTkIs0xNRcVDN1KON2H+yJFvpBuYtcGLv1qm4/l5IfN7FqF9r549',
  'deF8MDlLsnwqZW4KUu//C+XjqxyQl1HjqsIz6heCPq1HuHQmVDwyGEtA2v9JXrwOGtLx2r+NNzGbGPgpiVjT09zQL2eB8z',
  'VuH6vHZowDuoo4Gu/2YL3+FcE7wqnwz8NFN5auQQmCSe4rse75YSQDoxRXOhPd3YFG68f49e/FPbOZL0Ud3h9azd1NK3kv',
  '6+VomiGzrTcSPLQIaZWE7k5HXiRU8Nv6dnSVtgh6T9zEOMUmur3a2GM9hSitpSw37eOM/gRuh5jTGtCB09aj+EwpRJp+hT',
  'mP+/lzZDXS8FKMAz6i3tyNU4k1NJx2xaS0AWGXf5eolzeGJWvCuKtYyAPPPkJUzYTkuvP69Qt8JhZStVNKkk0NWVlJzM0o',
  'YFvYHkZfP8HV3o3OtliK0/N5uXk/vtsv8De4Y3LYq8qFNwAAAABJRU5ErkJggg=='].join('');
