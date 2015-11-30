(function () {
  var ns = $.namespace('pskl');

  ns.PixelUtils = {

    getRectanglePixels : function (x0, y0, x1, y1) {
      var rectangle = this.getOrderedRectangleCoordinates(x0, y0, x1, y1);
      var pixels = [];

      for (var x = rectangle.x0 ; x <= rectangle.x1 ; x++) {
        for (var y = rectangle.y0 ; y <= rectangle.y1 ; y++) {
          pixels.push({'col': x, 'row': y});
        }
      }

      return pixels;
    },

    getBoundRectanglePixels : function (x0, y0, x1, y1) {
      var rectangle = this.getOrderedRectangleCoordinates(x0, y0, x1, y1);
      var pixels = [];
      // Creating horizontal sides of the rectangle:
      for (var x = rectangle.x0; x <= rectangle.x1; x++) {
        pixels.push({'col': x, 'row': rectangle.y0});
        pixels.push({'col': x, 'row': rectangle.y1});
      }

      // Creating vertical sides of the rectangle:
      for (var y = rectangle.y0; y <= rectangle.y1; y++) {
        pixels.push({'col': rectangle.x0, 'row': y});
        pixels.push({'col': rectangle.x1, 'row': y});
      }

      return pixels;
    },

    /**
     * Return an object of ordered rectangle coordinate.
     * In returned object {x0, y0} => top left corner - {x1, y1} => bottom right corner
     * @private
     */
    getOrderedRectangleCoordinates : function (x0, y0, x1, y1) {
      return {
        x0 : Math.min(x0, x1),
        y0 : Math.min(y0, y1),
        x1 : Math.max(x0, x1),
        y1 : Math.max(y0, y1)
      };
    },

    /**
     * Return the list of pixels that would have been filled by a paintbucket tool applied
     * on pixel at coordinate (x,y).
     * This function is not altering the Frame object argument.
     *
     * @param frame pskl.model.Frame The frame target in which we want to paintbucket
     * @param col number Column coordinate in the frame
     * @param row number Row coordinate in the frame
     *
     * @return an array of the pixel coordinates paint with the replacement color
     */
    getSimilarConnectedPixelsFromFrame: function(frame, col, row) {
      // To get the list of connected (eg the same color) pixels, we will use the paintbucket algorithm
      // in a fake cloned frame. The returned pixels by the paintbucket algo are the painted pixels
      // and are as well connected.
      var fakeFrame = frame.clone(); // We just want to
      var fakeFillColor = 'sdfsdfsdf'; // A fake color that will never match a real color.
      var paintedPixels = this.paintSimilarConnectedPixelsFromFrame(fakeFrame, col, row, fakeFillColor);

      return paintedPixels;
    },

    /**
     * Apply the paintbucket tool in a frame at the (col, row) initial position
     * with the replacement color.
     *
     * @param frame pskl.model.Frame The frame target in which we want to paintbucket
     * @param col number Column coordinate in the frame
     * @param row number Row coordinate in the frame
     * @param replacementColor string Hexadecimal color used to fill the area
     *
     * @return an array of the pixel coordinates paint with the replacement color
     */
    paintSimilarConnectedPixelsFromFrame: function(frame, col, row, replacementColor) {
      /**
       *  Queue linear Flood-fill (node, target-color, replacement-color):
       *   1. Set Q to the empty queue.
       *   2. If the color of node is not equal to target-color, return.
       *   3. Add node to Q.
       *   4. For each element n of Q:
       *   5.     If the color of n is equal to target-color:
       *   6.         Set w and e equal to n.
       *   7.         Move w to the west until the color of the node to the west of w no longer matches target-color.
       *   8.         Move e to the east until the color of the node to the east of e no longer matches target-color.
       *   9.         Set the color of nodes between w and e to replacement-color.
       *  10.         For each node n between w and e:
       *  11.             If the color of the node to the north of n is target-color, add that node to Q.
       *  12.             If the color of the node to the south of n is target-color, add that node to Q.
       *  13. Continue looping until Q is exhausted.
       *  14. Return.
       */
      var targetColor;
      try {
        targetColor = frame.getPixel(col, row);
      } catch (e) {
        // Frame out of bound exception.
      }

      if (targetColor == replacementColor) {
        return;
      }

      var paintedPixels = pskl.PixelUtils.visitConnectedPixels({col:col, row:row}, frame, function (pixel) {
        if (frame.containsPixel(pixel.col, pixel.row) && frame.getPixel(pixel.col, pixel.row) == targetColor) {
          frame.setPixel(pixel.col, pixel.row, replacementColor);
          return true;
        }
        return false;
      });
      return paintedPixels;
    },

    /**
     * Starting from a provided origin, visit connected pixels using a visitor function.
     * After visiting a pixel, select the 4 connected pixels (up, right, down, left).
     * Call the provided visitor on each pixel. The visitor should return true if the
     * pixel should be considered as connected. If the pixel is connected repeat the
     * process with its own connected pixels
     *
     * TODO : Julian : The visitor is also responsible for making sure a pixel is never
     * visited twice. This could be handled by default by this method.
     *
     * @return {Array} the array of visited pixels {col, row}
     */
    visitConnectedPixels : function (pixel, frame, pixelVisitor) {
      var col = pixel.col;
      var row = pixel.row;

      var queue = [];
      var visitedPixels = [];
      var dy = [-1, 0, 1, 0];
      var dx = [0, 1, 0, -1];

      queue.push(pixel);
      visitedPixels.push(pixel);
      pixelVisitor(pixel);

      var loopCount = 0;
      var cellCount = frame.getWidth() * frame.getHeight();
      while (queue.length > 0) {
        loopCount ++;

        var currentItem = queue.pop();

        for (var i = 0; i < 4; i++) {
          var nextCol = currentItem.col + dx[i];
          var nextRow = currentItem.row + dy[i];
          try {
            var connectedPixel = {'col': nextCol, 'row': nextRow};
            var isValid = pixelVisitor(connectedPixel);
            if (isValid) {
              queue.push(connectedPixel);
              visitedPixels.push(connectedPixel);
            }
          } catch (e) {
            // Frame out of bound exception.
          }
        }

        // Security loop breaker:
        if (loopCount > 10 * cellCount) {
          console.log('loop breaker called');
          break;
        }
      }

      return visitedPixels;
    },

    /**
     * Calculate and return the maximal zoom level to display a picture in a given container.
     *
     * @param container jQueryObject Container where the picture should be displayed
     * @param number pictureHeight height in pixels of the picture to display
     * @param number pictureWidth width in pixels of the picture to display
     * @return number maximal zoom
     */
    calculateZoomForContainer : function (container, pictureHeight, pictureWidth) {
      return this.calculateZoom(container.height(), container.width(), pictureHeight, pictureWidth);
    }
  };
})();
