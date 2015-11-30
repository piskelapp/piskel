(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  var OPTION_CLASSNAME = 'resize-origin-option';

  ns.AnchorWidget = function (container) {
    this.container = container;
    this.disabled = false;
    pskl.utils.Event.addEventListener(this.container, 'click', this.onResizeOriginClick_, this);
  };

  ns.AnchorWidget.ORIGIN = {
    TOPLEFT : 'TOPLEFT',
    TOP : 'TOP',
    TOPRIGHT : 'TOPRIGHT',
    MIDDLELEFT : 'MIDDLELEFT',
    MIDDLE : 'MIDDLE',
    MIDDLERIGHT : 'MIDDLERIGHT',
    BOTTOMLEFT : 'BOTTOMLEFT',
    BOTTOM : 'BOTTOM',
    BOTTOMRIGHT : 'BOTTOMRIGHT'
  };

  ns.AnchorWidget.prototype.destroy = function (evt) {
    pskl.utils.Event.removeAllEventListeners(this);
    this.container = null;
  };

  ns.AnchorWidget.prototype.onResizeOriginClick_ = function (evt) {
    var origin = evt.target.dataset.origin;
    if (origin && ns.AnchorWidget.ORIGIN[origin] && !this.disabled) {
      this.setOrigin(origin);
    }
  };

  ns.AnchorWidget.prototype.setOrigin = function (origin) {
    this.origin = origin;
    var previous = document.querySelector('.' + OPTION_CLASSNAME + '.selected');
    if (previous) {
      previous.classList.remove('selected');
    }

    var selected = document.querySelector('.' + OPTION_CLASSNAME + '[data-origin="' + origin + '"]');
    if (selected) {
      selected.classList.add('selected');
      this.refreshNeighbors_(selected);
    }
  };

  ns.AnchorWidget.prototype.getOrigin = function () {
    return this.origin;
  };

  ns.AnchorWidget.prototype.disable = function () {
    this.disabled = true;
    this.container.classList.add('transition');
    this.container.classList.add('disabled');
  };

  ns.AnchorWidget.prototype.enable = function () {
    this.disabled = false;
    this.container.classList.remove('disabled');
    window.setTimeout(this.container.classList.remove.bind(this.container.classList, 'transition'), 250);
  };

  ns.AnchorWidget.prototype.refreshNeighbors_ = function (selected) {
    var options = document.querySelectorAll('.' + OPTION_CLASSNAME);
    for (var i = 0 ; i < options.length ; i++) {
      options[i].removeAttribute('data-neighbor');
    }

    var selectedIndex = Array.prototype.indexOf.call(options, selected);

    this.setNeighborhood_(options[selectedIndex - 1], 'left');
    this.setNeighborhood_(options[selectedIndex + 1], 'right');
    this.setNeighborhood_(options[selectedIndex - 3], 'top');
    this.setNeighborhood_(options[selectedIndex + 3], 'bottom');
  };

  ns.AnchorWidget.prototype.setNeighborhood_ = function (el, neighborhood) {
    var origin = this.origin.toLowerCase();
    var isNeighborhoodValid = origin.indexOf(neighborhood) === -1;
    if (isNeighborhoodValid) {
      el.setAttribute('data-neighbor', neighborhood);
    }
  };
})();
