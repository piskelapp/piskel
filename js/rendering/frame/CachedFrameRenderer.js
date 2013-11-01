(function () {
  var ns = $.namespace('pskl.rendering.frame');

  /**
   * FrameRenderer implementation that prevents unnecessary redraws.
   * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
   * @param {Object} renderingOptions
   * @param {Array} classes array of strings to use for css classes
   */
  ns.CachedFrameRenderer = function (container, renderingOptions, classes) {
    pskl.rendering.frame.FrameRenderer.call(this, container, renderingOptions, classes);
    this.serializedFrame = '';
  };

  pskl.utils.inherit(pskl.rendering.frame.CachedFrameRenderer, pskl.rendering.frame.FrameRenderer);

  ns.CachedFrameRenderer.prototype.render = function (frame) {
    var offset = this.getOffset();
    var size = this.getDisplaySize();
    var serializedFrame = [this.getZoom(), offset.x, offset.y, size.width, size.height, frame.serialize()].join('-');
    if (this.serializedFrame != serializedFrame) {
      this.serializedFrame = serializedFrame;
      this.superclass.render.call(this, frame);
    }
  };
})();
