(function () {
  var ns = $.namespace('pskl.rendering.frame');

  var CACHE_RESET_INTERVAL = 1000 * 60 * 10;

  ns.TiledFrameRenderer = function (container, zoom) {
    this.container = container;
    this.setZoom(zoom);

    this.displayContainer = document.createElement('div');
    this.displayContainer.classList.add('tiled-frame-container');
    container.get(0).appendChild(this.displayContainer);

    this.cache_ = {};
    window.setInterval(function () {this.cache_ = {};}.bind(this), CACHE_RESET_INTERVAL);
  };

  ns.TiledFrameRenderer.prototype.render = function (frame) {
    var frameData = null;

    var hash = frame.getHash();
    if (this.cache_[hash]) {
      frameData = this.cache_[hash];
    } else {
      var frameAsString = JSON.stringify(frame.getPixels());
      if (this.cache_[frameAsString]) {
        frameData = this.cache_[frameAsString];
      } else {
        var canvas = new pskl.utils.FrameUtils.toImage(frame, this.zoom);
        frameData = canvas.toDataURL('image/png');
        this.cache_[frameAsString] = frameData;
      }

      this.cache_[hash] = frameData;
    }

    this.displayContainer.style.backgroundImage = 'url(' + frameData + ')';
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