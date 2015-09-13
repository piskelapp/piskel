(function () {
  var ns = $.namespace('pskl.rendering.frame');

  ns.BackgroundImageFrameRenderer = function (container, zoom) {
    this.container = container;
    this.setZoom(zoom);

    var containerEl = container.get(0);
    var containerDocument = containerEl.ownerDocument;
    this.frameContainer = containerDocument.createElement('div');
    this.frameContainer.classList.add('background-image-frame-container');
    container.get(0).appendChild(this.frameContainer);

    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.frameToDataUrl_.bind(this));
  };

  ns.BackgroundImageFrameRenderer.prototype.frameToDataUrl_ = function (frame) {
    var canvas = new pskl.utils.FrameUtils.toImage(frame, this.zoom);
    return canvas.toDataURL('image/png');
  };

  ns.BackgroundImageFrameRenderer.prototype.render = function (frame) {
    var imageSrc = this.cachedFrameProcessor.get(frame, this.zoom);
    this.frameContainer.style.backgroundImage = 'url(' + imageSrc + ')';
  };

  ns.BackgroundImageFrameRenderer.prototype.show = function () {
    if (this.frameContainer) {
      this.frameContainer.style.display = 'block';
    }
  };

  ns.BackgroundImageFrameRenderer.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
  };

  ns.BackgroundImageFrameRenderer.prototype.getZoom = function () {
    return this.zoom;
  };

  ns.BackgroundImageFrameRenderer.prototype.setRepeated = function (repeat) {
    var repeatValue;
    if (repeat) {
      repeatValue = 'repeat';
    } else {
      repeatValue = 'no-repeat';
    }
    this.frameContainer.style.backgroundRepeat = repeatValue;
  };
})();
