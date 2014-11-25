(function () {
  var ns = $.namespace('pskl.utils');

  ns.FrameTransform = {
    VERTICAL : 'vertical',
    HORIZONTAL : 'HORIZONTAL',
    flip : function (frame, axis) {
      var clone = frame.clone();
      var w = frame.getWidth();
      var h = frame.getHeight();

      clone.forEachPixel(function (color, x, y) {
        if (axis === ns.FrameTransform.VERTICAL) {
          x = w-x-1;
        } else if (axis === ns.FrameTransform.HORIZONTAL) {
          y = h-y-1;
        }
        frame.pixels[x][y] = color;
      });
      frame.version++;
      return frame;
    },

    CLOCKWISE : 'clockwise',
    COUNTERCLOCKWISE : 'counterclockwise',
    rotate : function (frame, direction) {
      var clone = frame.clone();
      var w = frame.getWidth();
      var h = frame.getHeight();

      var max =  Math.max(w, h);
      var xDelta = Math.ceil((max - w)/2);
      var yDelta = Math.ceil((max - h)/2);

      frame.forEachPixel(function (color, x, y) {
        var _x = x, _y = y;

        // Convert to square coords
        x = x + xDelta;
        y = y + yDelta;

        // Perform the rotation
        var tmpX = x, tmpY = y;
        if (direction === ns.FrameTransform.CLOCKWISE) {
          x = tmpY;
          y = max - 1 - tmpX;
        } else if (direction === ns.FrameTransform.COUNTERCLOCKWISE) {
          y = tmpX;
          x = max - 1 - tmpY;
        }

        // Convert the coordinates back to the rectangular grid
        x = x - xDelta;
        y = y - yDelta;
        if (clone.containsPixel(x, y)) {
          frame.pixels[_x][_y] = clone.getPixel(x, y);
        } else {
          frame.pixels[_x][_y] = Constants.TRANSPARENT_COLOR;
        }
      });
      frame.version++;
      return frame;
    }
  };
})();