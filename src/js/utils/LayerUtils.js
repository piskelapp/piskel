(function () {
  var ns = $.namespace('pskl.utils');

  ns.LayerUtils = {
    /**
     * Create a pskl.model.Layer from an Image object.
     * Transparent pixels will either be converted to completely opaque or completely transparent pixels.
     * @param  {Image} image source image
     * @return {pskl.model.Frame} corresponding frame
     */
    createFromImage : function (image, frameCount) {
      var w = image.width,
        h = image.height,
        frameWidth = w / frameCount;

      var canvas = pskl.CanvasUtils.createCanvas(w, h);
      var context = canvas.getContext('2d');

      context.drawImage(image, 0,0,w,h,0,0,w,h);
      // Draw the zoomed-up pixels to a different canvas context
      var frames = [];
      for (var i = 0 ; i < frameCount ; i++) {
        var imgData = context.getImageData(frameWidth*i,0,frameWidth,h).data;
        var frame = pskl.utils.FrameUtils.createFromImageData(imgData, frameWidth, h);
        frames.push(frame);
      }
      return frames;
    }
  };

})();