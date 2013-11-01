(function () {
  var ns = $.namespace('pskl.rendering.layer');

  ns.LayersRenderer = function (container, renderingOptions, piskelController) {
    pskl.rendering.CompositeRenderer.call(this);

    this.piskelController = piskelController;

    this.belowRenderer = new pskl.rendering.frame.CachedFrameRenderer(container, renderingOptions, ["layers-canvas", "layers-below-canvas"]);
    this.aboveRenderer = new pskl.rendering.frame.CachedFrameRenderer(container, renderingOptions, ["layers-canvas", "layers-above-canvas"]);

    this.add(this.belowRenderer);
    this.add(this.aboveRenderer);

    this.serializedRendering = '';
  };

  pskl.utils.inherit(pskl.rendering.layer.LayersRenderer, pskl.rendering.CompositeRenderer);

  ns.LayersRenderer.prototype.render = function () {
    var layers = this.piskelController.getLayers();
    var currentFrameIndex = this.piskelController.currentFrameIndex;
    var currentLayerIndex = this.piskelController.currentLayerIndex;

    var serializedRendering = [
      this.getZoom(),
      currentFrameIndex,
      currentLayerIndex,
      layers.length
    ].join("-");

    if (this.serializedRendering != serializedRendering) {
      this.serializedRendering = serializedRendering;

      this.clear();

      var downLayers = layers.slice(0, currentLayerIndex);
      if (downLayers.length > 0) {
        var downFrame = this.getFrameForLayersAt_(currentFrameIndex, downLayers);
        this.belowRenderer.render(downFrame);
      }

      var upLayers = layers.slice(currentLayerIndex + 1, layers.length);
      if (upLayers.length > 0) {
        var upFrame = this.getFrameForLayersAt_(currentFrameIndex, upLayers);
        this.aboveRenderer.render(upFrame);
      }

    }
  };

  ns.LayersRenderer.prototype.getFrameForLayersAt_ = function (frameIndex, layers) {
    var frames = layers.map(function (l) {
      return l.getFrameAt(frameIndex);
    });
    return pskl.utils.FrameUtils.merge(frames);
  };
})();
