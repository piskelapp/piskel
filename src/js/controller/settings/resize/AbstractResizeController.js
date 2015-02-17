(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.AbstractResizeController = function (piskelController, container) {
    this.piskelController = piskelController;
    this.container = container;
  };

  ns.AbstractResizeController.prototype.init = function () {
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

    this.maintainRatioCheckbox = this.container.querySelector('.resize-ratio-checkbox');
    this.maintainRatioCheckbox.addEventListener('change', this.onMaintainRatioChange_.bind(this));

    this.lastInput = this.widthInput;
  };

  ns.AbstractResizeController.prototype.onResizeFormSubmit_ = function (evt) {
    evt.preventDefault();

    var resizedLayers = this.piskelController.getLayers().map(this.resizeLayer_.bind(this));

    var piskel = pskl.model.Piskel.fromLayers(resizedLayers, this.piskelController.getPiskel().getDescriptor());

    pskl.app.piskelController.setPiskel(piskel, true);
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };


  ns.AbstractResizeController.prototype.resizeLayer_ = function (layer) {
    var resizedFrames = layer.getFrames().map(this.resizeFrame_.bind(this));
    return pskl.model.Layer.fromFrames(layer.getName(), resizedFrames);
  };

  ns.AbstractResizeController.prototype.resizeFrame_ = Constants.ABSTRACT_FUNCTION;

  ns.AbstractResizeController.prototype.onCancelButtonClicked_ = function () {
    $.publish(Events.CLOSE_SETTINGS_DRAWER);
  };

  ns.AbstractResizeController.prototype.onMaintainRatioChange_ = function (evt) {
    var target = evt.target;
    if (target.checked) {
      this.synchronizeSizeInputs_(this.lastInput);
    }
  };

  ns.AbstractResizeController.prototype.onSizeInputKeyUp_ = function (evt) {
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
  ns.AbstractResizeController.prototype.synchronizeSizeInputs_ = function (sizeInput) {
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
})();