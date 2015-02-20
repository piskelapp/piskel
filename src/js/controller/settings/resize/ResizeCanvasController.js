(function () {
  var ns = $.namespace('pskl.controller.settings.resize');

  ns.ResizeCanvasController = function (piskelController, container) {
    this.superclass.constructor.call(this, piskelController, container);

    var anchorWidgetContainer = document.querySelector('.resize-origin-container');
    this.anchorWidget = new ns.AnchorWidget(anchorWidgetContainer);
  };

  pskl.utils.inherit(ns.ResizeCanvasController, ns.AbstractResizeController);

  ns.ResizeCanvasController.prototype.init = function () {
    this.superclass.init.call(this);
    this.anchorWidget.setOrigin(ns.AnchorWidget.ORIGIN.TOPLEFT);
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
    var origin = this.anchorWidget.getOrigin();
    if (origin.indexOf('LEFT') != -1) {
      return x;
    } else if (origin.indexOf('RIGHT') != -1) {
      return x - (width - resizedWidth);
    } else {
      return x - Math.round((width - resizedWidth)/2);
    }
  };

  ns.ResizeCanvasController.prototype.translateY_ = function (y, height, resizedHeight) {
    var origin = this.anchorWidget.getOrigin();
    if (origin.indexOf('TOP') != -1) {
      return y;
    } else if (origin.indexOf('BOTTOM') != -1) {
      return y - (height - resizedHeight);
    } else {
      return y - Math.round((height - resizedHeight)/2);
    }
  };

  /*****************/
  /* ANCHOR WIDGET */
  /*****************/
})();