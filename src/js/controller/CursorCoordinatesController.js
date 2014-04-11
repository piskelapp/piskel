(function () {
  var ns = $.namespace('pskl.controller');

  ns.CursorCoordinatesController = function (piskelController) {
    this.piskelController = piskelController;
    this.dragOrigin = null;
  };

  ns.CursorCoordinatesController.prototype.init = function () {
    this.coordinatesContainer = document.querySelector('.cursor-coordinates');
    $.subscribe(Events.CURSOR_MOVED, this.onCursorMoved_.bind(this));
    $.subscribe(Events.DRAG_START, this.onDragStart_.bind(this));
    $.subscribe(Events.DRAG_END, this.onDragEnd_.bind(this));
  };

  ns.CursorCoordinatesController.prototype.onCursorMoved_ = function (event, x, y) {
    var currentFrame = this.piskelController.getCurrentFrame();
    var html = '';
    if (this.dragOrigin) {
      html += this.dragOrigin.x + ':' + this.dragOrigin.y + ' to ';
    }

    if (currentFrame.containsPixel(x, y)) {
      html += x + ':' + y;
      if (this.dragOrigin) {
        var dX = Math.abs(x-this.dragOrigin.x) + 1;
        var dY = Math.abs(y-this.dragOrigin.y) + 1;
        html += ' (' + dX + 'x' + dY +')';
      }
    }

    this.coordinatesContainer.innerHTML = html;
  };

  ns.CursorCoordinatesController.prototype.onDragStart_ = function (event, x, y) {
    this.dragOrigin = {x:x, y:y};
  };

  ns.CursorCoordinatesController.prototype.onDragEnd_ = function (event, x, y) {
    this.dragOrigin = null;
  };

})();