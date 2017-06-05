(function () {
  var ns = $.namespace('pskl.widgets');

  ns.SizePicker = function (onChange) {
    this.onChange = onChange;
  };

  ns.SizePicker.prototype.init = function (container) {
    this.container = container;
    pskl.utils.Event.addEventListener(this.container, 'click', this.onSizeOptionClick_, this);
  };

  ns.SizePicker.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.SizePicker.prototype.getSize = function () {
    var selectedOption = this.container.querySelector('.selected');
    return selectedOption ? selectedOption.dataset.size : null;
  };

  ns.SizePicker.prototype.setSize = function (size) {
    if (this.getSize() === size) {
      return;
    }

    pskl.utils.Dom.removeClass('labeled', this.container);
    pskl.utils.Dom.removeClass('selected', this.container);
    var selectedOption;
    if (size <= 4) {
      selectedOption = this.container.querySelector('[data-size="' + size + '"]');
    } else {
      selectedOption = this.container.querySelector('[data-size="4"]');
      selectedOption.classList.add('labeled');
      selectedOption.setAttribute('real-size', size);
    }
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  };

  ns.SizePicker.prototype.onSizeOptionClick_ = function (e) {
    var size = e.target.dataset.size;
    if (!isNaN(size)) {
      size = parseInt(size, 10);
      this.onChange(size);
      this.setSize(size);
    }
  };
})();
