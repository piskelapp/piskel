(function () {
  var ns = $.namespace('pskl.rendering');

  ns.OnionSkinRenderer = function (renderer, piskelController) {
    pskl.rendering.CompositeRenderer.call(this);

    this.piskelController = piskelController;
    this.renderer = renderer;
    this.add(this.renderer);

    this.hash = '';
  };

  ns.OnionSkinRenderer.createInContainer = function (container, renderingOptions, piskelController) {
    // Do not use CachedFrameRenderers here, caching is performed in the render method
    var renderer = new pskl.rendering.frame.FrameRenderer(container, renderingOptions, ['onion-skin-canvas']);
    return new ns.OnionSkinRenderer(renderer, piskelController);
  };

  pskl.utils.inherit(pskl.rendering.OnionSkinRenderer, pskl.rendering.CompositeRenderer);

  ns.OnionSkinRenderer.prototype.render = function () {
    var frames = this.getOnionFrames_();
    var hash = this.computeHash_(frames);
    if (this.hash != hash) {
      this.hash = hash;
      this.clear();
      if (frames.length > 0) {
        var mergedFrame = pskl.utils.FrameUtils.merge(frames);
        this.renderer.render(mergedFrame);
      }
    }
  };

  ns.OnionSkinRenderer.prototype.getOnionFrames_ = function () {
    var frames = [];

    var currentFrameIndex = this.piskelController.getCurrentFrameIndex();
    var layer = this.piskelController.getCurrentLayer();

    var previousIndex = currentFrameIndex - 1;
    var previousFrame = layer.getFrameAt(previousIndex);
    if (previousFrame) {
      frames.push(previousFrame);
    }

    var nextIndex = currentFrameIndex + 1;
    var nextFrame = layer.getFrameAt(nextIndex);
    if (nextFrame) {
      frames.push(nextFrame);
    }

    return frames;
  };

  ns.OnionSkinRenderer.prototype.computeHash_ = function (frames) {
    var offset = this.getOffset();
    var size = this.getDisplaySize();
    var layers = this.piskelController.getLayers();
    return [
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
    ].join('-');
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
    this.hash = '';
  };
})();
