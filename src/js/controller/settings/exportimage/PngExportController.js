(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var dimensionInfoPattern = '{{width}} x {{height}} px, {{frames}}<br/>{{rows}}, {{columns}}.';

  // Shortcut to pskl.utils.Template.replace
  var replace = pskl.utils.Template.replace;

  // Helper to return "X items" or "1 item" if X is 1.
  var pluralize = function (word, count) {
    if (count === 1) {
      return '1 ' + word;
    }
    return count + ' ' + word + 's';
  };

  // Compute the nearest power of two for the provided number.
  var getNearestPowerOfTwo = function (number) {
    return Math.pow(2, Math.ceil(Math.log(number) / Math.log(2)));
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
    this.columnsInput = document.querySelector('#png-export-columns');
    this.powerTwo = document.querySelector('#png-export-power-two');
    var downloadButton = document.querySelector('.png-download-button');

    this.initLayoutSection_();
    this.updateDimensionLabel_();

    this.addEventListener(downloadButton, 'click', this.onDownloadClick_);
    this.addEventListener(this.columnsInput, 'input', this.onColumnsChanged_);
    this.addEventListener(this.powerTwo, 'change', this.onPowerTwoChanged_);
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
      this.columnsInput.value = this.getBestFit_();
      this.powerTwo.checked = pskl.UserSettings.get('EXPORT_PNG_POWER_TWO');
    }
  };

  ns.PngExportController.prototype.updateDimensionLabel_ = function () {
    var zoom = this.exportController.getExportZoom();
    var frames = this.piskelController.getFrameCount();
    var width = this.piskelController.getWidth() * zoom;
    var height = this.piskelController.getHeight() * zoom;

    var columns = this.getColumns_();
    var rows = Math.ceil(frames / columns);
    width = columns * width;
    height = rows * height;

    if (this.isPowerTwoEnabled_()) {
      width = getNearestPowerOfTwo(width);
      height = getNearestPowerOfTwo(height);
    }

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

  ns.PngExportController.prototype.getBestFit_ = function () {
    var ratio = this.piskelController.getWidth() / this.piskelController.getHeight();
    var frameCount = this.piskelController.getFrameCount();
    var bestFit = Math.round(Math.sqrt(frameCount / ratio));

    return Math.max(1, Math.min(bestFit, frameCount));
  };

  ns.PngExportController.prototype.isPowerTwoEnabled_ = function () {
    return pskl.UserSettings.get('EXPORT_PNG_POWER_TWO');
  };

  ns.PngExportController.prototype.onScaleChanged_ = function () {
    this.updateDimensionLabel_();
  };

  ns.PngExportController.prototype.onColumnsChanged_ = function () {
    if (this.getColumns_() > this.piskelController.getFrameCount()) {
      this.columnsInput.value = this.piskelController.getFrameCount();
    } else if (this.getColumns_() < 1) {
      this.columnsInput.value = 1;
    }
    this.updateDimensionLabel_();
  };

  ns.PngExportController.prototype.onPowerTwoChanged_ = function () {
    pskl.UserSettings.set('EXPORT_PNG_POWER_TWO', this.powerTwo.checked);
    this.updateDimensionLabel_();
  };

  ns.PngExportController.prototype.onDownloadClick_ = function (evt) {
    var name = this.piskelController.getPiskel().getDescriptor().name;
    var fileName = name + '.png';

    var renderer = new pskl.rendering.PiskelRenderer(this.piskelController);
    var outputCanvas = renderer.renderAsCanvas(this.getColumns_());
    var width = outputCanvas.width;
    var height = outputCanvas.height;

    var zoom = this.exportController.getExportZoom();
    if (zoom != 1) {
      outputCanvas = pskl.utils.ImageResizer.resize(outputCanvas, width * zoom, height * zoom, false);
    }

    if (this.isPowerTwoEnabled_()) {
      var paddingCanvas = pskl.utils.CanvasUtils.createCanvas(
        getNearestPowerOfTwo(width * zoom), getNearestPowerOfTwo(height * zoom));
      paddingCanvas.getContext('2d').drawImage(outputCanvas, 0, 0);
      outputCanvas = paddingCanvas;
    }

    pskl.utils.BlobUtils.canvasToBlob(outputCanvas, function(blob) {
      pskl.utils.FileUtils.downloadAsFile(blob, fileName);
    });
  };
})();
