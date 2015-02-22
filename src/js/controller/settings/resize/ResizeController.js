(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.ResizeController = function (piskelController) {
    this.piskelController = piskelController;

    this.container = document.querySelector('.resize-canvas');

    var anchorWidgetContainer = this.container.querySelector('.resize-origin-container');
    this.anchorWidget = new ns.AnchorWidget(anchorWidgetContainer);
  };

  ns.ResizeController.prototype.init = function () {
    this.widthInput = this.container.querySelector('[name="resize-width"]');
    this.heightInput = this.container.querySelector('[name="resize-height"]');

    this.widthInput.value = this.piskelController.getWidth();
    this.heightInput.value = this.piskelController.getHeight();

    this.widthInput.addEventListener('keyup', this.onSizeInputKeyUp_.bind(this));
    this.heightInput.addEventListener('keyup', this.onSizeInputKeyUp_.bind(this));

    this.cancelButton = this.container.querySelector('.resize-cancel-button');
    this.cancelButton.addEventListener('click', this.onCancelButtonClicked_.bind(this));

    this.resizeForm = this.container.querySelector('form');
    this.resizeForm.addEventListener('submit', this.onResizeFormSubmit_.bind(this));

    this.resizeContentCheckbox = this.container.querySelector('.resize-content-checkbox');
    this.resizeContentCheckbox.addEventListener('change', this.onResizeContentChange_.bind(this));

    this.maintainRatioCheckbox = this.container.querySelector('.resize-ratio-checkbox');
    this.maintainRatioCheckbox.addEventListener('change', this.onMaintainRatioChange_.bind(this));

    this.anchorWidget.setOrigin(ns.AnchorWidget.ORIGIN.TOPLEFT);
    this.lastInput = this.widthInput;
  };

  ns.ResizeController.prototype.onResizeFormSubmit_ = function (evt) {
    evt.preventDefault();

    var resizedLayers = this.piskelController.getLayers().map(this.resizeLayer_.bind(this));

    var piskel = pskl.model.Piskel.fromLayers(resizedLayers, this.piskelController.getPiskel().getDescriptor());

    pskl.app.piskelController.setPiskel(piskel, true);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };


  ns.ResizeController.prototype.resizeLayer_ = function (layer) {
    var resizedFrames = layer.getFrames().map(this.resizeFrame_.bind(this));
    return pskl.model.Layer.fromFrames(layer.getName(), resizedFrames);
  };

  ns.ResizeController.prototype.onCancelButtonClicked_ = function () {
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
  /* RESIZE CANVAS LOGIC */
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