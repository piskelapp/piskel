(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  var ORIGIN = {
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

  ns.ResizeCanvasController = function (piskelController, container) {
    this.superclass.constructor.call(this, piskelController, container);
    this.origin = ORIGIN.TOPLEFT;
  };

  pskl.utils.inherit(ns.ResizeCanvasController, ns.AbstractResizeController);

  ns.ResizeCanvasController.prototype.init = function () {
    this.superclass.init.call(this);

    this.resizeOrigin = document.querySelector('.resize-origin-container');
    this.resizeOrigin.addEventListener('click', this.onResizeOriginClick_.bind(this));

    this.setOrigin_(ORIGIN.TOPLEFT);
  };

  /****************/
  /* RESIZE LOGIC */
  /****************/

  ns.ResizeCanvasController.prototype.resizeFrame_ = function (frame) {
    var width = parseInt(this.widthInput.value, 10);
    var height = parseInt(this.heightInput.value, 10);

    var resizedFrame = new pskl.model.Frame(width, height);
    frame.forEachPixel(function (color, x, y) {
      var translated = this.translateCoordinates_(x, y, frame, resizedFrame);
      if (resizedFrame.containsPixel(translated.x, translated.y)) {
        resizedFrame.setPixel(translated.x, translated.y, color);
      }
    }.bind(this));

    return resizedFrame;
  };

  ns.ResizeCanvasController.prototype.translateCoordinates_ = function (x, y, frame, resizedFrame) {
    return {
      x : this.translateX_(x, frame.width, resizedFrame.width),
      y : this.translateY_(y, frame.height, resizedFrame.height)
    };
  };

  ns.ResizeCanvasController.prototype.translateX_ = function (x, width, resizedWidth) {
    if (this.origin.indexOf('LEFT') != -1) {
      return x;
    } else if (this.origin.indexOf('RIGHT') != -1) {
      return x - (width - resizedWidth);
    } else {
      return x - Math.round((width - resizedWidth)/2);
    }
  };

  ns.ResizeCanvasController.prototype.translateY_ = function (y, height, resizedHeight) {
    if (this.origin.indexOf('TOP') != -1) {
      return y;
    } else if (this.origin.indexOf('BOTTOM') != -1) {
      return y - (height - resizedHeight);
    } else {
      return y - Math.round((height - resizedHeight)/2);
    }
  };

  /*****************/
  /* ANCHOR WIDGET */
  /*****************/

  ns.ResizeCanvasController.prototype.onResizeOriginClick_ = function (evt) {
    var origin = evt.target.dataset.origin;
    if (origin && ORIGIN[origin]) {
      this.setOrigin_(origin);
    }
  };

  ns.ResizeCanvasController.prototype.setOrigin_ = function (origin) {
    this.origin = origin;
    var previous = document.querySelector('.resize-origin-option.selected');
    if (previous) {
      previous.classList.remove('selected');
    }

    var selected = document.querySelector('.resize-origin-option[data-origin="' + origin + '"]');
    if (selected) {
      selected.classList.add('selected');
      this.refreshNeighbors_(selected);
    }
  };

  ns.ResizeCanvasController.prototype.refreshNeighbors_ = function (selected) {
    var options = document.querySelectorAll('.resize-origin-option');
    for (var i = 0 ; i < options.length ; i++) {
      options[i].removeAttribute('data-neighbor');
    }

    var selectedIndex = Array.prototype.indexOf.call(options, selected);

    this.setNeighborhood_(options[selectedIndex - 1], 'left');
    this.setNeighborhood_(options[selectedIndex + 1], 'right');
    this.setNeighborhood_(options[selectedIndex - 3], 'top');
    this.setNeighborhood_(options[selectedIndex + 3], 'bottom');
  };

  ns.ResizeCanvasController.prototype.setNeighborhood_ = function (el, neighborhood) {
    var origin = this.origin.toLowerCase();
    var isNeighborhoodValid = origin.indexOf(neighborhood) === -1;
    if (isNeighborhoodValid) {
      el.setAttribute('data-neighbor', neighborhood);
    }
  };
})();