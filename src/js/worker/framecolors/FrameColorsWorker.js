(function () {
  var ns = $.namespace('pskl.worker.framecolors');

  if (Constants.TRANSPARENT_COLOR !== 'rgba(0, 0, 0, 0)') {
    throw 'Constants.TRANSPARENT_COLOR, please update FrameColorsWorker';
  }

  ns.FrameColorsWorker = function () {

    var TRANSPARENT_COLOR = 'rgba(0, 0, 0, 0)';

    var componentToHex = function (c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    };

    var rgbToHex = function (r, g, b) {
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    var toHexString_ = function(color) {
      if (color === TRANSPARENT_COLOR) {
        return color;
      } else {
        color = color.replace(/\s/g, '');
        var hexRe = (/^#([a-f0-9]{3}){1,2}$/i);
        var rgbRe = (/^rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)$/i);
        if (hexRe.test(color)) {
          return color.toLowerCase();
        } else if (rgbRe.test(color)) {
          var exec = rgbRe.exec(color);
          return rgbToHex(exec[1] * 1, exec[2] * 1, exec[3] * 1);
        }
      }
    };

    var intHexCache = {};
    var intToHex = function(int) {
      if (intHexCache[int]) {
        return intHexCache[int];
      }

      var hex = rgbToHex(int & 0xff, int >> 8 & 0xff, int >> 16 & 0xff);
      intHexCache[int] = hex;
      return hex;
    };

    var getFrameColors = function (frame) {
      var frameColors = {};
      var transparentColorInt = this.TRANSPARENT_COLOR;
      var colors = 0;
      for (var i = 0, length = frame.length; i < length && colors < this.MAX_WORKER_COLORS; i++) {
        var color = frame[i];
        if (color !== transparentColorInt) {
          if (!frameColors[color]) {
            frameColors[color] = true;
            colors++;
          }
        }
      }
      return frameColors;
    };

    this.onmessage = function(event) {
      try {
        this.TRANSPARENT_COLOR = event.data[0];
        this.MAX_WORKER_COLORS = event.data[1];
        var frame = event.data[2];
        var colors = getFrameColors(frame);
        this.postMessage({
          type : 'SUCCESS',
          colors : colors
        });
      } catch (e) {
        this.postMessage({
          type : 'ERROR',
          message : e.message
        });
      }
    };
  };
})();
