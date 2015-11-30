(function () {
  var ns = $.namespace('pskl.utils');
  var colorCache = {};
  ns.FrameUtils = {
    /**
     * Render a Frame object as an image.
     * Can optionally scale it (zoom)
     * @param frame {Frame} frame
     * @param zoom {Number} zoom
     * @return {Image}
     */
    toImage : function (frame, zoom) {
      zoom = zoom || 1;
      var canvasRenderer = new pskl.rendering.CanvasRenderer(frame, zoom);
      canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
      return canvasRenderer.render();
    },

    /**
     * Draw the provided frame in a 2d canvas
     *
     * @param frame {pskl.model.Frame} frame the frame to draw
     * @param canvas {Canvas} canvas the canvas target
     * @param transparentColor {String} transparentColor (optional) color to use to represent transparent pixels.
     */
    drawToCanvas : function (frame, canvas, transparentColor) {
      var context = canvas.getContext('2d');

      transparentColor = transparentColor || Constants.TRANSPARENT_COLOR;
      for (var x = 0, width = frame.getWidth() ; x < width ; x++) {
        for (var y = 0, height = frame.getHeight() ; y < height ; y++) {
          var color = frame.getPixel(x, y);

          // accumulate all the pixels of the same color to speed up rendering
          // by reducting fillRect calls
          var w = 1;
          while (color === frame.getPixel(x, y + w) && (y + w) < height) {
            w++;
          }

          if (color == Constants.TRANSPARENT_COLOR) {
            color = transparentColor;
          }

          pskl.utils.FrameUtils.renderLine_(color, x, y, w, context);
          y = y + w - 1;
        }
      }
    },

    /**
     * Render a line of a single color in a given canvas 2D context.
     *
     * @param  color {String} color to draw
     * @param  x {Number} x coordinate
     * @param  y {Number} y coordinate
     * @param  width {Number} width of the line to draw, in pixels
     * @param  context {CanvasRenderingContext2D} context of the canvas target
     */
    renderLine_ : function (color, x, y, width, context) {
      if (color === Constants.TRANSPARENT_COLOR || color === null) {
        return;
      }
      context.fillStyle = color;
      context.fillRect(x, y, 1, width);
    },

    merge : function (frames) {
      var merged = null;
      if (frames.length) {
        merged = frames[0].clone();
        for (var i = 1 ; i < frames.length ; i++) {
          pskl.utils.FrameUtils.mergeFrames_(merged, frames[i]);
        }
      }
      return merged;
    },

    mergeFrames_ : function (frameA, frameB) {
      frameB.forEachPixel(function (color, col, row) {
        if (color != Constants.TRANSPARENT_COLOR) {
          frameA.setPixel(col, row, color);
        }
      });
    },

    resize : function (frame, targetWidth, targetHeight, smoothing) {
      var image = pskl.utils.FrameUtils.toImage(frame);
      var resizedImage = pskl.utils.ImageResizer.resize(image, targetWidth, targetHeight, smoothing);
      return pskl.utils.FrameUtils.createFromImage(resizedImage);
    },

    /*
     * Create a pskl.model.Frame from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     * @param  {Image} image source image
     * @return {pskl.model.Frame} corresponding frame
     */
    createFromImage : function (image) {
      var w = image.width;
      var h = image.height;
      var canvas = pskl.utils.CanvasUtils.createCanvas(w, h);
      var context = canvas.getContext('2d');

      context.drawImage(image, 0, 0, w, h, 0, 0, w, h);
      var imgData = context.getImageData(0, 0, w, h).data;
      return pskl.utils.FrameUtils.createFromImageData_(imgData, w, h);
    },

    createFromImageData_ : function (imageData, width, height) {
      // Draw the zoomed-up pixels to a different canvas context
      var grid = [];
      for (var x = 0 ; x < width ; x++) {
        grid[x] = [];
        for (var y = 0 ; y < height ; y++) {
          // Find the starting index in the one-dimensional image data
          var i = (y * width + x) * 4;
          var r = imageData[i  ];
          var g = imageData[i + 1];
          var b = imageData[i + 2];
          var a = imageData[i + 3];
          if (a < 125) {
            grid[x][y] = Constants.TRANSPARENT_COLOR;
          } else {
            grid[x][y] = pskl.utils.rgbToHex(r, g, b);
          }
        }
      }
      return pskl.model.Frame.fromPixelGrid(grid);
    },

    /**
     * Alpha compositing using porter duff algorithm :
     * http://en.wikipedia.org/wiki/Alpha_compositing
     * http://keithp.com/~keithp/porterduff/p253-porter.pdf
     * @param  {String} strColor1 color over
     * @param  {String} strColor2 color under
     * @return {String} the composite color
     */
    mergePixels__ : function (strColor1, strColor2, globalOpacity1) {
      var col1 = pskl.utils.FrameUtils.toRgba__(strColor1);
      var col2 = pskl.utils.FrameUtils.toRgba__(strColor2);
      if (typeof globalOpacity1 == 'number') {
        col1 = JSON.parse(JSON.stringify(col1));
        col1.a = globalOpacity1 * col1.a;
      }
      var a = col1.a + col2.a * (1 - col1.a);

      var r = ((col1.r * col1.a + col2.r * col2.a * (1 - col1.a)) / a) | 0;
      var g = ((col1.g * col1.a + col2.g * col2.a * (1 - col1.a)) / a) | 0;
      var b = ((col1.b * col1.a + col2.b * col2.a * (1 - col1.a)) / a) | 0;

      return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    },

    /**
     * Convert a color defined as a string (hex, rgba, rgb, 'TRANSPARENT') to an Object with r,g,b,a properties.
     * r, g and b are integers between 0 and 255, a is a float between 0 and 1
     * @param  {String} c color as a string
     * @return {Object} {r:Number,g:Number,b:Number,a:Number}
     */
    toRgba__ : function (c) {
      if (colorCache[c]) {
        return colorCache[c];
      }
      var color, matches;
      if (c === 'TRANSPARENT') {
        color = {
          r : 0,
          g : 0,
          b : 0,
          a : 0
        };
      } else if (c.indexOf('rgba(') != -1) {
        matches = /rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(1|0\.\d+)\s*\)/.exec(c);
        color = {
          r : parseInt(matches[1], 10),
          g : parseInt(matches[2], 10),
          b : parseInt(matches[3], 10),
          a : parseFloat(matches[4])
        };
      } else if (c.indexOf('rgb(') != -1) {
        matches = /rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(c);
        color = {
          r : parseInt(matches[1], 10),
          g : parseInt(matches[2], 10),
          b : parseInt(matches[3], 10),
          a : 1
        };
      } else {
        matches = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c);
        color = {
          r : parseInt(matches[1], 16),
          g : parseInt(matches[2], 16),
          b : parseInt(matches[3], 16),
          a : 1
        };
      }
      colorCache[c] = color;
      return color;
    }
  };
})();
