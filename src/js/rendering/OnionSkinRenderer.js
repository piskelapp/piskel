(function () {
  var ns = $.namespace('pskl.rendering');

  ns.OnionSkinRenderer = function (container, renderingOptions, piskelController) {
    pskl.rendering.CompositeRenderer.call(this);

    this.piskelController = piskelController;

    // Do not use CachedFrameRenderers here, since the caching will be performed in the render method of LayersRenderer
    this.renderer = new pskl.rendering.frame.FrameRenderer(container, renderingOptions, ["onion-skin-canvas"]);

    this.add(this.renderer);

    this.serializedRendering = '';
  };

  pskl.utils.inherit(pskl.rendering.OnionSkinRenderer, pskl.rendering.CompositeRenderer);

  ns.OnionSkinRenderer.prototype.render = function () {
    var offset = this.getOffset();
    var size = this.getDisplaySize();
    var layers = this.piskelController.getLayers();
    var currentFrameIndex = this.piskelController.getCurrentFrameIndex();

    var frames = [];
    this.addFrameAtIndexToArray_(currentFrameIndex - 1, frames);
    this.addFrameAtIndexToArray_(currentFrameIndex + 1, frames);

    var serializedRendering = [
      this.getZoom(),
      this.getGridWidth(),
      offset.x,
      offset.y,
      size.width,
      size.height,
      frames.map(function (f) {
        return f.getHash();
      }).join('-'),
      layers.length
    ].join("-");


    if (this.serializedRendering != serializedRendering) {
      this.serializedRendering = serializedRendering;

      if (frames.length > 0) {
        this.clear();
        var mergedFrame = pskl.utils.FrameUtils.merge(frames);
        this.renderer.render(mergedFrame);
      }
    }
  };

  ns.OnionSkinRenderer.prototype.addFrameAtIndexToArray_ = function (frameIndex, frames) {
    var layer = this.piskelController.getCurrentLayer();
    if (this.piskelController.hasFrameAt(frameIndex)) {
      frames.push(layer.getFrameAt(frameIndex));
    }
  };

  /**
   * See @pskl.rendering.frame.CachedFrameRenderer
   * Same issue : FrameRenderer setDisplaySize destroys the canvas
   * @param {Number} width
   * @param {Number} height
   */
  ns.OnionSkinRenderer.prototype.setDisplaySize = function (width, height) {
    var size = this.getDisplaySize();
    if (size.width !== width || size.height !== height) {
      this.superclass.setDisplaySize.call(this, width, height);
    }
  };

  ns.OnionSkinRenderer.prototype.flush = function () {
    this.serializedRendering = '';
  };
})();