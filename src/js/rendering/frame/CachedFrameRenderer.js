(function () {
  var ns = $.namespace('pskl.rendering.frame');

  /**
   * FrameRenderer implementation that prevents unnecessary redraws.
   * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
   * @param {Object} renderingOptions
   * @param {Array} classList array of strings to use for css classes
   */
  ns.CachedFrameRenderer = function (container, renderingOptions, classList) {
    pskl.rendering.frame.FrameRenderer.call(this, container, renderingOptions, classList);
    this.serializedFrame = '';
  };

  pskl.utils.inherit(pskl.rendering.frame.CachedFrameRenderer, pskl.rendering.frame.FrameRenderer);

  /**
   * Only call display size if provided values are different from current values.
   * FrameRenderer:setDisplaySize destroys the underlying canvas
   * If the canvas is destroyed, a rendering is mandatory.
   * (Alternatively we could find a way to force the rendering of the CachedFrameRenderer from the outside)
   * @param {Number} width
   * @param {Number} height
   */
  ns.CachedFrameRenderer.prototype.setDisplaySize = function (width, height) {
    if (this.displayWidth !== width || this.displayHeight !== height) {
      this.superclass.setDisplaySize.call(this, width, height);
    }
  };

  ns.CachedFrameRenderer.prototype.render = function (frame) {
    var offset = this.getOffset();
    var size = this.getDisplaySize();
    var serializedFrame = [
      this.getZoom(),
      this.getGridWidth(),
      pskl.UserSettings.get('SEAMLESS_MODE'),
      pskl.UserSettings.get('SEAMLESS_OPACITY'),
      offset.x, offset.y,
      size.width, size.height,
      frame.getHash()
    ].join('-');

    if (this.serializedFrame != serializedFrame) {
      this.serializedFrame = serializedFrame;
      this.superclass.render.call(this, frame);
    }
  };
})();
