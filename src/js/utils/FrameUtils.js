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
      var context = canvas.getContext('2d');
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
          for (var i = 0, length = pixels.length; i < length; i++) {
            if (pixels[i] == constantTransparentColorInt) {
              pixels[i] = transparentColorInt;
            }
          }
        }

        // Imagedata from cache
        var imageDataKey = w + '-' + h;
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
        var offCanvasKey = w + '-' + h;
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
      for (var i = 0, length = frameA.getWidth() * frameA.getHeight(); i < length; ++i) {
        if (frameB.pixels[i] != transparentColorInt && frameA.pixels[i] != frameB.pixels[i]) {
          frameA.pixels[i] = frameB.pixels[i];
        }
      }
    },

    resize : function (frame, targetWidth, targetHeight, smoothing) {
      var image = pskl.utils.FrameUtils.toImage(frame);
      var resizedImage = pskl.utils.ImageResizer.resize(image, targetWidth, targetHeight, smoothing);
      return pskl.utils.FrameUtils.createFromImage(resizedImage);
    },

    removeTransparency : function (frame) {
      frame.forEachPixel(function (color, x, y) {
        var alpha = color >> 24 >>> 0 & 0xff;
        if (alpha && alpha !== 255) {
          var rounded = Math.round(alpha / 255) * 255;
          var roundedColor = color - (alpha << 24 >>> 0) + (rounded << 24 >>> 0);
          frame.setPixel(x, y, roundedColor);
        }
      });
    },

    createFromCanvas : function (canvas, x, y, w, h, preserveOpacity) {
      var imgData = canvas.getContext('2d').getImageData(x, y, w, h).data;
      return pskl.utils.FrameUtils.createFromImageData_(imgData, w, h, preserveOpacity);
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
      var frame = new pskl.model.Frame(width, height);
      frame.pixels = new Uint32Array(imageData.buffer);
      if (!preserveOpacity) {
        pskl.utils.FrameUtils.removeTransparency(frame);
      }

      return frame;
    },

    /**
     * Create a Frame array from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     *
     * @param  {Image} image source image
     * @param  {Number} frameCount number of frames in the spritesheet
     * @return {Array<Frame>}
     */
    createFramesFromSpritesheet : function (image, frameCount) {
      var layout = [];
      for (var i = 0 ; i < frameCount ; i++) {
        layout.push([i]);
      }
      var chunkFrames = pskl.utils.FrameUtils.createFramesFromChunk(image, layout);
      return chunkFrames.map(function (chunkFrame) {
        return chunkFrame.frame;
      });
    },

    /**
     * Create a Frame array from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     *
     * @param  {Image} image source image
     * @param  {Array <Array>} layout description of the frame indexes expected to be found in the chunk
     * @return {Array<Object>} array of objects containing: {index: frame index, frame: frame instance}
     */
    createFramesFromChunk : function (image, layout) {
      var width = image.width;
      var height = image.height;

      // Recalculate the expected frame dimensions from the layout information
      var frameWidth = width / layout.length;
      var frameHeight = height / layout[0].length;

      // Create a canvas adapted to the image size
      var canvas = pskl.utils.CanvasUtils.createCanvas(frameWidth, frameHeight);
      var context = canvas.getContext('2d');

      // Draw the zoomed-up pixels to a different canvas context
      var chunkFrames = [];
      for (var i = 0 ; i < layout.length ; i++) {
        var row = layout[i];
        for (var j = 0 ; j < row.length ; j++) {
          context.clearRect(0, 0 , frameWidth, frameHeight);
          context.drawImage(image, frameWidth * i, frameHeight * j,
                            frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
          var frame = pskl.utils.FrameUtils.createFromCanvas(canvas, 0, 0, frameWidth, frameHeight);
          chunkFrames.push({
            index : layout[i][j],
            frame : frame
          });
        }
      }

      return chunkFrames;
    }
  };
})();
