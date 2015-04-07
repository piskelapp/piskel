(function () {
  var ns = $.namespace('pskl.rendering.frame');

  ns.TiledFrameRenderer = function (container, zoom) {
    this.container = container;
    this.setZoom(zoom);

    var containerEl = container.get(0);
    var containerDocument = containerEl.ownerDocument;
    this.displayContainer = containerDocument.createElement('div');
    this.displayContainer.classList.add('tiled-frame-container');
    container.get(0).appendChild(this.displayContainer);

    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.frameToDataUrl_.bind(this));
  };

  ns.TiledFrameRenderer.prototype.frameToDataUrl_ = function (frame) {
    var canvas = new pskl.utils.FrameUtils.toImage(frame, this.zoom);
    return canvas.toDataURL('image/png');
  };

  ns.TiledFrameRenderer.prototype.render = function (frame) {
    var imageSrc = this.cachedFrameProcessor.get(frame, this.zoom);
    this.displayContainer.style.backgroundImage = 'url(' + imageSrc + ')';
  };

  ns.TiledFrameRenderer.prototype.show = function () {
    if (this.displayContainer) {
      this.displayContainer.style.display = 'block';
    }
  };

  ns.TiledFrameRenderer.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
  };

  ns.TiledFrameRenderer.prototype.getZoom = function () {
    return this.zoom;
  };
})();