(function () {
  var ns = $.namespace('pskl.widgets');

  /**
   * Synchronize two "number" inputs to stick to their initial ratio.
   * The synchronization can be disabled/enabled on the fly.
   *
   * @param {Object} options
   *        - {Element} widthInput
   *        - {Element} heightInput
   *        - {Number} initWidth
   *        - {Number} initHeight
   *        - {Function} onChange
   */
  ns.SizeInput = function (options) {
    this.widthInput = options.widthInput;
    this.heightInput = options.heightInput;
    this.initWidth = options.initWidth;
    this.initHeight = options.initHeight;
    this.onChange = options.onChange;

    this.syncEnabled = true;
    this.lastInput = this.widthInput;

    this.widthInput.value = this.initWidth;
    this.heightInput.value = this.initHeight;

    pskl.utils.Event.addEventListener(this.widthInput, 'keyup', this.onSizeInputKeyUp_, this);
    pskl.utils.Event.addEventListener(this.heightInput, 'keyup', this.onSizeInputKeyUp_, this);
  };

  ns.SizeInput.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);

    this.widthInput = null;
    this.heightInput = null;
    this.lastInput = null;
  };

  ns.SizeInput.prototype.enableSync = function () {
    this.syncEnabled = true;
    this.synchronize_(this.lastInput);
  };

  ns.SizeInput.prototype.disableSync = function () {
    this.syncEnabled = false;
  };

  ns.SizeInput.prototype.setWidth = function (width) {
    this.widthInput.value = width;
    this.synchronize_(this.widthInput);
  };

  ns.SizeInput.prototype.setHeight = function (height) {
    this.heightInput.value = height;
    this.synchronize_(this.heightInput);
  };

  ns.SizeInput.prototype.onSizeInputKeyUp_ = function (evt) {
    var target = evt.target;
    if (this.syncEnabled) {
      this.synchronize_(target);
    }
    this.lastInput = target;
  };

  /**
   * Based on the value of the provided sizeInput (considered as emitter)
   * update the value of the other sizeInput to match the current width/height ratio
   * @param  {HTMLElement} origin either widthInput or heightInput
   */
  ns.SizeInput.prototype.synchronize_ = function (sizeInput) {
    var value = parseInt(sizeInput.value, 10);
    if (isNaN(value)) {
      value = 0;
    }

    if (sizeInput === this.widthInput) {
      this.heightInput.value = Math.round(value * this.initHeight / this.initWidth);
    } else if (sizeInput === this.heightInput) {
      this.widthInput.value = Math.round(value * this.initWidth / this.initHeight);
    }

    if (this.onChange) {
      this.onChange();
    }
  };
})();
