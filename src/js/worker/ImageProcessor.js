(function () {
  var ns = $.namespace('pskl.worker');

  var imageProcessorWorker = function () {
    var currentStep, currentProgress, currentTotal;

    var initStepCounter_ = function (total) {
      currentStep = 0;
      currentProgress = 0;
      currentTotal = total;
    };

    var postStep_ = function () {
      currentStep = currentStep + 1;
      var progress = ((currentStep / currentTotal) *100).toFixed(1);
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
    
    var rgbToHex = function (r, g, b) {
      return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    };

    var componentToHex = function (c) {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    };

    var imageDataToGrid = function (imageData, width, height, transparent) {
      // Draw the zoomed-up pixels to a different canvas context
      var grid = [];
      for (var x = 0 ; x < width ; x++){
        grid[x] = [];
        postStep_();
        for (var y = 0 ; y < height ; y++){
          // Find the starting index in the one-dimensional image data
          var i = (y * width + x)*4;
          var r = imageData[i  ];
          var g = imageData[i+1];
          var b = imageData[i+2];
          var a = imageData[i+3];
          if (a < 125) {
            grid[x][y] = transparent;
          } else {
            grid[x][y] = rgbToHex(r,g,b);
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
      } catch(e) {
        this.postMessage({
          type : 'ERROR',
          message : e.message
        });
      }
    };
  };

  ns.ImageProcessor = function (image, onSuccess, onStep, onError) {
    this.image = image;

    this.onStep = onStep;
    this.onSuccess = onSuccess;
    this.onError = onError;

    // var worker = pskl.utils.WorkerUtils.addPartialWorker(imageProcessorWorker, 'step-counter');
    this.worker = pskl.utils.WorkerUtils.createWorker(imageProcessorWorker, 'image-colors-processor');
    this.worker.onmessage = this.onWorkerMessage.bind(this);
  };

  ns.ImageProcessor.prototype.process = function () {
    var canvas = pskl.utils.CanvasUtils.createFromImage(this.image);
    var imageData = pskl.utils.CanvasUtils.getImageDataFromCanvas(canvas);
    this.worker.postMessage({
      imageData : imageData,
      width : this.image.width,
      height : this.image.height
    });
  };

  ns.ImageProcessor.prototype.createNamespace = function (name) {
    var createNamespace = (function () {
      var parts = name.split('.');
      if (parts.length > 0) {
        var node = this;
        for (var i = 0 ; i < parts.length ; i++) {
          if (!node[parts[i]]) {
            node[parts[i]] = {};
          }
          node = node[parts[i]];
        }
      }
    });
    var script = createNamespace + "";
    script = script.replace(/function \(\) \{/,"").replace(/\}[^}]*$/, "");
    script = "var name = '" + name + "';" + script;

    this.runScript(script);
  };

  ns.ImageProcessor.prototype.onWorkerMessage = function (event) {
    if (event.data.type === 'STEP') {
      this.onStep(event);
    } else if (event.data.type === 'SUCCESS') {
      this.onSuccess(event);
      this.worker.terminate();
    } else if (event.data.type === 'ERROR') {
      this.onError(event);
      this.worker.terminate();
    }
  };

  ns.ImageProcessor.prototype.importAll__ = function (classToImport, classpath) {
    this.createNamespace(classpath);
    for (var key in classToImport) {
      if (classToImport.hasOwnProperty(key)) {
        this.addMethod(classToImport[key], classpath + '.' + key);
      }
    }
  };

  ns.ImageProcessor.prototype.addMethod__ = function (method, name) {
    this.runScript(name  + "=" + method);
  };

  ns.ImageProcessor.prototype.runScript__ = function (script) {
    this.worker.postMessage({
      type : 'RUN_SCRIPT',
      script : this.getScriptAsUrl(script)
    });
  };

  ns.ImageProcessor.prototype.getScriptAsUrl__ = function (script) {
    var blob = new Blob([script], {type: "application/javascript"}); // pass a useful mime type here
    return window.URL.createObjectURL(blob);
  };
})();



