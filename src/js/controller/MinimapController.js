(function () {
  var ns = $.namespace('pskl.controller');

  ns.MinimapController = function (piskelController, animationController, drawingController, container) {
    this.piskelController = piskelController;
    this.animationController = animationController;
    this.drawingController = drawingController;
    this.container = container;

    this.isClicked = false;
  };

  ns.MinimapController.prototype.init = function () {
    // Create minimap DOM elements
    this.cropFrame = document.createElement('DIV');
    this.cropFrame.className = 'minimap-crop-frame';
    this.cropFrame.style.display = 'none';
    $(this.container).append(this.cropFrame);

    // Init mouse events
    $(this.container).mousedown(this.onMinimapMousedown_.bind(this));
    $('body').mousemove(this.onMinimapMousemove_.bind(this));
    $('body').mouseup(this.onMinimapMouseup_.bind(this));

    $.subscribe(Events.ZOOM_CHANGED, $.proxy(this.renderMinimap_, this));
  };

  ns.MinimapController.prototype.renderMinimap_ = function () {
    var zoomRatio = this.getDrawingAreaZoomRatio_();
    if (zoomRatio > 1) {
      this.displayCropFrame_(zoomRatio, this.drawingController.getRenderer().getOffset());
    } else {
      this.hideCropFrame_();
    }
  };

  ns.MinimapController.prototype.displayCropFrame_ = function (ratio, offset) {
    this.cropFrame.style.display = 'block';
    this.cropFrame.style.top = (offset.y * this.animationController.getZoom()) +  'px';
    this.cropFrame.style.left = (offset.x * this.animationController.getZoom()) +  'px';
    var zoomRatio = this.getDrawingAreaZoomRatio_();
    this.cropFrame.style.width = (this.container.width() / zoomRatio) +  'px';
    this.cropFrame.style.height = (this.container.height() / zoomRatio) +  'px';

  };

  ns.MinimapController.prototype.hideCropFrame_ = function () {
    this.cropFrame.style.display = 'none';
  };

  ns.MinimapController.prototype.onMinimapMousemove_ = function (evt) {
    if (this.isClicked) {
      if (this.getDrawingAreaZoomRatio_() > 1) {
        var coords = this.getCoordinatesCenteredAround_(evt.clientX, evt.clientY);
        this.drawingController.setOffset(coords.x, coords.y);
      }
    }
  };

  ns.MinimapController.prototype.onMinimapMousedown_ = function (evt) {
    this.isClicked = true;
  };

  ns.MinimapController.prototype.onMinimapMouseup_ = function (evt) {
    this.isClicked = false;
  };

  ns.MinimapController.prototype.getCoordinatesCenteredAround_ = function (x, y) {
    var frameCoords = this.animationController.getCoordinates(x, y);
    var zoomRatio = this.getDrawingAreaZoomRatio_();
    var frameWidth = this.piskelController.getCurrentFrame().getWidth();
    var frameHeight = this.piskelController.getCurrentFrame().getHeight();

    var width = frameWidth / zoomRatio;
    var height = frameHeight / zoomRatio;

    return {
      x : frameCoords.x - (width/2),
      y : frameCoords.y - (height/2)
    };
  };

  ns.MinimapController.prototype.getDrawingAreaZoomRatio_ = function () {
    var drawingAreaZoom = this.drawingController.getRenderer().getZoom();
    var drawingAreaFullHeight = this.piskelController.getCurrentFrame().getHeight() * drawingAreaZoom;
    var zoomRatio = drawingAreaFullHeight / this.drawingController.getRenderer().getDisplaySize().height;

    return zoomRatio;
  };
})();