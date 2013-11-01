(function () {
  var ns = $.namespace('pskl.rendering');

  /**
   * Decorator on a renderer that will only render the frame if something has changed in the frame itself or in the renderer's configuration
   * @param {pskl.rendering.AbstractRenderer} renderer
   */
  ns.CachedRenderer = function (renderer) {
    this.decoratedRenderer = renderer;
    this.serializedFrame = '';
  };

  pskl.utils.inherit(ns.CachedRenderer, ns.AbstractRenderer);

  ns.CachedRenderer.prototype.render = function (frame) {
    var offset = this.getOffset();
    var size = this.getDisplaySize();
    var serializedFrame = [this.getZoom(), offset.x, offset.y, size.width, size.height, frame.serialize()].join('-');
    if (this.serializedFrame != serializedFrame) {
      this.serializedFrame = serializedFrame;
      this.decoratedRenderer.render(frame);
    }
  };

  ns.CachedRenderer.prototype.clear = function () {
    this.decoratedRenderer.clear();
  };

  ns.CachedRenderer.prototype.getCoordinates = function (x, y) {
    return this.decoratedRenderer.getCoordinates(x, y);
  };

  ns.CachedRenderer.prototype.setGridEnabled = function (b) {
    this.decoratedRenderer.setGridEnabled(b);
  };

  ns.CachedRenderer.prototype.isGridEnabled = function () {
    return this.decoratedRenderer.isGridEnabled();
  };

  ns.CachedRenderer.prototype.getZoom = function () {
    return this.decoratedRenderer.getZoom();
  };

  ns.CachedRenderer.prototype.setZoom = function (zoom) {
    return this.decoratedRenderer.setZoom(zoom);
  };

  ns.CachedRenderer.prototype.moveOffset = function (x, y) {
    this.decoratedRenderer.moveOffset(x, y);
  };

  ns.CachedRenderer.prototype.getOffset = function () {
    return this.decoratedRenderer.getOffset();
  };

  ns.CachedRenderer.prototype.setDisplaySize = function (w, h) {
    this.decoratedRenderer.setDisplaySize(w, h);
  };

  ns.CachedRenderer.prototype.getDisplaySize = function () {
    return this.decoratedRenderer.getDisplaySize();
  };
})();