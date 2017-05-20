(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.ResizeController = function (piskelController) {
    this.piskelController = piskelController;

    this.container = document.querySelector('.resize-canvas');

    var anchorWidgetContainer = this.container.querySelector('.resize-anchor-container');
    this.anchorWidget = new pskl.widgets.AnchorWidget(anchorWidgetContainer);
    this.defaultSizeController = new ns.DefaultSizeController(piskelController);
  };

  pskl.utils.inherit(ns.ResizeController, pskl.controller.settings.AbstractSettingController);

  ns.ResizeController.prototype.init = function () {
    this.widthInput = this.container.querySelector('[name="resize-width"]');
    this.heightInput = this.container.querySelector('[name="resize-height"]');
    this.resizeForm = this.container.querySelector('form');
    this.resizeContentCheckbox = this.container.querySelector('.resize-content-checkbox');
    this.maintainRatioCheckbox = this.container.querySelector('.resize-ratio-checkbox');

    this.sizeInputWidget = new pskl.widgets.SizeInput({
      widthInput: this.widthInput,
      heightInput: this.heightInput,
      initWidth: this.piskelController.getWidth(),
      initHeight: this.piskelController.getHeight(),
    });

    var settings = pskl.UserSettings.get('RESIZE_SETTINGS');
    var origin = pskl.widgets.AnchorWidget.ORIGIN[settings.origin] || 'TOPLEFT';
    this.anchorWidget.setOrigin(origin);

    if (settings.resizeContent) {
      this.resizeContentCheckbox.checked = true;
      this.anchorWidget.disable();
    }

    if (settings.maintainRatio) {
      this.maintainRatioCheckbox.checked = true;
    } else {
      // the SizeInput widget is enabled by default
      this.sizeInputWidget.disableSync();
    }

    this.addEventListener(this.resizeForm, 'submit', this.onResizeFormSubmit_);
    this.addEventListener(this.resizeContentCheckbox, 'change', this.onResizeContentChange_);
    this.addEventListener(this.maintainRatioCheckbox, 'change', this.onMaintainRatioChange_);

    this.defaultSizeController.init();
  };

  ns.ResizeController.prototype.destroy = function () {
    this.updateUserPreferences_();

    this.anchorWidget.destroy();
    this.sizeInputWidget.destroy();
    this.superclass.destroy.call(this);
  };

  ns.ResizeController.prototype.onResizeFormSubmit_ = function (evt) {
    evt.preventDefault();

    var currentPiskel = this.piskelController.getPiskel();
    var piskel = pskl.utils.ResizeUtils.resizePiskel(currentPiskel, {
      width :  parseInt(this.widthInput.value, 10),
      height :  parseInt(this.heightInput.value, 10),
      origin: this.anchorWidget.getOrigin(),
      resizeContent: this.resizeContentCheckbox.checked
    });

    pskl.app.piskelController.setPiskel(piskel, {
      preserveState: true
    });

    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.ResizeController.prototype.onResizeContentChange_ = function (evt) {
    var target = evt.target;
    if (target.checked) {
      this.anchorWidget.disable();
    } else {
      this.anchorWidget.enable();
    }
  };

  ns.ResizeController.prototype.onMaintainRatioChange_ = function (evt) {
    var target = evt.target;
    if (target.checked) {
      this.sizeInputWidget.enableSync();
    } else {
      this.sizeInputWidget.disableSync();
    }
  };

  ns.ResizeController.prototype.updateUserPreferences_ = function () {
    pskl.UserSettings.set('RESIZE_SETTINGS', {
      origin : this.anchorWidget.getOrigin(),
      resizeContent : !!this.resizeContentCheckbox.checked,
      maintainRatio : !!this.maintainRatioCheckbox.checked
    });
  };
})();
