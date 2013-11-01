(function () {
  var ns = $.namespace('pskl.rendering');

  ns.RendererManager = function () {
    this.renderers = [];
  };

  ns.RendererManager.prototype.add = function (renderer) {
    this.renderers.push(renderer);
    return this;
  };

  ns.RendererManager.prototype.setZoom = function (zoom) {
    this.renderers.forEach(function (renderer) {
      renderer.setZoom(zoom);
    });
  };

  ns.RendererManager.prototype.setDisplaySize = function (w, h) {
    this.renderers.forEach(function (renderer) {
      renderer.setDisplaySize(w, h);
    });
  };

  ns.RendererManager.prototype.moveOffset = function (offsetX, offsetY) {
    this.renderers.forEach(function (renderer) {
      renderer.moveOffset(offsetX, offsetY);
    });
  };
})();