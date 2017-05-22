(function () {
  var ns = $.namespace('pskl.controller');

  ns.PenSizeController = function () {};

  ns.PenSizeController.prototype.init = function () {
    this.container = document.querySelector('.pen-size-container');
    pskl.utils.Event.addEventListener(this.container, 'click', this.onPenSizeOptionClick_, this);

    $.subscribe(Events.PEN_SIZE_CHANGED, this.onPenSizeChanged_.bind(this));

    this.updateSelectedOption_();
  };

  ns.PenSizeController.prototype.onPenSizeOptionClick_ = function (e) {
    var size = e.target.dataset.size;
    if (!isNaN(size)) {
      size = parseInt(size, 10);
      pskl.app.penSizeService.setPenSize(size);
    }
  };

  ns.PenSizeController.prototype.onPenSizeChanged_ = function (e) {
    this.updateSelectedOption_();
  };

  ns.PenSizeController.prototype.updateSelectedOption_ = function () {
    pskl.utils.Dom.removeClass('labeled', this.container);
    pskl.utils.Dom.removeClass('selected', this.container);
    var size = pskl.app.penSizeService.getPenSize();
    var selectedOption;
    if (size <= 4) {
      selectedOption = this.container.querySelector('[data-size="' + size + '"]');
    } else {
      selectedOption = this.container.querySelector('[data-size="4"]');
      selectedOption.classList.add('labeled');
      selectedOption.setAttribute('real-pen-size', size);
    }
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  };
})();
