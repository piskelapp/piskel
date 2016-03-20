(function () {
  var ns = $.namespace('pskl.model.frame');

  /**
   * Create a frame instance that provides an image getter. Can be faster
   * to use after merging using transparency. Transparent frames are merged to
   * an image and this allows to reuse the image rather than retransform into
   * a frame before calling the renderers.
   *
   * This rendered frame should only be used with renderers that support it.
   *
   * @param {Function} imageFn getter that will create the image
   * @param {Number} width image width in pixels
   * @param {Number} height image height in pixels
   * @param {String} id will be used as hash, so should be as unique as possible
   */
  ns.RenderedFrame = function (renderFn, width, height, id) {
    this.width = width;
    this.height = height;
    this.id = id;
    this.renderFn = renderFn;
  };

  ns.RenderedFrame.prototype.getRenderedFrame = function () {
    return this.renderFn();
  };

  ns.RenderedFrame.prototype.getHash = function () {
    return this.id;
  };

  ns.RenderedFrame.prototype.getWidth = function () {
    return this.width;
  };

  ns.RenderedFrame.prototype.getHeight = function () {
    return this.height;
  };

  ns.RenderedFrame.prototype.getPixels = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.containsPixel = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.isSameSize = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.clone = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.setPixels = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.clear = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.setPixel = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.getPixel = Constants.ABSTRACT_FUNCTION;
  ns.RenderedFrame.prototype.forEachPixel = Constants.ABSTRACT_FUNCTION;
})();
