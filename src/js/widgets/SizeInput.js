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

    this.synchronizedInputs = new ns.SynchronizedInputs({
      leftInput: this.widthInput,
      rightInput: this.heightInput,
      synchronize: this.synchronize_.bind(this)
    });

    this.disableSync = this.synchronizedInputs.disableSync.bind(this.synchronizedInputs);
    this.enableSync = this.synchronizedInputs.enableSync.bind(this.synchronizedInputs);

    this.widthInput.value = this.initWidth;
    this.heightInput.value = this.initHeight;
  };

  ns.SizeInput.prototype.destroy = function () {
    this.synchronizedInputs.destroy();

    this.widthInput = null;
    this.heightInput = null;
  };

  ns.SizeInput.prototype.setWidth = function (width) {
    this.widthInput.value = width;
    this.synchronize_(this.widthInput);
  };

  ns.SizeInput.prototype.setHeight = function (height) {
    this.heightInput.value = height;
    this.synchronize_(this.heightInput);
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
