(function () {
  var ns = $.namespace('pskl.tools.transform');

  ns.TransformUtils = {
    VERTICAL : 'VERTICAL',
    HORIZONTAL : 'HORIZONTAL',
    flip : function (frame, axis) {
      var clone = frame.clone();
      var w = frame.getWidth();
      var h = frame.getHeight();

      clone.forEachPixel(function (color, x, y) {
        if (axis === ns.TransformUtils.VERTICAL) {
          x = w - x - 1;
        } else if (axis === ns.TransformUtils.HORIZONTAL) {
          y = h - y - 1;
        }
        frame.setPixel(x, y, color);
      });

      return frame;
    },

    CLOCKWISE : 'clockwise',
    COUNTERCLOCKWISE : 'counterclockwise',
    rotate : function (frame, direction) {
      var clone = frame.clone();
      var w = frame.getWidth();
      var h = frame.getHeight();

      var max =  Math.max(w, h);
      var xDelta = Math.ceil((max - w) / 2);
      var yDelta = Math.ceil((max - h) / 2);

      frame.forEachPixel(function (color, x, y) {
        var _x = x;
        var _y = y;

        // Convert to square coords
        x = x + xDelta;
        y = y + yDelta;

        // Perform the rotation
        var tmpX = x;
        var tmpY = y;
        if (direction === ns.TransformUtils.CLOCKWISE) {
          x = tmpY;
          y = max - 1 - tmpX;
        } else if (direction === ns.TransformUtils.COUNTERCLOCKWISE) {
          y = tmpX;
          x = max - 1 - tmpY;
        }

        // Convert the coordinates back to the rectangular grid
        x = x - xDelta;
        y = y - yDelta;
        if (clone.containsPixel(x, y)) {
          frame.setPixel(_x, _y, clone.getPixel(x, y));
        } else {
          frame.setPixel(_x, _y, Constants.TRANSPARENT_COLOR);
        }
      });

      return frame;
    },

    center : function(frame) {
      // Figure out the boundary
      var minx = frame.width;
      var miny = frame.height;
      var maxx = 0;
      var maxy = 0;
      var transparentColorInt = pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
      frame.forEachPixel(function (color, x, y) {
        if (color !== transparentColorInt) {
          minx = Math.min(minx, x);
          maxx = Math.max(maxx, x);
          miny = Math.min(miny, y);
          maxy = Math.max(maxy, y);
        }
      });

      // Calculate how much to move the pixels
      var bw = (maxx - minx + 1) / 2;
      var bh = (maxy - miny + 1) / 2;
      var fw = frame.width / 2;
      var fh = frame.height / 2;

      var dx = Math.floor(fw - bw - minx);
      var dy = Math.floor(fh - bh - miny);

      // Actually move the pixels
      var clone = frame.clone();
      frame.forEachPixel(function(color, x, y) {
        var _x = x;
        var _y = y;

        x -= dx;
        y -= dy;

        if (clone.containsPixel(x, y)) {
          frame.setPixel(_x, _y, clone.getPixel(x, y));
        } else {
          frame.setPixel(_x, _y, Constants.TRANSPARENT_COLOR);
        }
      });

      return frame;
    }
  };
})();
