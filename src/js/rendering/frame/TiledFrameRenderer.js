(function () {
  var ns = $.namespace('pskl.rendering.frame');

  ns.TiledFrameRenderer = function (container, zoom) {
    this.container = container;
    this.setZoom(zoom);

    this.displayContainer = document.createElement('div');
    this.displayContainer.classList.add('tiled-frame-container');
    container.get(0).appendChild(this.displayContainer);
  };

  ns.TiledFrameRenderer.prototype.render = function (frame) {
    var canvas = new pskl.utils.FrameUtils.toImage(frame, this.zoom);
    this.displayContainer.style.backgroundImage = 'url(' + canvas.toDataURL('image/png') + ')';
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