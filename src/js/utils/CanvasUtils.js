(function () {
  var ns = $.namespace('pskl.utils');

  ns.CanvasUtils = {
    createCanvas : function (width, height, classList) {
      var canvas = document.createElement('canvas');
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);

      if (typeof classList == 'string') {
        classList = [classList];
      }
      if (Array.isArray(classList)) {
        for (var i = 0 ; i < classList.length ; i++) {
          canvas.classList.add(classList[i]);
        }
      }

      return canvas;
    },

    createFromImageData : function (imageData) {
      var canvas = pskl.utils.CanvasUtils.createCanvas(imageData.width, imageData.height);
      var context = canvas.getContext('2d');
      context.putImageData(imageData, 0, 0);
      return canvas;
    },

    createFromImage : function (image) {
      var canvas = pskl.utils.CanvasUtils.createCanvas(image.width, image.height);
      var context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
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
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      }
    },

    clone : function (canvas) {
      var clone = pskl.utils.CanvasUtils.createCanvas(canvas.width, canvas.height);

      //apply the old canvas to the new one
      clone.getContext('2d').drawImage(canvas, 0, 0);

      //return the new canvas
      return clone;
    },

    getImageDataFromCanvas : function (canvas) {
      var sourceContext = canvas.getContext('2d');
      return sourceContext.getImageData(0, 0, canvas.width, canvas.height).data;
    },

    getBase64FromCanvas : function (canvas, format) {
      format = format || 'png';
      var data = canvas.toDataURL('image/' + format);
      return data.substr(data.indexOf(',')+1);
    }
  };
})();