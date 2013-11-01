(function () {
  var ns = $.namespace("pskl.controller");
  ns.AnimatedPreviewController = function (piskelController, container, dpi) {
    this.piskelController = piskelController;
    this.container = container;

    this.elapsedTime = 0;
    this.currentIndex = 0;

    this.setFPS(Constants.DEFAULT.FPS);

    var zoom = this.calculateZoom_();
    var renderingOptions = {
      "zoom": zoom,
      "height" : this.piskelController.getCurrentFrame().getHeight() * zoom,
      "width" : this.piskelController.getCurrentFrame().getWidth() * zoom
    };
    this.renderer = new pskl.rendering.frame.FrameRenderer(this.container, renderingOptions);

    $.subscribe(Events.FRAME_SIZE_CHANGED, this.updateZoom_.bind(this));
  };

  ns.AnimatedPreviewController.prototype.init = function () {
    // the oninput event won't work on IE10 unfortunately, but at least will provide a
    // consistent behavior across all other browsers that support the input type range
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=853670
    $("#preview-fps")[0].addEventListener('change', this.onFPSSliderChange.bind(this));
  };

  ns.AnimatedPreviewController.prototype.onFPSSliderChange = function (evt) {
    this.setFPS(parseInt($("#preview-fps")[0].value, 10));
  };

  ns.AnimatedPreviewController.prototype.setFPS = function (fps) {
    this.fps = fps;
    $("#preview-fps").val(this.fps);
    $("#display-fps").html(this.fps + " FPS");
  };

  ns.AnimatedPreviewController.prototype.getFPS = function () {
    return this.fps;
  };

  ns.AnimatedPreviewController.prototype.render = function (delta) {
    this.elapsedTime += delta;
    var index = Math.floor(this.elapsedTime / (1000/this.fps));
    if (index != this.currentIndex) {
      this.currentIndex = index;
      if (!this.piskelController.hasFrameAt(this.currentIndex)) {
        this.currentIndex = 0;
        this.elapsedTime = 0;
      }
      this.renderer.render(this.piskelController.getFrameAt(this.currentIndex));
    }
  };

  /**
   * Calculate the preview DPI depending on the framesheet size
   */
  ns.AnimatedPreviewController.prototype.calculateZoom_ = function () {
    var previewSize = 200,
      hZoom = previewSize / this.piskelController.getCurrentFrame().getHeight(),
      wZoom = previewSize / this.piskelController.getCurrentFrame().getWidth();

    return Math.min(hZoom, wZoom);
  };

  ns.AnimatedPreviewController.prototype.updateZoom_ = function () {
    var zoom = this.calculateZoom_();
    this.renderer.setZoom(zoom);
  };
})();