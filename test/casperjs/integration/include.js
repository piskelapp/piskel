/* globals casper */

/**
 * Collection of shared methods for casperjs integration tests.
 */

function evalLine(line) {
  return casper.evaluate(
    'function () {return ' + line + '}'
  );
}

function getValue(selector) {
  return casper.evaluate(
    'function () { \
      return document.querySelector(\'' + selector + '\').value;\
    }');
}

function isChecked(selector) {
  return casper.evaluate(
    'function () { \
      return document.querySelector(\'' + selector + '\').checked;\
    }');
}

function setPiskelFromGrid(grid) {
  casper.evaluate(
    'function () {\
      var B = "#000000", T = Constants.TRANSPARENT_COLOR;\
      var frame = pskl.model.Frame.fromPixelGrid(' + grid + ');\
      var layer = pskl.model.Layer.fromFrames("l1", [frame]);\
      var piskel = pskl.model.Piskel.fromLayers([layer], 12, {name : "test", description : ""});\
      pskl.app.piskelController.setPiskel(piskel);\
    }');
}

function piskelFrameEqualsGrid(grid, layer, frame) {
  return casper.evaluate(
    'function () {\
      var B = "#000000", T = Constants.TRANSPARENT_COLOR;\
      var piskel = pskl.app.piskelController.getPiskel();\
      var frame = piskel.getLayerAt(' + layer +').getFrameAt(' + frame + ');\
      var grid = ' + grid +';\
      var isValid = true;\
      frame.forEachPixel(function (color, col, row) {\
        isValid = isValid && pskl.utils.colorToInt(color) === pskl.utils.colorToInt(grid[row][col]);\
      });\
      return isValid;\
    }');
}

function isDrawerExpanded() {
  return casper.evaluate(function () {
    var settingsElement = document.querySelector('[data-pskl-controller="settings"]');
    return settingsElement.classList.contains('expanded');
  });
}
