(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var dimensionInfoPattern = '{{width}} x {{height}} px, {{frames}}<br/>{{columns}}, {{rows}}.';

  var replace = pskl.utils.Template.replace;

  // Helper to return "X items" or "1 item" if X is 1.
  var pluralize = function (word, count) {
    if (count === 1) {
      return '1 ' + word;
    }
    return count + ' ' + word + 's';
  };

  ns.PngExportController = function (piskelController, exportController) {
    this.piskelController = piskelController;
    this.exportController = exportController;
    this.onScaleChanged_ = this.onScaleChanged_.bind(this);
  };

  pskl.utils.inherit(ns.PngExportController, pskl.controller.settings.AbstractSettingController);

  ns.PngExportController.prototype.init = function () {
    this.layoutContainer = document.querySelector('.png-export-layout-section');
    this.dimensionInfo = document.querySelector('.png-export-dimension-info');

    this.rowsInput = document.querySelector('#png-export-rows');
    this.columnsInput = document.querySelector('#png-export-columns');

    var downloadButton = document.querySelector('.png-download-button');
    var downloadPixiButton = document.querySelector('.png-pixi-download-button');
    var dataUriButton = document.querySelector('.datauri-open-button');

    this.initLayoutSection_();
    this.updateDimensionLabel_();

    this.addEventListener(this.columnsInput, 'input', this.onColumnsInput_);
    this.addEventListener(downloadButton, 'click', this.onDownloadClick_);
    this.addEventListener(downloadPixiButton, 'click', this.onPixiDownloadClick_);
    this.addEventListener(dataUriButton, 'click', this.onDataUriClick_);
    $.subscribe(Events.EXPORT_SCALE_CHANGED, this.onScaleChanged_);
  };

  ns.PngExportController.prototype.destroy = function () {
    $.unsubscribe(Events.EXPORT_SCALE_CHANGED, this.onScaleChanged_);
    this.superclass.destroy.call(this);
  };

  /**
   * Initalize all controls related to the spritesheet layout.
   */
  ns.PngExportController.prototype.initLayoutSection_ = function () {
    var frames = this.piskelController.getFrameCount();
    if (frames === 1) {
      // Hide the layout section if only one frame is defined.
      this.layoutContainer.style.display = 'none';
    } else {
      this.columnsInput.setAttribute('max', frames);
      this.columnsInput.value = this.getBestFit_();
      this.onColumnsInput_();
    }
  };

  ns.PngExportController.prototype.updateDimensionLabel_ = function () {
    var zoom = this.exportController.getExportZoom();
    var frames = this.piskelController.getFrameCount();
    var width = this.piskelController.getWidth() * zoom;
    var height = this.piskelController.getHeight() * zoom;

    var columns = this.getColumns_();
    var rows = this.getRows_();
    width = columns * width;
    height = rows * height;

    this.dimensionInfo.innerHTML = replace(dimensionInfoPattern, {
      width: width,
      height: height,
      rows: pluralize('row', rows),
      columns: pluralize('column', columns),
      frames: pluralize('frame', frames),
    });
  };

  ns.PngExportController.prototype.getColumns_ = function () {
    return parseInt(this.columnsInput.value || 1, 10);
  };

  ns.PngExportController.prototype.getRows_ = function () {
    return parseInt(this.rowsInput.value || 1, 10);
  };

  ns.PngExportController.prototype.getBestFit_ = function () {
    var ratio = this.piskelController.getWidth() / this.piskelController.getHeight();
    var frameCount = this.piskelController.getFrameCount();
    var bestFit = Math.round(Math.sqrt(frameCount / ratio));

    return pskl.utils.Math.minmax(bestFit, 1, frameCount);
  };

  ns.PngExportController.prototype.onScaleChanged_ = function () {
    this.updateDimensionLabel_();
  };

  /**
   * Synchronise column and row inputs, called everytime a user input updates one of the
   * two inputs by the SynchronizedInputs widget.
   */
  ns.PngExportController.prototype.onColumnsInput_ = function () {
    var value = this.columnsInput.value;
    if (value === '') {
      // Skip the synchronization if the input is empty.
      return;
    }

    value = parseInt(value, 10);
    if (isNaN(value)) {
      value = 1;
    }

    // Force the value to be in bounds, if the user tried to update it by directly typing
    // a value.
    value = pskl.utils.Math.minmax(value, 1, this.piskelController.getFrameCount());
    this.columnsInput.value = value;

    // Update readonly rowsInput
    this.rowsInput.value = Math.ceil(this.piskelController.getFrameCount() / value);
    this.updateDimensionLabel_();
  };

  ns.PngExportController.prototype.createPngSpritesheet_ = function () {
    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    var outputCanvas = renderer.renderAsCanvas(this.getColumns_(), this.getRows_());
    var width = outputCanvas.width;
    var height = outputCanvas.height;

    var zoom = this.exportController.getExportZoom();
    if (zoom != 1) {
      outputCanvas = pskl.utils.ImageResizer.resize(outputCanvas, width * zoom, height * zoom, false);
    }

    return outputCanvas;
  };

  ns.PngExportController.prototype.onDownloadClick_ = function (evt) {
    // Create PNG export.
    var canvas = this.createPngSpritesheet_();
    this.downloadCanvas_(canvas);
  };

  // Used and overridden in casper integration tests.
  ns.PngExportController.prototype.downloadCanvas_ = function (canvas) {
    // Generate file name
    var name = this.piskelController.getPiskel().getDescriptor().name;
    var fileName = name + '.png';

    // Transform to blob and start download.
    pskl.utils.BlobUtils.canvasToBlob(canvas, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };

  ns.PngExportController.prototype.onPixiDownloadClick_ = function () {
    var zip = new window.JSZip();

    // Create PNG export.
    var canvas = this.createPngSpritesheet_();
    var name = this.piskelController.getPiskel().getDescriptor().name;

    zip.file(name + '.png', pskl.utils.CanvasUtils.getBase64FromCanvas(canvas) + '\n', {base64: true});

    var width = canvas.width / this.getColumns_();
    var height = canvas.height / this.getRows_();

    var numFrames = this.piskelController.getFrameCount();
    var frames = {};
    for (var i = 0; i < numFrames; i++) {
      var column = i % this.getColumns_();
      var row = (i - column) / this.getColumns_();
      var frame = {
        'frame': {'x': width * column,'y': height * row,'w': width,'h': height},
        'rotated': false,
        'trimmed': false,
        'spriteSourceSize': {'x': 0,'y': 0,'w': width,'h': height},
        'sourceSize': {'w': width,'h': height}
      };
      frames[name + i + '.png'] = frame;
    }

    var json = {
      'frames': frames,
      'meta': {
        'app': 'https://github.com/piskelapp/piskel/',
        'version': '1.0',
        'image': name + '.png',
        'format': 'RGBA8888',
        'size': {'w': canvas.width,'h': canvas.height}
      }
    };
    zip.file(name + '.json', JSON.stringify(json));

    var blob = zip.generate({
      type : 'blob'
    });

    pskl.utils.FileUtils.downloadAsFile(blob, name + '.zip');
  };

  ns.PngExportController.prototype.onDataUriClick_ = function (evt) {
    var popup = window.open('about:blank');
    var dataUri = this.createPngSpritesheet_().toDataURL('image/png');
    window.setTimeout(function () {
      var html = pskl.utils.Template.getAndReplace('data-uri-export-partial', {
        src: dataUri
      });
      popup.document.title = dataUri;
      popup.document.body.innerHTML = html;
    }.bind(this), 500);
  };
})();
