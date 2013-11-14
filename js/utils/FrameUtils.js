(function () {
  var ns = $.namespace('pskl.utils');

  ns.FrameUtils = {
    merge : function (frames) {
      var merged = null;
      if (frames.length) {
        merged = frames[0].clone();
        var w = merged.getWidth(), h = merged.getHeight();
        for (var i = 1 ; i < frames.length ; i++) {
          pskl.utils.FrameUtils.mergeFrames_(merged, frames[i]);
        }
      }
      return merged;
    },

    mergeFrames_ : function (frameA, frameB) {
      frameB.forEachPixel(function (p, col, row) {
        if (p != Constants.TRANSPARENT_COLOR) {
          frameA.setPixel(col, row, p);
        }
      });
    },

    /**
     * Create a pskl.model.Frame from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     * @param  {Image} image source image
     * @return {pskl.model.Frame} corresponding frame
     */
    createFromImage : function (image) {
      var w = image.width,
        h = image.height;
      var canvas = pskl.CanvasUtils.createCanvas(w, h);
      var context = canvas.getContext('2d');

      context.drawImage(image, 0,0,w,h,0,0,w,h);
      var imgData = context.getImageData(0,0,w,h).data;
      return pskl.utils.FrameUtils.createFromImageData(imgData, w, h);
    },

    createFromImageData : function (imageData, width, height) {
      // Draw the zoomed-up pixels to a different canvas context
      var grid = [];
      for (var x = 0 ; x < width ; x++){
        grid[x] = [];
        for (var y = 0 ; y < height ; y++){
          // Find the starting index in the one-dimensional image data
          var i = (y * width + x)*4;
          var r = imageData[i  ];
          var g = imageData[i+1];
          var b = imageData[i+2];
          var a = imageData[i+3];
          if (a < 125) {
            grid[x][y] = Constants.TRANSPARENT_COLOR;
          } else {
            grid[x][y] = pskl.utils.FrameUtils.rgbToHex(r,g,b);
          }
        }
      }
      return pskl.model.Frame.fromPixelGrid(grid);
    },

    /**
     * Convert a rgb(Number, Number, Number) color to hexadecimal representation
     * @param  {Number} r red value, between 0 and 255
     * @param  {Number} g green value, between 0 and 255
     * @param  {Number} b blue value, between 0 and 255
     * @return {String} hex representation of the color '#ABCDEF'
     */
    rgbToHex : function (r, g, b) {
      return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    },

    /**
     * Convert a color component (as a Number between 0 and 255) to its string hexa representation
     * @param  {Number} c component value, between 0 and 255
     * @return {String} eg. '0A'
     */
    componentToHex : function (c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }
  };
})();
