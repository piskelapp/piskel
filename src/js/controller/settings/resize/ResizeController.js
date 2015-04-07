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

    this.widthInput.value = this.piskelController.getWidth();
    this.heightInput.value = this.piskelController.getHeight();

    this.addEventListener(this.widthInput, 'keyup', this.onSizeInputKeyUp_);
    this.addEventListener(this.heightInput, 'keyup', this.onSizeInputKeyUp_);

    this.resizeForm = this.container.querySelector('form');
    this.addEventListener(this.resizeForm, 'submit', this.onResizeFormSubmit_);

    this.resizeContentCheckbox = this.container.querySelector('.resize-content-checkbox');
    this.addEventListener(this.resizeContentCheckbox, 'change', this.onResizeContentChange_);

    this.maintainRatioCheckbox = this.container.querySelector('.resize-ratio-checkbox');
    this.addEventListener(this.maintainRatioCheckbox, 'change', this.onMaintainRatioChange_);

    this.anchorWidget.setOrigin(ns.AnchorWidget.ORIGIN.TOPLEFT);
    this.lastInput = this.widthInput;

    this.defaultSizeController.init();
  };

  ns.ResizeController.prototype.destroy = function () {
    this.anchorWidget.destroy();
    this.superclass.destroy.call(this);
  };

  ns.ResizeController.prototype.onResizeFormSubmit_ = function (evt) {
    evt.preventDefault();

    var resizedLayers = this.piskelController.getLayers().map(this.resizeLayer_.bind(this));

    var piskel = pskl.model.Piskel.fromLayers(resizedLayers, this.piskelController.getPiskel().getDescriptor());

    // propagate savepath to new Piskel
    piskel.savePath = pskl.app.piskelController.getSavePath();
    pskl.app.piskelController.setPiskel(piskel, true);
    
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };


  ns.ResizeController.prototype.resizeLayer_ = function (layer) {
    var resizedFrames = layer.getFrames().map(this.resizeFrame_.bind(this));
    return pskl.model.Layer.fromFrames(layer.getName(), resizedFrames);
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
      this.synchronizeSizeInputs_(this.lastInput);
    }
  };

  ns.ResizeController.prototype.onSizeInputKeyUp_ = function (evt) {
    var target = evt.target;
    if (this.maintainRatioCheckbox.checked) {
      this.synchronizeSizeInputs_(target);
    }
    this.lastInput = target;
  };

  /**
   * Based on the value of the provided sizeInput (considered as emitter)
   * update the value of the other sizeInput to match the current width/height ratio
   * @param  {HTMLElement} origin either widthInput or heightInput
   */
  ns.ResizeController.prototype.synchronizeSizeInputs_ = function (sizeInput) {
    var value = parseInt(sizeInput.value, 10);
    if (isNaN(value)) {
      value = 0;
    }

    var height = this.piskelController.getHeight(),
        width = this.piskelController.getWidth();

    if (sizeInput === this.widthInput) {
      this.heightInput.value = Math.round(value * height/width);
    } else if (sizeInput === this.heightInput) {
      this.widthInput.value = Math.round(value * width/height);
    }
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
      return x - Math.round((width - resizedWidth)/2);
    }
  };

  ns.ResizeController.prototype.translateY_ = function (y, height, resizedHeight) {
    var origin = this.anchorWidget.getOrigin();
    if (origin.indexOf('TOP') != -1) {
      return y;
    } else if (origin.indexOf('BOTTOM') != -1) {
      return y - (height - resizedHeight);
    } else {
      return y - Math.round((height - resizedHeight)/2);
    }
  };
})();