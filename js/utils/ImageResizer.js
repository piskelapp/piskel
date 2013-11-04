(function () {
  var ns = $.namespace('pskl.utils');

  ns.ImageResizer = {
    resize : function (image, targetWidth, targetHeight, smoothingEnabled) {
      var canvas = pskl.CanvasUtils.createCanvas(targetWidth, targetHeight);
      var context = canvas.getContext('2d');
      context.save();

      if (!smoothingEnabled) {
        pskl.CanvasUtils.disableImageSmoothing(canvas);
      }

      context.translate(canvas.width / 2, canvas.height / 2);
      context.scale(targetWidth / image.width, targetHeight / image.height);
      context.drawImage(image, -image.width / 2, -image.height / 2);
      context.restore();

      return canvas;
    },

    /**
     * Manual implementation of resize using a nearest neighbour algorithm
     * It is slower than relying on the native 'disabledImageSmoothing' available on CanvasRenderingContext2d.
     * But it can be useful if :
     * - IE < 11 (doesn't support msDisableImageSmoothing)
     * - need to display a gap between pixel
     *
     * @param  {Canvas2d} source original image to be resized, as a 2d canvas
     * @param  {Number} zoom   ratio between desired dim / source dim
     * @param  {Number} margin gap to be displayed between pixels
     * @return {Canvas2d} the resized canvas
     */
    resizeNearestNeighbour : function (source, zoom, margin) {
      margin = margin || 0;
      var canvas = pskl.CanvasUtils.createCanvas(zoom*source.width, zoom*source.height);
      var context = canvas.getContext('2d');

      var imgData = pskl.CanvasUtils.getImageDataFromCanvas(source);

      var yRanges = {},
        xOffset = 0,
        yOffset = 0,
        xRange,
        yRange;
      // Draw the zoomed-up pixels to a different canvas context
      for (var x = 0; x < source.width; x++) {
        // Calculate X Range
        xRange = (((x + 1) * zoom) | 0) - xOffset;

        for (var y = 0; y < source.height; y++) {
          // Calculate Y Range
          if (!yRanges[y + ""]) {
            // Cache Y Range
            yRanges[y + ""] = (((y + 1) * zoom) | 0) - yOffset;
          }
          yRange = yRanges[y + ""];

          var i = (y * source.width + x) * 4;
          var r = imgData[i];
          var g = imgData[i + 1];
          var b = imgData[i + 2];
          var a = imgData[i + 3];

          context.fillStyle = "rgba(" + r + "," + g + "," + b + "," + (a / 255) + ")";
          context.fillRect(xOffset, yOffset, xRange-margin, yRange-margin);

          yOffset += yRange;
        }
        yOffset = 0;
        xOffset += xRange;
      }
      return canvas;
    }
  };
})();