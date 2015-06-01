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
     * Splits the specified image into several new canvas elements based on the
     * supplied horizontal (x) and vertical (y) counts.
     * @param image The source image that will be split
     * @param {Number} frameCountX The number of frames in the horizontal axis
     * @param {Number} frameCountY The number of frames in the vertical axis
     * @returns {Array} An array of canvas elements that contain the split frames
     */
    createFramesFromImage : function (image, frameCountX, frameCountY) {
      var canvasArray = [];
      var frameWidth = image.width / frameCountX;
      var frameHeight = image.height / frameCountY;

      // Loop through the frames prioritizing the spritesheet as horizonal strips
      for (var y = 0; y < frameCountY; y++) {
        for (var x = 0; x < frameCountX; x++) {
          var canvas = pskl.utils.CanvasUtils.createCanvas(frameWidth, frameHeight);
          var context = canvas.getContext('2d');

          // Blit the correct part of the source image into the new canvas
          context.drawImage(
            image,
            x * frameWidth,
            y * frameHeight,
            frameWidth,
            image.height,
            0,
            0,
            frameWidth,
            image.height);

          canvasArray.push(canvas);
        }
      }
      return canvasArray;
    },

    /**
     * By default, all scaling operations on a Canvas 2D Context are performed using antialiasing.
     * Resizing a 32x32 image to 320x320 will lead to a blurry output.
     * On Chrome, FF and IE>=11, this can be disabled by setting a property on the Canvas 2D Context.
     * In this case the browser will use a nearest-neighbor scaling.
     * @param  {Canvas} canvas
     */
    disableImageSmoothing : function (canvas) {
      pskl.utils.CanvasUtils.setImageSmoothing(canvas, false);
    },

    enableImageSmoothing : function (canvas) {
      pskl.utils.CanvasUtils.setImageSmoothing(canvas, true);
    },

    setImageSmoothing : function (canvas, smoothing) {
      var context = canvas.getContext('2d');
      context.imageSmoothingEnabled = smoothing;
      context.mozImageSmoothingEnabled = smoothing;
      context.oImageSmoothingEnabled = smoothing;
      context.webkitImageSmoothingEnabled = smoothing;
      context.msImageSmoothingEnabled = smoothing;
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
      return data.substr(data.indexOf(',') + 1);
    }
  };
})();
