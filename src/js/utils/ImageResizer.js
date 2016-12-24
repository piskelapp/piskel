(function () {
  var ns = $.namespace('pskl.utils');

  ns.ImageResizer = {
    scale : function (image, factor, smoothingEnabled) {
      return ns.ImageResizer.resize(image, image.width * factor, image.height * factor, smoothingEnabled);
    },

    resize : function (image, targetWidth, targetHeight, smoothingEnabled) {
      var canvas = pskl.utils.CanvasUtils.createCanvas(targetWidth, targetHeight);
      var context = canvas.getContext('2d');
      context.save();

      if (!smoothingEnabled) {
        pskl.utils.CanvasUtils.disableImageSmoothing(canvas);
      }

      context.translate(canvas.width / 2, canvas.height / 2);
      context.scale(targetWidth / image.width, targetHeight / image.height);
      context.drawImage(image, -image.width / 2, -image.height / 2);
      context.restore();

      return canvas;
    }
  };
})();
