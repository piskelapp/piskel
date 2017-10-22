(function () {
  var ns = $.namespace('pskl.controller');

  ns.CursorCoordinatesController = function (piskelController) {
    this.piskelController = piskelController;
    this.origin = null;
    this.coordinates = {
      x : -1,
      y : -1
    };
  };

  ns.CursorCoordinatesController.prototype.init = function () {
    this.coordinatesContainer = document.querySelector('.cursor-coordinates');

    $.subscribe(Events.CURSOR_MOVED, this.onCursorMoved_.bind(this));
    $.subscribe(Events.DRAG_START, this.onDragStart_.bind(this));
    $.subscribe(Events.DRAG_END, this.onDragEnd_.bind(this));
    $.subscribe(Events.FRAME_SIZE_CHANGED, this.redraw.bind(this));
    $.subscribe(Events.ZOOM_CHANGED, this.redraw.bind(this));

    this.redraw();
  };

  ns.CursorCoordinatesController.prototype.redraw = function () {
    var html = '';
    if (this.origin) {
      html += this.origin.x + ':' + this.origin.y + ' to ';
    }

    var x = this.coordinates.x;
    var y = this.coordinates.y;
    var currentFrame = this.piskelController.getCurrentFrame();
    if (currentFrame.containsPixel(x, y)) {
      html += x + ':' + y;
      if (this.origin) {
        var dX = Math.abs(x - this.origin.x) + 1;
        var dY = Math.abs(y - this.origin.y) + 1;
        html += ' (' + dX + 'x' + dY + ')';
      }
    }

    if (pskl.app.drawingController) {
      var zoom = pskl.app.drawingController.compositeRenderer.getZoom().toFixed(2);
      html += '<div class="drawing-zoom">x' + zoom + '</div>';
    }

    this.coordinatesContainer.innerHTML = this.getFrameSizeHTML_() + html;
  };

  ns.CursorCoordinatesController.prototype.getFrameSizeHTML_ = function () {
    var w = this.piskelController.getWidth();
    var h = this.piskelController.getHeight();
    return '[' + w + 'x' + h + '] ';
  };

  ns.CursorCoordinatesController.prototype.onCursorMoved_ = function (event, x, y) {
    this.coordinates = {
      x : x,
      y : y
    };
    this.redraw();
  };

  ns.CursorCoordinatesController.prototype.onDragStart_ = function (event, x, y) {
    this.origin = {
      x : x,
      y : y
    };
    this.redraw();
  };

  ns.CursorCoordinatesController.prototype.onDragEnd_ = function (event) {
    this.origin = null;
    this.redraw();
  };
})();
