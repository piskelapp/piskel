(function () {
  var ns = $.namespace('pskl.rendering.frame');

  /**
   * Cached renderer that can uses the same constructor as pskl.rendering.FrameRenderer
   * It will build a FrameRenderer on the fly to use as decorated renderer
   * @param {HtmlElement} container HtmlElement to use as parentNode of the Frame
   * @param {Object} renderingOptions
   * @param {Array} classes array of strings to use for css classes
   */
  ns.CachedFrameRenderer = function (container, renderingOptions, classes) {
    var frameRenderer = new pskl.rendering.frame.FrameRenderer(container, renderingOptions, classes);
    pskl.rendering.CachedRenderer.call(this, frameRenderer);
  };

  pskl.utils.inherit(pskl.rendering.frame.CachedFrameRenderer, pskl.rendering.CachedRenderer);

})();
