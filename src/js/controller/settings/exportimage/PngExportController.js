(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var dimensionInfoPattern = '{{width}} x {{height}} px, {{frames}}<br/>{{columns}}, {{rows}}.';

  // Shortcut to pskl.utils.Template.replace
  var replace = pskl.utils.Template.replace;

  // Helper to return "X items" or "1 item" if X is 1. Can be cnsidered as an overkill,
  // but the one-liner equivalent is hard to read.
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
    var dataUriButton = document.querySelector('.datauri-open-button');

    this.initLayoutSection_();
    this.updateDimensionLabel_();

    this.addEventListener(this.columnsInput, 'input', this.onColumnsInput_);
    this.addEventListener(downloadButton, 'click', this.onDownloadClick_);
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

    // Force the value to be in bounds, in the user tried to update it by directly typing
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

    // Generate file name
    var name = this.piskelController.getPiskel().getDescriptor().name;
    var fileName = name + '.png';

    // Transform to blob and start download.
    pskl.utils.BlobUtils.canvasToBlob(canvas, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };

  ns.PngExportController.prototype.onDataUriClick_ = function (evt) {
    window.open(this.createPngSpritesheet_().toDataURL('image/png'));
  };
})();
