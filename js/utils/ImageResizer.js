(function () {
  var ns = $.namespace('pskl.utils');

  ns.ImageResizer = {
    resizeNearestNeighbour : function (image, targetWidth, targetHeight) {

    },

    resize : function (image, targetWidth, targetHeight) {
      var canvas = pskl.CanvasUtils.createCanvas(targetWidth, targetHeight);
      var context = canvas.getContext('2d');

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.scale(targetWidth / image.width, targetHeight / image.height);
      context.drawImage(image, -image.width / 2, -image.height / 2);
      context.restore();

      return canvas;
    }
  };
})();