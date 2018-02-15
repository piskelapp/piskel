(function () {
  var ns = $.namespace('pskl.widgets');

  ns.SpacingPicker = function (onChange) {
    this.onChange = onChange;
  };

  ns.SpacingPicker.prototype.init = function (container) {
    this.container = container;
    pskl.utils.Event.addEventListener(this.container, 'click', this.onSpacingOptionClick_, this);
  };

  ns.SpacingPicker.prototype.destroy = function () {
    pskl.utils.Event.removeAllEventListeners(this);
  };

  ns.SpacingPicker.prototype.getSpacing = function () {
    var selectedOption = this.container.querySelector('.selected');
    return selectedOption ? selectedOption.dataset.spacing : null;
  };

  ns.SpacingPicker.prototype.setSpacing = function (spacing) {
    if (this.getSpacing() === spacing) {
      return;
    }

    pskl.utils.Dom.removeClass('labeled', this.container);
    pskl.utils.Dom.removeClass('selected', this.container);
    var selectedOption;
    if (spacing <= 64) {
      selectedOption = this.container.querySelector('[data-spacing="' + spacing + '"]');
    } else {
      selectedOption = this.container.querySelector('[data-spacing="4"]');
      selectedOption.classList.add('labeled');
      selectedOption.setAttribute('real-spacing', spacing);
    }
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  };

  ns.SpacingPicker.prototype.onSpacingOptionClick_ = function (e) {
    var spacing = e.target.dataset.spacing;
    console.log('clicked');
    if (!isNaN(spacing)) {
      spacing = parseInt(spacing, 10);
      this.onChange(spacing);
      this.setSpacing(spacing);
    }
  };
})();
