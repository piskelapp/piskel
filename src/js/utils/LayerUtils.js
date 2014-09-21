(function () {
  var ns = $.namespace('pskl.utils');

  ns.LayerUtils = {
    /**
     * Create a pskl.model.Layer from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     * @param  {Image} image source image
     * @return {pskl.model.Frame} corresponding frame
     */
    createLayerFromSpritesheet : function (image, frameCount) {
      var width = image.width,
        height = image.height,
        frameWidth = width / frameCount;

      var canvas = pskl.CanvasUtils.createCanvas(frameWidth, height);
      var context = canvas.getContext('2d');

      // Draw the zoomed-up pixels to a different canvas context
      var frames = [];
      for (var i = 0 ; i < frameCount ; i++) {
        context.clearRect(0, 0 , frameWidth, height);
        context.drawImage(image, frameWidth * i, 0, frameWidth, height, 0, 0, frameWidth, height);
        var frame = pskl.utils.FrameUtils.createFromImage(canvas);
        frames.push(frame);
      }
      return frames;
    }
  };

})();