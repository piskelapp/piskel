/* globals casper, setPiskelFromGrid, isDrawerExpanded, getValue, isChecked,
   evalLine, waitForEvent, replaceFunction, piskelFrameEqualsGrid, setPiskelFromImageSrc */

var src_4_colors =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAH0lEQVQYV2P8z8DwnwEJMLL8' +
  'RxNQZfiPquI/wyQUAQBKSQi4ymBTpAAAAABJRU5ErkJggg=='

var src_16_colors =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAALUlEQVQYVzXDsQ0AIRADwbVE' +
  '+g0Q4IiGv+ElupEmgrTMLPFQZi66CzPySz/mA6UnC1iqHei4AAAAAElFTkSuQmCC';

casper.test.begin('Test palette switches to tiny mode if it contains more than 10 colors', 7, function(test) {
  test.timeout = test.fail.bind(test, ['Test timed out']);

  function onTestStart() {
    test.assertExists('#drawing-canvas-container canvas', 'Piskel ready, test starting');

    casper.waitForSelector('.palettes-list-color:nth-child(4)', on4ColorsPaletteUpdated, test.timeout, 10000);
    setPiskelFromImageSrc(src_4_colors);
  }

  function on4ColorsPaletteUpdated() {
    test.assertEquals(
      evalLine('document.querySelectorAll(".palettes-list-color").length'),
      4,
      'Current palette contains 4 colors');
    test.assertExists(
      '.palettes-list-colors:not(.tiny)',
      'Check that the palette colors container is not in tiny mode');

    casper.waitForSelector('.palettes-list-colors.tiny', on16ColorsPaletteUpdated, test.timeout, 10000);
    setPiskelFromImageSrc(src_16_colors);
  }

  function on16ColorsPaletteUpdated() {
    test.assertEquals(
      evalLine('document.querySelectorAll(".palettes-list-color").length'),
      16,
      'Current palette contains 16 colors');
    test.assertExists(
      '.palettes-list-colors.tiny',
      'Check that the palette colors container is in tiny mode');

    casper.waitForSelector('.palettes-list-colors:not(.tiny)', on4ColorsPaletteUpdatedAgain, test.timeout, 10000);
    setPiskelFromImageSrc(src_4_colors);
  }

  function on4ColorsPaletteUpdatedAgain() {
    test.assertEquals(
      evalLine('document.querySelectorAll(".palettes-list-color").length'),
      4,
      'Current palette contains 4 colors');
    test.assertExists(
      '.palettes-list-colors:not(.tiny)',
      'Check that the palette colors container is not in tiny mode');
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
