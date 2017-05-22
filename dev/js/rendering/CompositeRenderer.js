(function () {
  var ns = $.namespace('pskl.rendering');

  ns.CompositeRenderer = function () {
    this.renderers = [];
  };

  pskl.utils.inherit(pskl.rendering.CompositeRenderer, pskl.rendering.AbstractRenderer);

  ns.CompositeRenderer.prototype.add = function (renderer) {
    this.renderers.push(renderer);
    return this;
  };

  ns.CompositeRenderer.prototype.clear = function () {
    this.renderers.forEach(function (renderer) {
      renderer.clear();
    });
  };

  ns.CompositeRenderer.prototype.setZoom = function (zoom) {
    this.renderers.forEach(function (renderer) {
      renderer.setZoom(zoom);
    });
  };

  ns.CompositeRenderer.prototype.getZoom = function () {
    return this.getSampleRenderer_().getZoom();
  };

  ns.CompositeRenderer.prototype.setDisplaySize = function (w, h) {
    this.renderers.forEach(function (renderer) {
      renderer.setDisplaySize(w, h);
    });
  };

  ns.CompositeRenderer.prototype.getDisplaySize = function () {
    return this.getSampleRenderer_().getDisplaySize();
  };

  ns.CompositeRenderer.prototype.setOffset = function (x, y) {
    this.renderers.forEach(function (renderer) {
      renderer.setOffset(x, y);
    });
  };

  ns.CompositeRenderer.prototype.getOffset = function () {
    return this.getSampleRenderer_().getOffset();
  };

  ns.CompositeRenderer.prototype.setGridWidth = function (b) {
    this.renderers.forEach(function (renderer) {
      renderer.setGridWidth(b);
    });
  };

  ns.CompositeRenderer.prototype.getGridWidth = function () {
    return this.getSampleRenderer_().getGridWidth();
  };

  ns.CompositeRenderer.prototype.getSampleRenderer_ = function () {
    if (this.renderers.length > 0) {
      return this.renderers[0];
    } else {
      throw 'Renderer manager is empty';
    }
  };
})();
