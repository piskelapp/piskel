(function () {
  var ns = $.namespace("pskl");

  ns.CanvasUtils = {
    createCanvas : function (width, height, classList) {
      var canvas = document.createElement("canvas");
      canvas.setAttribute("width", width);
      canvas.setAttribute("height", height);

      if (typeof classList == "string") {
        classList = [classList];
      }
      if (Array.isArray(classList)) {
        for (var i = 0 ; i < classList.length ; i++) {
          canvas.classList.add(classList[i]);
        }
      }

      return canvas;
    },

    /**
     * By default, all scaling operations on a Canvas 2D Context are performed using antialiasing.
     * Resizing a 32x32 image to 320x320 will lead to a blurry output.
     * On Chrome, FF and IE>=11, this can be disabled by setting a property on the Canvas 2D Context.
     * In this case the browser will use a nearest-neighbor scaling.
     * @param  {Canvas} canvas
     */
    disableImageSmoothing : function (canvas) {
      var context = canvas.getContext('2d');
      context.imageSmoothingEnabled = false;
      context.mozImageSmoothingEnabled = false;
      context.oImageSmoothingEnabled = false;
      context.webkitImageSmoothingEnabled = false;
      context.msImageSmoothingEnabled = false;
    },

    clear : function (canvas) {
      if (canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      }
    },

    getImageDataFromCanvas : function (canvas) {
      var sourceContext = canvas.getContext('2d');
      return sourceContext.getImageData(0, 0, canvas.width, canvas.height).data;
    }
  };
})();