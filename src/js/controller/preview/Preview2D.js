(function () {
  var ns = $.namespace('pskl.controller.preview');

  ns.Preview2D = function (piskelController, container, testModeOn) {
    this.piskelController = piskelController;
    this.container = container;
    this.testModeOn = testModeOn;
  };

  ns.Preview2D.prototype.init = function () {
    this.renderer = new pskl.rendering.frame.BackgroundImageFrameRenderer(this.container);
  };

  ns.Preview2D.prototype.render = function (index, shouldUpdate) {
    if (this.renderFlag || shouldUpdate) {
      var frame = pskl.utils.LayerUtils.mergeFrameAt(this.piskelController.getLayers(), index);
      this.renderer.render(frame);
      this.renderFlag = false;
    }
  };

  ns.Preview2D.prototype.getToolButtons = function () {
    return ['original-size-button'];
  };

  ns.Preview2D.prototype.getName = function () {
    return 'Preview2D';
  };

  ns.Preview2D.prototype.setRenderFlag = function (bool) {
    this.renderFlag = bool;
  };

  // Method forwards
  ns.Preview2D.prototype.remove = function () {
    this.renderer.remove();
  };

  ns.Preview2D.prototype.resetCamera = function () {
    this.renderer.resetCamera();
  };

  ns.Preview2D.prototype.updateOpacity = function () {
    this.renderer.updateOpacity();
  };

  ns.Preview2D.prototype.setZoom = function (zoom) {
    this.renderer.setZoom(zoom);
  };

  ns.Preview2D.prototype.setRepeated = function (repeated) {
    this.renderer.setRepeated(repeated);
  };

  ns.Preview2D.prototype.updateSize = function (width, height) {
    // useless here
  };
})();
