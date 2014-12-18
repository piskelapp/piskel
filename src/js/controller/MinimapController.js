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

    var containerHeight = this.container.height();
    var containerWidth = this.container.width();
    var displaySize = this.drawingController.getRenderer().getDisplaySize();
    var width  = displaySize.width / ratio;
    var height = displaySize.height / ratio;
    this.cropFrame.style.width = Math.min(width, containerWidth) + 'px';
    this.cropFrame.style.height = Math.min(height, containerHeight) + 'px';


    var containerSize = Math.max(containerHeight, containerWidth);
    var margin = this.drawingController.renderer.margin;

    var frame = this.piskelController.getCurrentFrame();
    var framePreviewWidth = frame.getWidth() * this.animationController.getZoom();
    var framePreviewHeight = frame.getHeight() * this.animationController.getZoom();

    var left = (containerSize - Math.max(width, framePreviewWidth))/2;
    left += offset.x * this.animationController.getZoom();
    left = Math.max(0, left);
    this.cropFrame.style.left = left +  'px';

    var top = (containerSize - Math.max(height, framePreviewHeight))/2;
    top += offset.y * this.animationController.getZoom();
    top = Math.max(0, top);
    this.cropFrame.style.top = top +  'px';


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
    var frame = this.piskelController.getCurrentFrame();
    var dim = Math.max(frame.getHeight(), frame.getWidth());
    var drawingAreaSize = dim * drawingAreaZoom;

    var containerHeight = this.container.height();
    var containerWidth = this.container.width();

    var containerSize = Math.max(containerHeight, containerWidth);

    var zoomRatio = drawingAreaSize / containerSize;

    return zoomRatio;
  };
})();