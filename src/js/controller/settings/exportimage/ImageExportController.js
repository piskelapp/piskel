(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  ns.ImageExportController = function (piskelController) {
    this.piskelController = piskelController;
    this.pngExportController = new ns.PngExportController(piskelController);
    this.gifExportController = new ns.GifExportController(piskelController);
  };

  pskl.utils.inherit(ns.ImageExportController, pskl.controller.settings.AbstractSettingController);

  ns.ImageExportController.prototype.init = function () {
    // Output Scaling Factor
    var scalingFactorInput = document.querySelector('.scaling-factor-input');
    scalingFactorInput.value = pskl.UserSettings.get(pskl.UserSettings.EXPORT_SCALING);
    this.addEventListener(scalingFactorInput, 'change', this.onScalingFactorChange_);
    this.addEventListener(scalingFactorInput, 'input', this.onScalingFactorChange_);
    this.updateScalingFactorText_(scalingFactorInput.value);

    this.pngExportController.init();
    this.gifExportController.init();
  };

  ns.ImageExportController.prototype.destroy = function () {
    this.pngExportController.destroy();
    this.gifExportController.destroy();
    this.superclass.destroy.call(this);
  };

  ns.ImageExportController.prototype.onScalingFactorChange_ = function (evt) {
    var target = evt.target;
    var value = Math.round(parseFloat(target.value));
    if (!isNaN(value)) {
      this.updateScalingFactorText_(value);
      pskl.UserSettings.set(pskl.UserSettings.EXPORT_SCALING, value);
    } else {
      target.value = pskl.UserSettings.get(pskl.UserSettings.EXPORT_SCALING);
    }
  };

  ns.ImageExportController.prototype.updateScalingFactorText_ = function (scale) {
    var scalingFactorText = document.querySelector('.scaling-factor-text');
    scalingFactorText.innerHTML = scale + 'x';
  };
})();
