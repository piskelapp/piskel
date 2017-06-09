(function () {
  var ns = $.namespace('pskl.worker.imageprocessor');

  ns.ImageProcessorWorker = function () {
    var currentStep;
    var currentProgress;
    var currentTotal;

    var initStepCounter_ = function (total) {
      currentStep = 0;
      currentProgress = 0;
      currentTotal = total;
    };

    var postStep_ = function () {
      currentStep = currentStep + 1;
      var progress = ((currentStep / currentTotal) * 100).toFixed(1);
      if (progress != currentProgress) {
        currentProgress = progress;
        this.postMessage({
          type : 'STEP',
          progress : currentProgress,
          currentStep : currentStep,
          total : currentTotal
        });
      }
    };

    var componentToHex = function (c) {
      var hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
    };

    var rgbToHex = function (r, g, b) {
      return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    var imageDataToGrid = function (imageData, width, height, transparent) {
      // Draw the zoomed-up pixels to a different canvas context
      var grid = [];
      for (var x = 0 ; x < width ; x++) {
        grid[x] = [];
        postStep_();
        for (var y = 0 ; y < height ; y++) {
          // Find the starting index in the one-dimensional image data
          var i = (y * width + x) * 4;
          var r = imageData[i];
          var g = imageData[i + 1];
          var b = imageData[i + 2];
          var a = imageData[i + 3];
          if (a < 125) {
            grid[x][y] = transparent;
          } else {
            grid[x][y] = rgbToHex(r, g, b);
          }
        }
      }
      return grid;
    };

    var getColorsMapFromImageData = function (imageData, width, height) {
      var grid = imageDataToGrid(imageData, width, height, 'transparent');

      var colorsMap = {};
      for (var i = 0 ; i < grid.length ; i++) {
        postStep_();
        for (var j = 0 ; j < grid[i].length ; j++) {
          var color = grid[i][j];
          if (color != 'transparent') {
            colorsMap[color] = true;
          }
        }
      }
      return colorsMap;
    };

    this.onmessage = function(event) {
      try {
        var data = event.data;

        initStepCounter_(data.width * 2);

        var colorsMap = getColorsMapFromImageData(data.imageData, data.width, data.height);

        this.postMessage({
          type : 'SUCCESS',
          colorsMap : colorsMap
        });
      } catch (e) {
        this.postMessage({
          type : 'ERROR',
          message : e.message
        });
      }
    };
  };
})();
