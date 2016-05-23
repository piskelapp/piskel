(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.ResizeController = function (piskelController) {
    this.piskelController = piskelController;

    this.container = document.querySelector('.resize-canvas');

    var anchorWidgetContainer = this.container.querySelector('.resize-origin-container');
    this.anchorWidget = new ns.AnchorWidget(anchorWidgetContainer);
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
    var origin = ns.AnchorWidget.ORIGIN[settings.origin] || ns.AnchorWidget.ORIGIN.TOPLEFT;
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

    var resizedLayers = this.piskelController.getLayers().map(this.resizeLayer_.bind(this));

    var currentPiskel = this.piskelController.getPiskel();
    var piskel = pskl.model.Piskel.fromLayers(resizedLayers, currentPiskel.getDescriptor());
    // propagate savepath to new Piskel
    piskel.savePath = currentPiskel.savePath;

    pskl.app.piskelController.setPiskel(piskel, true);

    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.ResizeController.prototype.resizeLayer_ = function (layer) {
    var opacity = layer.getOpacity();
    var resizedFrames = layer.getFrames().map(this.resizeFrame_.bind(this));
    var resizedLayer = pskl.model.Layer.fromFrames(layer.getName(), resizedFrames);
    resizedLayer.setOpacity(opacity);
    return resizedLayer;
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

  /***********************/
  /* RESIZE LOGIC */
  /***********************/

  ns.ResizeController.prototype.resizeFrame_ = function (frame) {
    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);
    if (this.resizeContentCheckbox.checked) {
      return pskl.utils.FrameUtils.resize(frame, width, height, false);
    } else {
      var resizedFrame = new pskl.model.Frame(width, height);
      frame.forEachPixel(function (color, x, y) {
        var translated = this.translateCoordinates_(x, y, frame, resizedFrame);
        if (resizedFrame.containsPixel(translated.x, translated.y)) {
          resizedFrame.setPixel(translated.x, translated.y, color);
        }
      }.bind(this));

      return resizedFrame;
    }
  };

  ns.ResizeController.prototype.translateCoordinates_ = function (x, y, frame, resizedFrame) {
    return {
      x : this.translateX_(x, frame.width, resizedFrame.width),
      y : this.translateY_(y, frame.height, resizedFrame.height)
    };
  };

  ns.ResizeController.prototype.translateX_ = function (x, width, resizedWidth) {
    var origin = this.anchorWidget.getOrigin();
    if (origin.indexOf('LEFT') != -1) {
      return x;
    } else if (origin.indexOf('RIGHT') != -1) {
      return x - (width - resizedWidth);
    } else {
      return x - Math.round((width - resizedWidth) / 2);
    }
  };

  ns.ResizeController.prototype.translateY_ = function (y, height, resizedHeight) {
    var origin = this.anchorWidget.getOrigin();
    if (origin.indexOf('TOP') != -1) {
      return y;
    } else if (origin.indexOf('BOTTOM') != -1) {
      return y - (height - resizedHeight);
    } else {
      return y - Math.round((height - resizedHeight) / 2);
    }
  };
})();
