(function () {
  var ns = $.namespace('pskl.controller.settings.exportimage');

  var tabs = {
    'png' : {
      template : 'templates/settings/export/png.html',
      controller : ns.PngExportController
    },
    'gif' : {
      template : 'templates/settings/export/gif.html',
      controller : ns.GifExportController
    },
    'zip' : {
      template : 'templates/settings/export/zip.html',
      controller : ns.ZipExportController
    },
    'misc' : {
      template : 'templates/settings/export/misc.html',
      controller : ns.MiscExportController
    }
  };

  ns.ExportController = function (piskelController) {
    this.piskelController = piskelController;
    this.tabsWidget = new pskl.widgets.Tabs(tabs, this, pskl.UserSettings.EXPORT_TAB);
    this.onSizeInputChange_ = this.onSizeInputChange_.bind(this);
  };

  pskl.utils.inherit(ns.ExportController, pskl.controller.settings.AbstractSettingController);

  ns.ExportController.prototype.init = function () {
    // Initialize zoom controls
    this.scaleInput = document.querySelector('.export-scale .scale-input');
    this.addEventListener(this.scaleInput, 'change', this.onScaleChange_);
    this.addEventListener(this.scaleInput, 'input', this.onScaleChange_);

    this.widthInput = document.querySelector('.export-resize .resize-width');
    this.heightInput = document.querySelector('.export-resize .resize-height');
    var scale = pskl.UserSettings.get(pskl.UserSettings.EXPORT_SCALE);
    this.sizeInputWidget = new pskl.widgets.SizeInput({
      widthInput : this.widthInput,
      heightInput : this.heightInput,
      initWidth : this.piskelController.getWidth() * scale,
      initHeight : this.piskelController.getHeight() * scale,
      onChange : this.onSizeInputChange_
    });

    this.onSizeInputChange_();

    // Initialize tabs and panel
    var container = document.querySelector('.settings-section-export');
    this.tabsWidget.init(container);
  };

  ns.ExportController.prototype.destroy = function () {
    this.sizeInputWidget.destroy();
    this.tabsWidget.destroy();
    this.superclass.destroy.call(this);
  };

  ns.ExportController.prototype.onScaleChange_ = function () {
    var value = parseFloat(this.scaleInput.value);
    if (!isNaN(value)) {
      if (Math.round(this.getExportZoom()) != value) {
        this.sizeInputWidget.setWidth(this.piskelController.getWidth() * value);
      }
      pskl.UserSettings.set(pskl.UserSettings.EXPORT_SCALE, value);
    }
  };

  ns.ExportController.prototype.updateScaleText_ = function (scale) {
    scale = scale.toFixed(1);
    var scaleText = document.querySelector('.export-scale .scale-text');
    scaleText.innerHTML = scale + 'x';
  };

  ns.ExportController.prototype.onSizeInputChange_ = function () {
    var zoom = this.getExportZoom();
    if (isNaN(zoom)) {
      return;
    }

    this.updateScaleText_(zoom);
    $.publish(Events.EXPORT_SCALE_CHANGED);

    this.scaleInput.value = Math.round(zoom);
    if (zoom >= 1 && zoom <= 32) {
      this.onScaleChange_();
    }
  };

  ns.ExportController.prototype.getExportZoom = function () {
    return parseInt(this.widthInput.value, 10) / this.piskelController.getWidth();
  };
})();
