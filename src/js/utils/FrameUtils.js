(function () {
  var ns = $.namespace('pskl.utils');
  var colorCache = {};
  var offCanvasPool = {};
  var imageDataPool = {};
  ns.FrameUtils = {
    /**
     * Render a Frame object as an image.
     * Can optionally scale it (zoom)
     * @param frame {Frame} frame
     * @param zoom {Number} zoom
     * @return {Image}
     */
    toImage : function (frame, zoom, opacity) {
      zoom = zoom || 1;
      opacity = isNaN(opacity) ? 1 : opacity;

      var canvasRenderer = new pskl.rendering.CanvasRenderer(frame, zoom);
      canvasRenderer.drawTransparentAs(Constants.TRANSPARENT_COLOR);
      canvasRenderer.setOpacity(opacity);
      return canvasRenderer.render();
    },

    /**
     * Draw the provided frame in a 2d canvas
     *
     * @param {Frame|RenderedFrame} frame the frame to draw
     * @param {Canvas} canvas the canvas target
     * @param {String} transparentColor (optional) color to use to represent transparent pixels.
     * @param {String} globalAlpha (optional) global frame opacity
     */
    drawToCanvas : function (frame, canvas, transparentColor, globalAlpha) {
      var context;
      if (canvas.context) {
        context = canvas.context;
      } else {
        context = canvas.context = canvas.getContext('2d');
      }
      globalAlpha = isNaN(globalAlpha) ? 1 : globalAlpha;
      context.globalAlpha = globalAlpha;
      transparentColor = transparentColor || Constants.TRANSPARENT_COLOR;

      if (frame instanceof pskl.model.frame.RenderedFrame) {
        context.fillRect(transparentColor, 0, 0, frame.getWidth(), frame.getHeight());
        context.drawImage(frame.getRenderedFrame(), 0, 0);
      } else {
        var w = frame.getWidth();
        var h = frame.getHeight();
        var pixels = frame.pixels;

        // Replace transparent color
        var constantTransparentColorInt = pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
        var transparentColorInt = pskl.utils.colorToInt(transparentColor);
        if (transparentColorInt != constantTransparentColorInt) {
          pixels = frame.getPixels();
          for (var i = 0; i < pixels.length; i++) {
            if (pixels[i] == constantTransparentColorInt) {
              pixels[i] = transparentColorInt;
            }
          }
        }

        // Imagedata from cache
        var imageDataKey = w+"-"+h;
        var imageData;
        if (!imageDataPool[imageDataKey]) {
          imageData = imageDataPool[imageDataKey] = context.createImageData(w, h);
        } else {
          imageData = imageDataPool[imageDataKey];
        }

        // Convert to uint8 and set the data
        var data = new Uint8ClampedArray(pixels.buffer);
        var imgDataData = imageData.data;
        imgDataData.set(data);

        // Offcanvas from cache
        var offCanvasKey = w+"-"+h;
        var offCanvas;
        if (!offCanvasPool[offCanvasKey]) {
          offCanvas = offCanvasPool[offCanvasKey] = pskl.utils.CanvasUtils.createCanvas(w, h);
          offCanvas.context = offCanvas.getContext('2d');
        } else {
          offCanvas = offCanvasPool[offCanvasKey];
        }

        // Put pixel data to offcanvas and draw the offcanvas onto the canvas
        offCanvas.context.putImageData(imageData, 0, 0);
        context.drawImage(offCanvas, 0, 0, w, h);
        context.globalAlpha = 1;
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
      var transparentColorInt = pskl.utils.colorToInt(Constants.TRANSPARENT_COLOR);
      frameB.forEachPixel(function (color, col, row) {
        if (color != transparentColorInt) {
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
     * Create a pskl.model.Frame from an Image object. By default transparent
     * pixels will be converted to completely opaque or completely transparent
     * pixels. If preserveOpacity is true the actual opacity of the pixel will
     * be used and the generated frame will contain rgba pixels.
     *
     * @param  {Image} image source image
     * @param  {boolean} preserveOpacity set to true to preserve the opacity
     * @return {pskl.model.Frame} corresponding frame
     */
    createFromImage : function (image, preserveOpacity) {
      var w = image.width;
      var h = image.height;
      var canvas = pskl.utils.CanvasUtils.createCanvas(w, h);
      var context = canvas.getContext('2d');

      context.drawImage(image, 0, 0, w, h, 0, 0, w, h);
      var imgData = context.getImageData(0, 0, w, h).data;
      return pskl.utils.FrameUtils.createFromImageData_(imgData, w, h, preserveOpacity);
    },

    createFromImageData_ : function (imageData, width, height, preserveOpacity) {
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
          if (preserveOpacity) {
            if (a === 0) {
              grid[x][y] = Constants.TRANSPARENT_COLOR;
            } else {
              grid[x][y] = 'rgba(' + [r, g, b, a / 255].join(',') + ')';
            }
          } else {
            if (a < 125) {
              grid[x][y] = Constants.TRANSPARENT_COLOR;
            } else {
              grid[x][y] = pskl.utils.rgbToHex(r, g, b);
            }
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
