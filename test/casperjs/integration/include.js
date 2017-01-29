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
      var B = "#0000FF", T = Constants.TRANSPARENT_COLOR;\
      var R = "#FF0000", G = "#00FF00";\
      var grid = pskl.utils.FrameUtils.toFrameGrid(' + grid + ');\
      var frame = pskl.model.Frame.fromPixelGrid(grid);\
      var layer = pskl.model.Layer.fromFrames("l1", [frame]);\
      var piskel = pskl.model.Piskel.fromLayers([layer], 12, {name : "test", description : ""});\
      pskl.app.piskelController.setPiskel(piskel);\
    }');
}

function piskelFrameEqualsGrid(grid, layer, frame) {
  return casper.evaluate(
    'function () {\
      var B = "#0000FF", T = Constants.TRANSPARENT_COLOR;\
      var R = "#FF0000", G = "#00FF00";\
      var piskel = pskl.app.piskelController.getPiskel();\
      var frame = piskel.getLayerAt(' + layer +').getFrameAt(' + frame + ');\
      var grid = ' + grid +';\
      var isValid = true;\
      var log = [];\
      frame.forEachPixel(function (color, col, row) {\
        if (pskl.utils.colorToInt(color) !== pskl.utils.colorToInt(grid[row][col])) {\
          log.push(color, grid[row][col]);\
        }\
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

/**
 * Wait for the provided piskel specific event.
 *
 * @param  {String} eventName
 *         name of the event to listen to
 * @param  {Function} onSuccess
 *         callback to call when the event is successfully catched
 * @param  {Function} onError
 *         callback to call when failing to get the event (most likely, timeout)
 */
function waitForEvent(eventName, onSuccess, onError) {
  var cleanup = function () {
    casper.evaluate(
    'function () {\
      document.body.removeChild(document.getElementById("casper-' + eventName +'"));\
    }');
  };

  casper.echo("Waiting for casper element");
  casper.waitForSelector('#casper-' + eventName, function () {
    // success
    casper.echo("Successfully received event", eventName);
    cleanup();
    onSuccess();
  }, function () {
    // error
    casper.echo("Failed to receive event", eventName);
    cleanup();
    onError();
  }, 10000);

  casper.echo("Subscribe to event:", eventName);
  casper.evaluate(
    'function () {\
      $.subscribe("' + eventName + '", function onCasperEvent() {\
        $.unsubscribe("' + eventName + '", onCasperEvent);\
        var el = document.createElement("div");\
        el.id = "casper-' + eventName +'";\
        document.body.appendChild(el);\
      });\
    }');
}

function replaceFunction(test, path, method) {
  // Check the path provided corresponds to an existing method, otherwise the
  // test probably needs to be updated.
  test.assertEquals(evalLine('typeof ' + path),'function',
    'The prototype of GifExportController still contains downloadImageData_ as a function');

  // Replace the method in content.
  casper.evaluate('function () {' + path + ' = ' + method + '}');
}

function setPiskelFromImageSrc(src) {
  casper.evaluate(
    'function () {\
      pskl.utils.FrameUtils.createFromImageSrc("' + src + '", false, function (frame) {\
        var layer = pskl.model.Layer.fromFrames("l1", [frame]);\
        var piskel = pskl.model.Piskel.fromLayers([layer], 12, {\
          name: "piskel",\
          description: "description"\
        });\
        pskl.app.piskelController.setPiskel(piskel);\
      });\
    }');
}
